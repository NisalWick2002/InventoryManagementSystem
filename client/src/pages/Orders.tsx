import { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, Modal, Form, Select, InputNumber, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '../api/client';
import { useAuth } from '../app/AuthContext';

const { Title } = Typography;

type Order = {
  _id: string;
  wholesalerId: { _id: string; name: string };
  items: Array<{ finishedProductId: { _id: string; name: string }; qty: number; unit: string }>;
  status: string;
  createdAt: string;
};

  const statusColor: Record<string, string> = { DRAFT: 'default', CONFIRMED: 'processing', DISPATCHED: 'success', CANCELLED: 'error' };

export default function Orders() {
  const { appUser } = useAuth();
  const [items, setItems] = useState<Order[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<Array<{ _id: string; name: string; sku: string; unit: string }>>([]);
  const [wholesalers, setWholesalers] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    const url = appUser?.role === 'WHOLESALER' ? '/orders/my' : '/orders';
    api.get<{ success: boolean; data: { items: Order[] } }>(`${url}?limit=100`)
      .then((r) => { if (r.data.success && r.data.data?.items) setItems(r.data.data.items); })
      .catch(() => message.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (appUser?.role !== 'WHOLESALER') {
      api.get<{ success: boolean; data: { items: Array<{ _id: string; name: string }> } }>('/wholesalers?limit=200')
        .then((r) => { if (r.data.success && r.data.data?.items) setWholesalers(r.data.data.items); });
    }
    api.get<{ success: boolean; data: { items: Array<{ _id: string; name: string; sku: string; unit: string }> } }>('/products?type=FINISHED_GOOD&limit=200')
      .then((r) => { if (r.data.success && r.data.data?.items) setFinishedProducts(r.data.data.items); });
  }, [appUser?.role]);

  const createOrder = async (values: { wholesalerId?: string; items: Array<{ finishedProductId: string; qty: number; unit: string }> }) => {
    try {
      const body = appUser?.role === 'WHOLESALER'
        ? { items: values.items }
        : { wholesalerId: values.wholesalerId, items: values.items };
      await api.post('/orders', body);
      message.success('Order created');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      message.success('Order updated');
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const columns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: (d: string) => d ? new Date(d).toLocaleDateString() : '-' },
    { title: 'Wholesaler', dataIndex: ['wholesalerId', 'name'], key: 'wholesaler' },
    {
      title: 'Items',
      key: 'items',
      render: (_: unknown, r: Order) => r.items?.map((i) => `${(i.finishedProductId as { name: string })?.name}: ${i.qty} ${i.unit}`).join(', ') ?? '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 200,
      render: (s: string, r: Order) => (
        <Space>
          <Tag color={statusColor[s] ?? 'default'}>{s}</Tag>
          {appUser?.role !== 'WHOLESALER' && s === 'DRAFT' && (
            <Button type="link" size="small" onClick={() => updateStatus(r._id, 'CONFIRMED')}>Confirm</Button>
          )}
          {appUser?.role !== 'WHOLESALER' && ['DRAFT', 'CONFIRMED'].includes(s) && (
            <Button type="link" size="small" danger onClick={() => updateStatus(r._id, 'CANCELLED')}>Cancel</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Title level={4} className="page-title">Orders</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New Order</Button>
      </Space>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />
      <Modal title="New Order" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={560} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={createOrder}>
          {appUser?.role !== 'WHOLESALER' && (
            <Form.Item name="wholesalerId" label="Wholesaler" rules={[{ required: true }]}>
              <Select placeholder="Select wholesaler" options={wholesalers.map((w) => ({ value: w._id, label: w.name }))} />
            </Form.Item>
          )}
          <Form.List name="items" rules={[{ validator: async () => { if (!form.getFieldValue('items')?.length) return Promise.reject(new Error('Add at least one item')); } }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={[name, 'finishedProductId']} rules={[{ required: true, message: 'Required' }]}>
                      <Select placeholder="Product" style={{ width: 200 }} options={finishedProducts.map((p) => ({ value: p._id, label: `${p.name} (${p.unit})` }))} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'qty']} rules={[{ required: true, message: 'Required' }]}>
                      <InputNumber min={1} placeholder="Qty" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unit']} rules={[{ required: true, message: 'Required' }]}>
                      <Select placeholder="Unit" style={{ width: 80 }} options={finishedProducts.length ? [...new Set(finishedProducts.map((p) => p.unit))].map((u) => ({ value: u, label: u })) : []} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(name)}>Remove</Button>
                  </Space>
                ))}
                <Form.Item><Button type="dashed" onClick={() => add()} block>+ Add item</Button></Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Order</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
