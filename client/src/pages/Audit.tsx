import { useEffect, useState } from 'react';
import { Table, Typography, message } from 'antd';
import { api } from '../api/client';

const { Title } = Typography;

type AuditEntry = {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userEmail: string;
  details?: Record<string, unknown>;
  createdAt: string;
};

export default function Audit() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<{ success: boolean; data: { items: AuditEntry[] } }>('/audit?limit=100')
      .then((r) => { if (r.data.success && r.data.data?.items) setItems(r.data.data.items); })
      .catch(() => message.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (d: string) => d ? new Date(d).toLocaleString() : '-' },
    { title: 'Action', dataIndex: 'action', key: 'action', width: 140 },
    { title: 'Resource', dataIndex: 'resource', key: 'resource', width: 120 },
    { title: 'Resource ID', dataIndex: 'resourceId', key: 'resourceId', width: 100, ellipsis: true },
    { title: 'User', dataIndex: 'userEmail', key: 'userEmail' },
    { title: 'Details', dataIndex: 'details', key: 'details', render: (d: Record<string, unknown>) => d ? JSON.stringify(d) : '-' },
  ];

  return (
    <>
      <Title level={4} className="page-title">Audit Log (OWNER only)</Title>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />
    </>
  );
}
