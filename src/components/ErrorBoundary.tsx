import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RegionState } from './RegionState';
import styles from './ErrorBoundary.module.css';

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
        <div className={styles.fallback}>
          <RegionState
            state="error"
            title="Something went wrong"
            description={this.state.error.message}
            onRetry={this.handleReload}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
