import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useAuth } from '../app/AuthContext';
import '../styles/theme.css';
import '../styles/Login.css';

const { Title, Text } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await signIn(values.email, values.password);
      message.success('Signed in');
      navigate('/');
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={3} className="login-title">
          Factory Inventory & Production
        </Title>
        <Text type="secondary" className="login-subtitle">
          Sign in with your email
        </Text>
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Enter your password' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
