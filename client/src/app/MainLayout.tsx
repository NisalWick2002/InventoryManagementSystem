import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Dropdown, Select } from 'antd';
import type { MenuProps } from 'antd';
import { useAuth } from './AuthContext';
import { useTheme, type ThemeMode } from '../utils/theme.tsx';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TeamOutlined,
  FileTextOutlined,
  ExperimentOutlined,
  OrderedListOutlined,
  CarOutlined,
  BarChartOutlined,
  UserOutlined,
  AuditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { appUser, signOut } = useAuth();
  const { mode, setMode } = useTheme();

  const isInternal = appUser?.role === 'OWNER' || appUser?.role === 'EMPLOYEE';

  const menuItems: MenuProps['items'] = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    ...(isInternal
      ? [
          { key: '/products', icon: <ShoppingOutlined />, label: 'Products' },
          { key: '/suppliers', icon: <TeamOutlined />, label: 'Suppliers' },
          { key: '/wholesalers', icon: <TeamOutlined />, label: 'Wholesalers' },
          { key: '/grns', icon: <FileTextOutlined />, label: 'GRN' },
          { key: '/boms', icon: <ExperimentOutlined />, label: 'BOM' },
          { key: '/batches', icon: <ExperimentOutlined />, label: 'Batches' },
          { key: '/orders', icon: <OrderedListOutlined />, label: 'Orders' },
          { key: '/dispatches', icon: <CarOutlined />, label: 'Dispatches' },
          { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
        ]
      : [
          { key: '/orders', icon: <OrderedListOutlined />, label: 'My Orders' },
        ]),
    ...(appUser?.role === 'OWNER'
      ? [
          { key: '/users', icon: <UserOutlined />, label: 'Users' },
          { key: '/audit', icon: <AuditOutlined />, label: 'Audit Log' },
        ]
      : []),
  ].filter(Boolean);

  const userMenuItems: MenuProps['items'] = [
    { key: 'signout', label: 'Sign out', danger: true, onClick: () => signOut() },
  ];

  const appearanceOptions = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  return (
    <Layout className="app-layout">
      <Sider trigger={null} collapsible collapsed={collapsed} className="app-sider">
        <div className="app-sider-brand">
          <Text strong className="app-sider-brand-text">
            {collapsed ? 'FIP' : 'Factory Inventory'}
          </Text>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="app-sider-menu"
        />
      </Sider>
      <Layout>
        <Header className="app-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="app-header-toggle"
          />
          <Text className="app-header-title" strong>
            Factory Inventory & Production Management (MVP)
          </Text>
          <div className="app-header-appearance">
            <Text className="app-header-appearance-label">Appearance</Text>
            <Select
              size="small"
              value={mode}
              options={appearanceOptions}
              onChange={(value) => setMode(value as ThemeMode)}
              className="app-header-appearance-select"
            />
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" className="app-header-user" icon={<UserOutlined />}>
              {appUser?.email} ({appUser?.role})
            </Button>
          </Dropdown>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
