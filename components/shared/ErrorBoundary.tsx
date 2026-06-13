import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { captureExceptionWithSentry } from '../../lib/sentry-client';
import ErrorState from './ErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary toàn app: bắt lỗi render trong cây con, hiển thị ErrorState
 * và nút "Thử lại" / "Về trang chủ" thay vì crash trắng màn hình.
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    void captureExceptionWithSentry(error, { componentStack: errorInfo?.componentStack ?? undefined });
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

/** Trang lỗi luôn hiển thị tiếng Việt để đồng bộ với hệ thống */
const LANG_VI = 'vi';

/** Map lỗi thường gặp sang key dịch tiếng Việt */
function getErrorMessageKey(error: Error): string {
  const msg = (error?.message ?? '').toLowerCase();
  if (msg.includes('before initialization') || msg.includes('temporal dead zone')) {
    return 'shared.error.messageInit';
  }
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('load failed') ||
    msg.includes('network request failed')
  ) {
    return 'shared.error.messageNetwork';
  }
  if (msg.includes('is not defined') || error?.name === 'ReferenceError') {
    return 'shared.error.messageReference';
  }
  if (msg.includes('is not a function') || msg.includes('is not a constructor')) {
    return 'shared.error.messageRuntime';
  }
  if (
    msg.includes('cannot read propert') ||
    msg.includes('cannot read properties') ||
    msg.includes("reading '")
  ) {
    return 'shared.error.messageRead';
  }
  return 'shared.error.message';
}

function ErrorBoundaryFallback({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  const { t } = useTranslation();
  const title = t('shared.error.title', { lng: LANG_VI });
  const messageKey = getErrorMessageKey(error);
  const message = t(messageKey, { lng: LANG_VI });
  const backHomeLabel = t('shared.error.backHome', { lng: LANG_VI });
  const retryLabel = t('shared.error.retry', { lng: LANG_VI });
  const technicalLabel = t('shared.error.technicalDetail', { lng: LANG_VI });

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md">
        <ErrorState
          title={title}
          message={message}
          onRetry={onRetry}
          retryLabel={retryLabel}
          primaryButtons
        />
        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            {backHomeLabel}
          </a>
        </div>
        {import.meta.env.DEV && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1">{technicalLabel}</p>
            <pre className="p-3 text-xs bg-destructive/10 text-destructive rounded-lg overflow-auto max-h-32">
              {error.message}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundaryClass;
