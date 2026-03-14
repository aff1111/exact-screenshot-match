import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays error fallback UI
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">
                حدث خطأ ما
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">
                عذراً، حدث خطأ غير متوقع. يرجى محاولة تحديث الصفحة أو التواصل معنا.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-6 text-xs">
                  <summary className="cursor-pointer font-mono text-slate-500 mb-2">
                    معلومات الخطأ
                  </summary>
                  <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded overflow-auto text-red-600">
                    {this.state.error?.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  تحديث الصفحة
                </Button>
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  العودة
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
