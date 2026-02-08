import { useEffect, useState } from 'react';
import { Table, Button, Typography, Tag, Space, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

type Product = {
  _id: string;
  type: 'RAW_MATERIAL' | 'FINISHED_GOOD';
  sku: string;
  name: string;
  unit: string;
  category?: string;
  reorderLevel?: number;
  cost?: number;
  sellingPrice?: number;
};

export default function Products() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    api
      .get<{ success: boolean; data: { items: Product[] } }>('/products?limit=200')
      .then((r) => {
        if (r.data.success && r.data.data?.items) setItems(r.data.data.items);
      })
      .catch(() => message.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      await api.post('/products', values);
      message.success('Product created');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed to create');
    }
  };

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 140 },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => (
        <Tag color={t === 'RAW_MATERIAL' ? 'blue' : 'green'}>{t.replace('_', ' ')}</Tag>
      ),
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 100 },
    { title: 'Reorder', dataIndex: 'reorderLevel', key: 'reorderLevel', width: 90 },
    { title: 'Cost', dataIndex: 'cost', key: 'cost', width: 90, render: (v: number) => v ?? '-' },
    { title: 'Selling', dataIndex: 'sellingPrice', key: 'sellingPrice', width: 90, render: (v: number) => v ?? '-' },
  ];

  return (
    <>
      <Title level={4} className="page-title">
        Products
      </Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add Product
        </Button>
      </Space>
      <Table
        rowKey="_id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{ pageSize: 20 }}
      />
      <Modal
        title="Add Product"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'RAW_MATERIAL', label: 'Raw Material' },
                { value: 'FINISHED_GOOD', label: 'Finished Good' },
              ]}
            />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" label="Unit" rules={[{ required: true }]}>
            <Input placeholder="kg, units, etc." />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>
          <Form.Item name="reorderLevel" label="Reorder Level">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="cost" label="Cost (raw materials)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="sellingPrice" label="Selling Price (finished)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Create
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
