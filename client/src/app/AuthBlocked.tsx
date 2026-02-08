import { Button, Card, Typography } from 'antd';

const { Title, Text } = Typography;

export default function AuthBlocked({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="auth-blocked">
      <Card className="auth-blocked-card">
        <Title level={4}>Account not registered</Title>
        <Text type="secondary">
          Your account is authenticated but not registered in the system. Contact the Owner/Admin to be added.
        </Text>
        <div className="auth-blocked-actions">
          <Button type="primary" onClick={onSignOut}>Sign out</Button>
        </div>
      </Card>
    </div>
  );
}
