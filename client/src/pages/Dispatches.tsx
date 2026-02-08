import { useEffect, useState } from 'react';
import { Table, Button, Typography, Space, Modal, Form, Select, message } from 'antd';
import { PlusOutlined, FilePdfOutlined } from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

type Dispatch = {
  _id: string;
  orderId: { _id: string };
  allocations: Array<{ batchId: { batchId: string }; productId: { name: string }; qty: number; unit: string }>;
  dispatchedAt: string;
};

export default function Dispatches() {
  const [items, setItems] = useState<Dispatch[]>([]);
  const [orders, setOrders] = useState<Array<{ _id: string; status: string; wholesalerId: { name: string } }>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: { items: Dispatch[] } }>('/dispatches?limit=100'),
      api.get<{ success: boolean; data: { items: Array<{ _id: string; status: string; wholesalerId: { name: string } }> } }>('/orders?limit=200'),
    ])
      .then(([disp, ord]) => {
        if (disp.data.success && disp.data.data?.items) setItems(disp.data.data.items);
        if (ord.data.success && ord.data.data?.items) setOrders(ord.data.data.items.filter((o) => o.status === 'CONFIRMED'));
      })
      .catch(() => message.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const createDispatch = async (values: { orderId: string }) => {
    try {
      await api.post('/dispatches', { orderId: values.orderId });
      message.success('Dispatch created (FEFO allocated)');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const downloadPdf = async (id: string) => {
    try {
      const res = await api.get(`/dispatches/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-note-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      message.error('Failed to download PDF');
    }
  };

  const columns = [
    { title: 'Dispatched At', dataIndex: 'dispatchedAt', key: 'dispatchedAt', width: 120, render: (d: string) => d ? new Date(d).toLocaleString() : '-' },
    { title: 'Order ID', key: 'orderId', render: (_: unknown, r: Dispatch) => (r.orderId as { _id: string })?. _id ?? '-' },
    {
      title: 'Allocations',
      key: 'allocations',
      render: (_: unknown, r: Dispatch) => r.allocations?.map((a) => `${(a.productId as { name: string })?.name}: ${a.qty} (batch ${(a.batchId as { batchId: string })?.batchId})`).join('; ') ?? '-',
    },
    {
      title: 'PDF',
      key: 'pdf',
      width: 80,
      render: (_: unknown, r: Dispatch) => (
        <Button type="link" size="small" icon={<FilePdfOutlined />} onClick={() => downloadPdf(r._id)}>PDF</Button>
      ),
    },
  ];

  return (
    <>
      <Title level={4} className="page-title">Dispatches</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Create Dispatch</Button>
      </Space>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />
      <Modal title="Create Dispatch (FEFO)" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={(values) => createDispatch(values as { orderId: string })}>
          <Form.Item name="orderId" label="Confirmed Order" rules={[{ required: true }]}>
            <Select
              placeholder="Select order"
              options={orders.map((o) => ({ value: o._id, label: `Order ${o._id.slice(-6)} - ${(o.wholesalerId as { name: string })?.name}` }))}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Dispatch</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
