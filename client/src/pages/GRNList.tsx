import { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, Modal, Form, Select, InputNumber, message } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

type GRN = {
  _id: string;
  supplierId: { _id: string; name: string };
  date: string;
  items: Array<{ rawMaterialId: { _id: string; name: string; unit: string }; qty: number; unitCost: number; unit: string }>;
  status: string;
};

const statusColor: Record<string, string> = { DRAFT: 'default', CONFIRMED: 'success' };

export default function GRNList() {
  const [items, setItems] = useState<GRN[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ _id: string; name: string }>>([]);
  const [rawProducts, setRawProducts] = useState<Array<{ _id: string; name: string; unit: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: { items: GRN[] } }>('/grns?limit=100'),
      api.get<{ success: boolean; data: { items: Array<{ _id: string; name: string }> } }>('/suppliers?limit=200'),
      api.get<{ success: boolean; data: { items: Array<{ _id: string; name: string; unit: string }> } }>('/products?type=RAW_MATERIAL&limit=200'),
    ])
      .then(([grns, sup, prods]) => {
        if (grns.data.success && grns.data.data?.items) setItems(grns.data.data.items);
        if (sup.data.success && sup.data.data?.items) setSuppliers(sup.data.data.items);
        if (prods.data.success && prods.data.data?.items) setRawProducts(prods.data.data.items);
      })
      .catch(() => message.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const confirmGrn = async (id: string) => {
    try {
      await api.post(`/grns/${id}/confirm`);
      message.success('GRN confirmed');
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const onFinish = async (values: { supplierId: string; items: Array<{ rawMaterialId: string; qty: number; unitCost: number; unit: string }> }) => {
    try {
      await api.post('/grns', { supplierId: values.supplierId, items: values.items });
      message.success('GRN created');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const columns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (d: string) => new Date(d).toLocaleDateString() },
    { title: 'Supplier', dataIndex: ['supplierId', 'name'], key: 'supplier' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string, r: GRN) => (
        <Space>
          <Tag color={statusColor[s] ?? 'default'}>{s}</Tag>
          {s === 'DRAFT' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => confirmGrn(r._id)}>Confirm</Button>
          )}
        </Space>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      render: (_: unknown, r: GRN) => r.items?.map((i) => `${(i.rawMaterialId as { name: string })?.name}: ${i.qty} ${i.unit}`).join(', ') ?? '-',
    },
  ];

  return (
    <>
      <Title level={4} className="page-title">GRN (Goods Received Note)</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>New GRN</Button>
      </Space>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />
      <Modal title="New GRN" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={600} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="supplierId" label="Supplier" rules={[{ required: true }]}>
            <Select placeholder="Select supplier" options={suppliers.map((s) => ({ value: s._id, label: s.name }))} />
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={[name, 'rawMaterialId']} rules={[{ required: true }]}>
                      <Select placeholder="Raw material" style={{ width: 200 }} options={rawProducts.map((p) => ({ value: p._id, label: `${p.name} (${p.unit})` }))} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'qty']} rules={[{ required: true }]}>
                      <InputNumber min={0.01} placeholder="Qty" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unitCost']} rules={[{ required: true }]}>
                      <InputNumber min={0} placeholder="Unit cost" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unit']} rules={[{ required: true }]}>
                      <Select placeholder="Unit" style={{ width: 80 }} options={[...new Set(rawProducts.map((p) => p.unit))].map((u) => ({ value: u, label: u }))} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(name)}>Remove</Button>
                  </Space>
                ))}
                <Form.Item><Button type="dashed" onClick={() => add()} block>+ Add line</Button></Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create GRN</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
