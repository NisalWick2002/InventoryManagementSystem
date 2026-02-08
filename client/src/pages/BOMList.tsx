import { useEffect, useState } from 'react';
import { Table, Button, Typography, Modal, Form, Select, InputNumber, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

type BOM = {
  _id: string;
  finishedProductId: { _id: string; name: string; sku: string; unit: string };
  components: Array<{ rawMaterialId: { _id: string; name: string; unit: string }; qtyPerUnit: number; unit: string }>;
};

export default function BOMList() {
  const [items, setItems] = useState<BOM[]>([]);
  const [finished, setFinished] = useState<Array<{ _id: string; name: string; sku: string; unit: string }>>([]);
  const [raw, setRaw] = useState<Array<{ _id: string; name: string; unit: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: { items: BOM[] } }>('/boms?limit=100'),
      api.get<{ success: boolean; data: { items: Array<{ _id: string; name: string; sku: string; unit: string }> } }>('/products?type=FINISHED_GOOD&limit=200'),
      api.get<{ success: boolean; data: { items: Array<{ _id: string; name: string; unit: string }> } }>('/products?type=RAW_MATERIAL&limit=200'),
    ])
      .then(([boms, fin, rawRes]) => {
        if (boms.data.success && boms.data.data?.items) setItems(boms.data.data.items);
        if (fin.data.success && fin.data.data?.items) setFinished(fin.data.data.items);
        if (rawRes.data.success && rawRes.data.data?.items) setRaw(rawRes.data.data.items);
      })
      .catch(() => message.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const onFinish = async (values: { finishedProductId: string; components: Array<{ rawMaterialId: string; qtyPerUnit: number; unit: string }> }) => {
    try {
      await api.post('/boms', values);
      message.success('BOM created');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed');
    }
  };

  const columns = [
    { title: 'Finished Product', key: 'fp', render: (_: unknown, r: BOM) => (r.finishedProductId as { name: string; sku: string })?.name ?? r.finishedProductId },
    {
      title: 'Components',
      key: 'components',
      render: (_: unknown, r: BOM) =>
        r.components?.map((c) => `${(c.rawMaterialId as { name: string })?.name}: ${c.qtyPerUnit} ${c.unit}/unit`).join('; ') ?? '-',
    },
  ];

  return (
    <>
      <Title level={4} className="page-title">
        BOM (Bill of Materials)
      </Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add BOM
        </Button>
      </Space>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />
      <Modal title="Add BOM" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={560} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="finishedProductId" label="Finished Product" rules={[{ required: true }]}>
            <Select
              placeholder="Select product"
              options={finished.map((f) => ({ value: f._id, label: `${f.name} (${f.sku})` }))}
            />
          </Form.Item>
          <Form.List name="components">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <Form.Item {...rest} name={[name, 'rawMaterialId']} rules={[{ required: true }]} style={{ flex: 2 }}>
                      <Select
                        placeholder="Raw material"
                        options={raw.map((p) => ({ value: p._id, label: `${p.name} (${p.unit})` }))}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'qtyPerUnit']} rules={[{ required: true }]} style={{ flex: 1 }}>
                      <InputNumber min={0} placeholder="Qty/unit" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unit']} rules={[{ required: true }]} style={{ flex: 1 }}>
                      <Select placeholder="Unit" options={[...new Set(raw.map((p) => p.unit))].map((u) => ({ value: u, label: u }))} />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(name)}>Remove</Button>
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>+ Add component</Button>
                </Form.Item>
              </>
            )}
          </Form.List>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create BOM</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
