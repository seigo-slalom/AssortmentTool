import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Flex, Result } from 'antd';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Catches render-time errors anywhere below it so a bug in one screen doesn't blank the whole app.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in app tree:', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <Flex align="center" justify="center" style={{ minHeight: '100vh', padding: 24 }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle={this.state.error.message}
            extra={
              <Button type="primary" onClick={this.handleReload}>
                Reload
              </Button>
            }
          />
        </Flex>
      );
    }

    return this.props.children;
  }
}
