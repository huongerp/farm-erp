import React from 'react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import CongViecScopeTab from './components/cong-viec-scope-tab';

/**
 * Module Công việc tại /hanh-chinh/cong-viec — hiển thị toàn bộ công việc (scope all).
 */
const CongViecPage: React.FC = () => (
  <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative mt-1.5">
      <CongViecScopeTab scope="all" />
    </div>
  </ErrorBoundary>
);

export default CongViecPage;
