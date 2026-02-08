import { useEffect, useState } from 'react';
import { Table, Button, Typography, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

type Wholesaler = { _id: string; name: string; contactPerson?: string; phone?: string; email?: string; address?: string };

export default function Wholesalers() {
  const [items, setItems] = useState<Wholesaler[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    api.get<{ success: boolean; data: { items: Wholesaler[] } }>('/wholesalers?limit=200')
      .then((r) => { if (r.data.success && r.data.data?.items) setItems(r.data.data.items); })
      .catch(() => message.error('Failed to load wholesalers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const onFinish = async (values: Record<string, string>) => {
    try {
      await api.post('/wholesalers', values);
      message.success('Wholesaler created');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Contact', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
  ];

  return (
    <>
      <Title level={4} className="page-title">Wholesalers</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add Wholesaler</Button>
      </Space>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />
      <Modal title="Add Wholesaler" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contactPerson" label="Contact Person"><Input /></Form.Item>
          <Form.Item name="phone" label="Phone"><Input /></Form.Item>
          <Form.Item name="email" label="Email"><Input type="email" /></Form.Item>
          <Form.Item name="address" label="Address"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
