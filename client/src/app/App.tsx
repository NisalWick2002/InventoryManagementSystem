import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './AuthContext';
import AuthBlocked from './AuthBlocked';
import MainLayout from './MainLayout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Products from '../pages/Products';
import Suppliers from '../pages/Suppliers';
import Wholesalers from '../pages/Wholesalers';
import GRNList from '../pages/GRNList';
import BOMList from '../pages/BOMList';
import Batches from '../pages/Batches';
import Orders from '../pages/Orders';
import Dispatches from '../pages/Dispatches';
import Reports from '../pages/Reports';
import Users from '../pages/Users';
import Audit from '../pages/Audit';

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { appUser, loading, authError, signOut } = useAuth();
  if (loading) {
    return (
      <div className="fullscreen-center">
        <Spin size="large" />
      </div>
    );
  }
  if (authError?.code === 'USER_NOT_FOUND') {
    return <AuthBlocked onSignOut={signOut} />;
  }
  if (!appUser) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(appUser.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const internalRoles = ['OWNER', 'EMPLOYEE'];
  const allRoles = ['OWNER', 'EMPLOYEE', 'WHOLESALER'];
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<PrivateRoute roles={internalRoles}><Products /></PrivateRoute>} />
        <Route path="suppliers" element={<PrivateRoute roles={internalRoles}><Suppliers /></PrivateRoute>} />
        <Route path="wholesalers" element={<PrivateRoute roles={internalRoles}><Wholesalers /></PrivateRoute>} />
        <Route path="grns" element={<PrivateRoute roles={internalRoles}><GRNList /></PrivateRoute>} />
        <Route path="boms" element={<PrivateRoute roles={internalRoles}><BOMList /></PrivateRoute>} />
        <Route path="batches" element={<PrivateRoute roles={internalRoles}><Batches /></PrivateRoute>} />
        <Route path="orders" element={<PrivateRoute roles={allRoles}><Orders /></PrivateRoute>} />
        <Route path="dispatches" element={<PrivateRoute roles={internalRoles}><Dispatches /></PrivateRoute>} />
        <Route path="reports" element={<PrivateRoute roles={internalRoles}><Reports /></PrivateRoute>} />
        <Route path="users" element={<PrivateRoute roles={['OWNER']}><Users /></PrivateRoute>} />
        <Route path="audit" element={<PrivateRoute roles={['OWNER']}><Audit /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
