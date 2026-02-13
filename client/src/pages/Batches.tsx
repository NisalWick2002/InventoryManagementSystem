import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Table,
  Button,
  Typography,
  Tag,
  Space,
  message,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Input,
} from 'antd';
import { PlusOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { api } from '../api/client';

const { Title } = Typography;

type ProductRef = { _id: string; name: string; sku: string; unit: string };

type Batch = {
  _id: string;
  batchId: string;
  finishedProductId: ProductRef | string;
  plannedQty: number;
  actualQtyProduced: number;
  manufactureDate: string;
  expiryDate: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'RELEASED';
  wastageQty?: number;
};

type RawProduct = { _id: string; name: string; unit: string };

const statusColor: Record<string, string> = {
  DRAFT: 'default',
  IN_PROGRESS: 'processing',
  COMPLETED: 'success',
  RELEASED: 'green',
};

export default function Batches() {
  const [items, setItems] = useState<Batch[]>([]);
  const [finishedProducts, setFinishedProducts] = useState<ProductRef[]>([]);
  const [rawProducts, setRawProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completingBatch, setCompletingBatch] = useState<Batch | null>(null);

  const [createForm] = Form.useForm();
  const [completeForm] = Form.useForm();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<{ success: boolean; data: { items: Batch[] } }>('/batches?limit=100'),
      api.get<{ success: boolean; data: { items: ProductRef[] } }>('/products?type=FINISHED_GOOD&limit=200'),
      api.get<{ success: boolean; data: { items: RawProduct[] } }>('/products?type=RAW_MATERIAL&limit=200'),
    ])
      .then(([batchesRes, finishedRes, rawRes]) => {
        if (batchesRes.data.success && batchesRes.data.data?.items) setItems(batchesRes.data.data.items);
        if (finishedRes.data.success && finishedRes.data.data?.items) setFinishedProducts(finishedRes.data.data.items);
        if (rawRes.data.success && rawRes.data.data?.items) setRawProducts(rawRes.data.data.items);
      })
      .catch(() => message.error('Failed to load batches'))
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
      message.error(err?.response?.data?.error?.message ?? 'Failed to start batch');
    }
  };

  const createBatch = async (values: {
    finishedProductId: string;
    plannedQty: number;
    manufactureDate?: dayjs.Dayjs;
    expiryDate?: dayjs.Dayjs;
  }) => {
    try {
      await api.post('/batches', {
        finishedProductId: values.finishedProductId,
        plannedQty: values.plannedQty,
        manufactureDate: values.manufactureDate?.toISOString(),
        expiryDate: values.expiryDate?.toISOString(),
      });
      message.success('Batch created');
      setCreateOpen(false);
      createForm.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed to create batch');
    }
  };

  const openCompleteModal = async (batch: Batch) => {
    setCompletingBatch(batch);
    setCompleteOpen(true);
    const finished = batch.finishedProductId as ProductRef;

    completeForm.setFieldsValue({
      actualQtyProduced: batch.plannedQty,
      wastageQty: 0,
      wastageReason: undefined,
      consumption: [],
    });

    const finishedId = typeof finished === 'string' ? finished : finished._id;
    try {
      const bomRes = await api.get<{
        success: boolean;
        data?: { components?: Array<{ rawMaterialId: { _id: string } | string; qtyPerUnit: number; unit: string }> };
      }>(`/boms/product/${finishedId}`);
      const comps = bomRes.data?.data?.components ?? [];
      if (comps.length > 0) {
        completeForm.setFieldsValue({
          consumption: comps.map((c) => {
            const rawMaterialId = typeof c.rawMaterialId === 'string' ? c.rawMaterialId : c.rawMaterialId._id;
            const qtyPlanned = Number((c.qtyPerUnit * batch.plannedQty).toFixed(3));
            return {
              rawMaterialId,
              qtyPlanned,
              qtyActual: qtyPlanned,
              unit: c.unit,
              reasonOverride: undefined,
            };
          }),
        });
      }
    } catch {
      // Manual entry remains available even when BOM is missing.
    }
  };

  const completeBatch = async (values: {
    actualQtyProduced: number;
    wastageQty?: number;
    wastageReason?: string;
    consumption: Array<{
      rawMaterialId: string;
      qtyPlanned: number;
      qtyActual: number;
      unit: string;
      reasonOverride?: string;
    }>;
  }) => {
    if (!completingBatch) return;
    try {
      await api.post(`/batches/${completingBatch._id}/complete`, {
        actualQtyProduced: values.actualQtyProduced,
        wastageQty: values.wastageQty ?? 0,
        wastageReason: values.wastageReason,
        consumption: values.consumption,
      });
      message.success('Batch completed');
      setCompleteOpen(false);
      setCompletingBatch(null);
      completeForm.resetFields();
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      message.error(err?.response?.data?.error?.message ?? 'Failed to complete batch');
    }
  };

  const columns = [
    { title: 'Batch ID', dataIndex: 'batchId', key: 'batchId', width: 180 },
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, r: Batch) => (r.finishedProductId as ProductRef)?.name ?? '-',
    },
    { title: 'Planned', dataIndex: 'plannedQty', key: 'plannedQty', width: 90 },
    { title: 'Actual', dataIndex: 'actualQtyProduced', key: 'actualQtyProduced', width: 90 },
    {
      title: 'Manufacture',
      dataIndex: 'manufactureDate',
      key: 'manufactureDate',
      width: 110,
      render: (d: string) => (d ? new Date(d).toLocaleDateString() : '-'),
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 110,
      render: (d: string) => (d ? new Date(d).toLocaleDateString() : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 240,
      render: (s: string, r: Batch) => (
        <Space>
          <Tag color={statusColor[s] ?? 'default'}>{s?.replace('_', ' ') ?? s}</Tag>
          {s === 'DRAFT' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => startBatch(r._id)}>
              Start
            </Button>
          )}
          {s === 'IN_PROGRESS' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openCompleteModal(r)}
            >
              Complete
            </Button>
          )}
        </Space>
      ),
    },
    {
      title: 'Wastage',
      dataIndex: 'wastageQty',
      key: 'wastageQty',
      width: 80,
      render: (v: number) => v ?? 0,
    },
  ];

  return (
    <>
      <Title level={4} className="page-title">
        Batches
      </Title>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Create Batch
        </Button>
      </Space>
      <Table rowKey="_id" loading={loading} columns={columns} dataSource={items} pagination={{ pageSize: 20 }} />

      <Modal title="Create Batch" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null} destroyOnClose>
        <Form form={createForm} layout="vertical" onFinish={createBatch}>
          <Form.Item name="finishedProductId" label="Finished Product" rules={[{ required: true }]}>
            <Select
              placeholder="Select finished product"
              options={finishedProducts.map((p) => ({ value: p._id, label: `${p.name} (${p.sku})` }))}
            />
          </Form.Item>
          <Form.Item name="plannedQty" label="Planned Quantity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="manufactureDate" label="Manufacture Date">
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
          <Form.Item name="expiryDate" label="Expiry Date">
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Save
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Complete Batch ${completingBatch?.batchId ?? ''}`}
        open={completeOpen}
        onCancel={() => {
          setCompleteOpen(false);
          setCompletingBatch(null);
        }}
        footer={null}
        width={760}
        destroyOnClose
      >
        <Form form={completeForm} layout="vertical" onFinish={completeBatch}>
          <Form.Item name="actualQtyProduced" label="Actual Quantity Produced" rules={[{ required: true }]}>
            <InputNumber min={0.001} style={{ width: '100%' }} />
          </Form.Item>

          <Form.List name="consumption">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...rest} name={[name, 'rawMaterialId']} rules={[{ required: true }]}>
                      <Select
                        style={{ width: 220 }}
                        placeholder="Raw material"
                        options={rawProducts.map((p) => ({ value: p._id, label: `${p.name} (${p.unit})` }))}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'qtyPlanned']} rules={[{ required: true }]}>
                      <InputNumber style={{ width: 120 }} placeholder="Planned" min={0} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'qtyActual']} rules={[{ required: true }]}>
                      <InputNumber style={{ width: 120 }} placeholder="Actual" min={0} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unit']} rules={[{ required: true }]}>
                      <Select
                        style={{ width: 100 }}
                        placeholder="Unit"
                        options={[...new Set(rawProducts.map((p) => p.unit))].map((u) => ({ value: u, label: u }))}
                      />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'reasonOverride']}>
                      <Input style={{ width: 140 }} placeholder="Override reason" />
                    </Form.Item>
                    <Button type="link" danger onClick={() => remove(name)}>
                      Remove
                    </Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    + Add consumption line
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item name="wastageQty" label="Wastage Quantity">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="wastageReason" label="Wastage Reason">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                onClick={() => {
                  setCompleteOpen(false);
                  setCompletingBatch(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Complete Batch
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
