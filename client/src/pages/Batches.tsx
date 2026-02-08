import { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, message } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

type Batch = {
  _id: string;
  batchId: string;
  finishedProductId: { _id: string; name: string; sku: string };
  plannedQty: number;
  actualQtyProduced: number;
  manufactureDate: string;
  expiryDate: string;
  status: string;
  wastageQty?: number;
};

const statusColor: Record<string, string> = {
  DRAFT: 'default',
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
  RELEASED: 'green',
};

export default function Batches() {
  const [items, setItems] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get<{ success: boolean; data: { items: Batch[] } }>('/batches?limit=100')
      .then((r) => { if (r.data.success && r.data.data?.items) setItems(r.data.data.items); })
      .catch(() => message.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const startBatch = async (id: string) => {
    try {
      await api.post(`/batches/${id}/start`);
      message.success('Batch started');
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const columns = [
    { title: 'Batch ID', dataIndex: 'batchId', key: 'batchId', width: 180 },
    { title: 'Product', key: 'product', render: (_: unknown, r: Batch) => (r.finishedProductId as { name: string })?.name ?? '-' },
    { title: 'Planned', dataIndex: 'plannedQty', key: 'plannedQty', width: 90 },
    { title: 'Actual', dataIndex: 'actualQtyProduced', key: 'actualQtyProduced', width: 90 },
    { title: 'Manufacture', dataIndex: 'manufactureDate', key: 'manufactureDate', width: 110, render: (d: string) => d ? new Date(d).toLocaleDateString() : '-' },
    { title: 'Expiry', dataIndex: 'expiryDate', key: 'expiryDate', width: 110, render: (d: string) => d ? new Date(d).toLocaleDateString() : '-' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string, r: Batch) => (
        <Space>
          <Tag color={statusColor[s] ?? 'default'}>{s?.replace('_', ' ') ?? s}</Tag>
          {s === 'DRAFT' && <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => startBatch(r._id)}>Start</Button>}
        </Space>
      ),
    },
    { title: 'Wastage', dataIndex: 'wastageQty', key: 'wastageQty', width: 80, render: (v: number) => v ?? 0 },
  ];

  return (
    <>
      <Title level={4} className="page-title">Batches</Title>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />
    </>
  );
}
