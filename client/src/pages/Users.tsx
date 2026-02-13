import { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, Modal, Form, Input, Select, message, Alert } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

type User = { _id: string; email: string; displayName?: string; role: string; firebaseUid: string };

export default function Users() {
  const [items, setItems] = useState<User[]>([]);
  const [wholesalers, setWholesalers] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: { items: User[] } }>('/users?limit=100'),
      api.get<{ success: boolean; data: { items: Array<{ _id: string; name: string }> } }>('/wholesalers?limit=200'),
    ])
      .then(([users, wh]) => {
        if (users.data.success && users.data.data?.items) setItems(users.data.data.items);
        if (wh.data.success && wh.data.data?.items) setWholesalers(wh.data.data.items);
      })
      .catch(() => message.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const onFinish = async (values: { firebaseUid: string; email: string; displayName?: string; role: string; wholesalerId?: string }) => {
    try {
      await api.post('/users', values);
      message.success('User created');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const roleColor: Record<string, string> = { OWNER: 'red', EMPLOYEE: 'blue', WHOLESALER: 'green' };
  const columns = [
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Display Name', dataIndex: 'displayName', key: 'displayName' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (r: string) => <Tag color={roleColor[r]}>{r}</Tag> },
    { title: 'Firebase UID', dataIndex: 'firebaseUid', key: 'firebaseUid', ellipsis: true },
  ];

  return (
    <>
      <Title level={4} className="page-title">Users (OWNER only)</Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Add User</Button>
      </Space>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />
      <Modal title="Add User" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} destroyOnClose>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Use Firebase UID from Firebase Console -> Authentication -> Users. The user should already exist in Firebase Auth."
        />
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="firebaseUid" label="Firebase UID" rules={[{ required: true }]}><Input placeholder="From Firebase Auth" /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="displayName" label="Display Name"><Input /></Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={[{ value: 'OWNER', label: 'Owner' }, { value: 'EMPLOYEE', label: 'Employee' }, { value: 'WHOLESALER', label: 'Wholesaler' }]} />
          </Form.Item>
          <Form.Item name="wholesalerId" label="Wholesaler (if role=Wholesaler)">
            <Select placeholder="Select wholesaler" allowClear options={wholesalers.map((w) => ({ value: w._id, label: w.name }))} />
          </Form.Item>
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
