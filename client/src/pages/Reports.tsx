import { useState } from 'react';
import { Tabs, Table, Typography, DatePicker, InputNumber, Button, Space, message, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { api } from '../api/client';

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function Reports() {
  const [stockRaw, setStockRaw] = useState<Array<Record<string, unknown>>>([]);
  const [stockFinished, setStockFinished] = useState<Array<Record<string, unknown>>>([]);
  const [movements, setMovements] = useState<Array<Record<string, unknown>>>([]);
  const [expiry, setExpiry] = useState<Array<Record<string, unknown>>>([]);
  const [production, setProduction] = useState<Array<Record<string, unknown>>>([]);
  const [wastage, setWastage] = useState<Array<Record<string, unknown>>>([]);
  const [sales, setSales] = useState<Array<Record<string, unknown>>>([]);
  const [traceability, setTraceability] = useState<Array<Record<string, unknown>>>([]);
  const [traceWholesalerId, setTraceWholesalerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [days, setDays] = useState(30);
  const from = dateRange[0]?.toISOString() ?? new Date().toISOString();
  const to = dateRange[1]?.toISOString() ?? new Date().toISOString();

  const loadStock = () => {
    setLoading(true);
    api
      .get<{ success: boolean; data: { rawMaterials: unknown[]; finishedGoods: unknown[] } }>(
        '/reports/stock-on-hand'
      )
      .then((r) => {
        if (r.data.success && r.data.data) {
          setStockRaw((r.data.data.rawMaterials as Array<Record<string, unknown>>) ?? []);
          setStockFinished((r.data.data.finishedGoods as Array<Record<string, unknown>>) ?? []);
        }
      })
      .catch(() => message.error('Failed'))
      .finally(() => setLoading(false));
  };

  const loadMovements = () => {
    setLoading(true);
    api
      .get<{ success: boolean; data: { items: unknown[] } }>(
        `/reports/movements?from=${from}&to=${to}&limit=100`
      )
      .then((r) => {
        if (r.data.success && r.data.data?.items)
          setMovements(r.data.data.items as Array<Record<string, unknown>>);
      })
      .catch(() => message.error('Failed'))
      .finally(() => setLoading(false));
  };

  const loadExpiry = () => {
    setLoading(true);
    api
      .get<{ success: boolean; data: { items: unknown[] } }>(`/reports/expiry?days=${days}`)
      .then((r) => {
        if (r.data.success && r.data.data?.items)
          setExpiry(r.data.data.items as Array<Record<string, unknown>>);
      })
      .catch(() => message.error('Failed'))
      .finally(() => setLoading(false));
  };

  const loadProduction = () => {
    setLoading(true);
    api
      .get<{ success: boolean; data: { items: unknown[] } }>(
        `/reports/production?from=${from}&to=${to}`
      )
      .then((r) => {
        if (r.data.success && r.data.data?.items)
          setProduction(r.data.data.items as Array<Record<string, unknown>>);
      })
      .catch(() => message.error('Failed'))
      .finally(() => setLoading(false));
  };

  const loadWastage = () => {
    setLoading(true);
    api
      .get<{ success: boolean; data: { items: unknown[] } }>(`/reports/wastage?from=${from}&to=${to}`)
      .then((r) => {
        if (r.data.success && r.data.data?.items)
          setWastage(r.data.data.items as Array<Record<string, unknown>>);
      })
      .catch(() => message.error('Failed'))
      .finally(() => setLoading(false));
  };

  const loadSales = () => {
    setLoading(true);
    api
      .get<{ success: boolean; data: { byWholesaler: unknown[] } }>(
        `/reports/sales-by-wholesaler?from=${from}&to=${to}`
      )
      .then((r) => {
        if (r.data.success && r.data.data?.byWholesaler)
          setSales(r.data.data.byWholesaler as Array<Record<string, unknown>>);
      })
      .catch(() => message.error('Failed'))
      .finally(() => setLoading(false));
  };

  const loadTraceability = () => {
    setLoading(true);
    const query = traceWholesalerId?.trim()
      ? `?wholesalerId=${encodeURIComponent(traceWholesalerId.trim())}`
      : '';
    api
      .get<{ success: boolean; data: { trace: unknown[] } }>(`/reports/traceability${query}`)
      .then((r) => {
        if (r.data.success && r.data.data?.trace)
          setTraceability(r.data.data.trace as Array<Record<string, unknown>>);
      })
      .catch(() => message.error('Failed'))
      .finally(() => setLoading(false));
  };

  type ReportRow = Record<string, unknown>;

  const stockCols: ColumnsType<ReportRow> = [
    { title: 'Product', dataIndex: ['productId', 'name'], key: 'product' },
    { title: 'SKU', dataIndex: ['productId', 'sku'], key: 'sku' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Unit', dataIndex: 'unit', key: 'unit' },
  ];

  const movementCols: ColumnsType<ReportRow> = [
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
    { title: 'Product', dataIndex: ['productId', 'name'], key: 'product' },
    { title: 'Qty', dataIndex: 'qty', key: 'qty', width: 80 },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      width: 160,
      render: (d: string) => (d ? new Date(d).toLocaleString() : '-'),
    },
  ];

  const expiryColumns: ColumnsType<ReportRow> = [
    ...stockCols,
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      key: 'expiry',
      render: (d: string) => (d ? new Date(d).toLocaleDateString() : '-'),
    },
  ];

  return (
    <>
      <Title level={4} className="page-title">
        Reports
      </Title>
      <Tabs
        items={[
          {
            key: 'stock',
            label: 'Stock on hand',
            children: (
              <>
                <Button type="primary" onClick={loadStock} loading={loading} className="reports-action">
                  Load
                </Button>
                <Table
                  rowKey="_id"
                  loading={loading}
                  dataSource={stockRaw}
                  columns={stockCols}
                  pagination={false}
                  size="small"
                />
                <Title level={5} className="reports-section-title">
                  Finished goods by batch
                </Title>
                <Table
                  rowKey="_id"
                  dataSource={stockFinished}
                  columns={[
                    ...stockCols,
                    { title: 'Batch', dataIndex: ['batchId', 'batchId'], key: 'batch' },
                    {
                      title: 'Expiry',
                      dataIndex: 'expiryDate',
                      key: 'expiry',
                      render: (d: string) => (d ? new Date(d).toLocaleDateString() : '-'),
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'movements',
            label: 'Movements',
            children: (
              <>
                <Space className="reports-toolbar">
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates?.[0] && dates?.[1]) setDateRange([dates[0], dates[1]]);
                    }}
                  />
                  <Button type="primary" onClick={loadMovements} loading={loading}>
                    Load
                  </Button>
                </Space>
                <Table
                  rowKey="_id"
                  loading={loading}
                  dataSource={movements}
                  columns={movementCols}
                  pagination={{ pageSize: 20 }}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'expiry',
            label: 'Expiry',
            children: (
              <>
                <Space className="reports-toolbar">
                  <InputNumber
                    min={1}
                    value={days}
                    onChange={(v) => setDays(v ?? 30)}
                    addonBefore="Within days"
                  />
                  <Button type="primary" onClick={loadExpiry} loading={loading}>
                    Load
                  </Button>
                </Space>
                <Table
                  rowKey="_id"
                  loading={loading}
                  dataSource={expiry}
                  columns={expiryColumns}
                  pagination={false}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'production',
            label: 'Production',
            children: (
              <>
                <Space className="reports-toolbar">
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates?.[0] && dates?.[1]) setDateRange([dates[0], dates[1]]);
                    }}
                  />
                  <Button type="primary" onClick={loadProduction} loading={loading}>
                    Load
                  </Button>
                </Space>
                <Table
                  rowKey="_id"
                  loading={loading}
                  dataSource={production}
                  columns={[
                    { title: 'Batch', dataIndex: 'batchId', key: 'batchId' },
                    { title: 'Product', dataIndex: ['finishedProductId', 'name'], key: 'product' },
                    { title: 'Actual Qty', dataIndex: 'actualQtyProduced', key: 'qty' },
                    {
                      title: 'Completed',
                      dataIndex: 'completedAt',
                      key: 'date',
                      render: (d: string) => (d ? new Date(d).toLocaleString() : '-'),
                    },
                  ]}
                  pagination={false}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'wastage',
            label: 'Wastage',
            children: (
              <>
                <Space className="reports-toolbar">
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates?.[0] && dates?.[1]) setDateRange([dates[0], dates[1]]);
                    }}
                  />
                  <Button type="primary" onClick={loadWastage} loading={loading}>
                    Load
                  </Button>
                </Space>
                <Table
                  rowKey="_id"
                  loading={loading}
                  dataSource={wastage}
                  columns={[
                    { title: 'Batch', dataIndex: 'batchId', key: 'batchId' },
                    { title: 'Product', dataIndex: ['finishedProductId', 'name'], key: 'product' },
                    { title: 'Wastage Qty', dataIndex: 'wastageQty', key: 'wastage' },
                    { title: 'Reason', dataIndex: 'wastageReason', key: 'reason' },
                  ]}
                  pagination={false}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'sales',
            label: 'Sales by wholesaler',
            children: (
              <>
                <Space className="reports-toolbar">
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates?.[0] && dates?.[1]) setDateRange([dates[0], dates[1]]);
                    }}
                  />
                  <Button type="primary" onClick={loadSales} loading={loading}>
                    Load
                  </Button>
                </Space>
                <Table
                  rowKey={(r) => String((r as { name?: string }).name ?? Math.random())}
                  loading={loading}
                  dataSource={sales}
                  columns={[
                    { title: 'Wholesaler', dataIndex: 'name', key: 'name' },
                    { title: 'Order Count', dataIndex: 'orderCount', key: 'orderCount' },
                    { title: 'Total Qty', dataIndex: 'totalQty', key: 'totalQty' },
                  ]}
                  pagination={false}
                  size="small"
                />
              </>
            ),
          },
          {
            key: 'traceability',
            label: 'Traceability',
            children: (
              <>
                <Space className="reports-toolbar">
                  <Input
                    value={traceWholesalerId}
                    onChange={(e) => setTraceWholesalerId(e.target.value)}
                    placeholder="Optional wholesalerId"
                    style={{ width: 280 }}
                  />
                  <Button type="primary" onClick={loadTraceability} loading={loading}>
                    Load
                  </Button>
                </Space>
                <Table
                  rowKey={(r) => String((r as { dispatchId?: string }).dispatchId ?? Math.random())}
                  loading={loading}
                  dataSource={traceability}
                  columns={[
                    { title: 'Dispatch', dataIndex: 'dispatchId', key: 'dispatchId' },
                    { title: 'Order', dataIndex: 'orderId', key: 'orderId' },
                    {
                      title: 'Allocations',
                      key: 'allocations',
                      render: (_: unknown, row: Record<string, unknown>) => {
                        const allocations = (row.allocations as Array<Record<string, unknown>>) ?? [];
                        return allocations
                          .map((a) => {
                            const product = (a.productId as { name?: string })?.name ?? 'Product';
                            const batch = (a.batchId as { batchId?: string })?.batchId ?? 'Batch';
                            const qty = a.qty ?? 0;
                            return `${product}: ${qty} (${batch})`;
                          })
                          .join('; ');
                      },
                    },
                    {
                      title: 'Dispatched At',
                      dataIndex: 'dispatchedAt',
                      key: 'dispatchedAt',
                      render: (d: string) => (d ? new Date(d).toLocaleString() : '-'),
                    },
                  ]}
                  pagination={{ pageSize: 20 }}
                  size="small"
                />
              </>
            ),
          },
        ]}
      />
    </>
  );
}
