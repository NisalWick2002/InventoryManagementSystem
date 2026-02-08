import { Typography, Row, Col, Card, Statistic } from 'antd';
import { ShoppingOutlined, FileTextOutlined, ExperimentOutlined, OrderedListOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../app/AuthContext';

const { Title } = Typography;

export default function Dashboard() {
  const { appUser } = useAuth();
  const [stats, setStats] = useState<{
    products?: number;
    grns?: number;
    batches?: number;
    orders?: number;
  }>({});

  useEffect(() => {
    if (appUser?.role === 'WHOLESALER') {
      api.get<{ success: boolean; data: { total: number } }>('/orders/my?limit=1')
        .then((r) => setStats({ orders: r.data.data?.total ?? 0 }))
        .catch(() => setStats({}));
      return;
    }
    Promise.all([
      api.get<{ success: boolean; data: { total: number } }>('/products?limit=1').then((r) => r.data.data?.total ?? 0),
      api.get<{ success: boolean; data: { total: number } }>('/grns?limit=1').then((r) => r.data.data?.total ?? 0),
      api.get<{ success: boolean; data: { total: number } }>('/batches?limit=1').then((r) => r.data.data?.total ?? 0),
      api.get<{ success: boolean; data: { total: number } }>('/orders?limit=1').then((r) => r.data.data?.total ?? 0),
    ])
      .then(([products, grns, batches, orders]) => setStats({ products, grns, batches, orders }))
      .catch(() => setStats({}));
  }, [appUser?.role]);

  return (
    <>
      <Title level={4} className="page-title">
        Dashboard
      </Title>
      <Row gutter={[16, 16]}>
        {appUser?.role !== 'WHOLESALER' && (
          <>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="Products" value={stats.products ?? 0} prefix={<ShoppingOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="GRNs" value={stats.grns ?? 0} prefix={<FileTextOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="Batches" value={stats.batches ?? 0} prefix={<ExperimentOutlined />} />
              </Card>
            </Col>
          </>
        )}
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Orders" value={stats.orders ?? 0} prefix={<OrderedListOutlined />} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
