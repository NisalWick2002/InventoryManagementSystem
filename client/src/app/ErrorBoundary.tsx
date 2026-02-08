import React from 'react';
import { Button, Card, Typography } from 'antd';

const { Title, Text } = Typography;

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('UI error:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-error">
          <Card className="app-error-card">
            <Title level={4}>Something went wrong</Title>
            <Text type="secondary">Try reloading the page. If the issue persists, contact support.</Text>
            <div className="app-error-actions">
              <Button type="primary" onClick={this.handleReload}>Reload</Button>
            </div>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}
