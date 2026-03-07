import React from 'react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import CongViecScopeTab from './components/cong-viec-scope-tab';

const CongViecToiQuanLyPage: React.FC = () => (
  <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative mt-1.5">
      <CongViecScopeTab scope="managed" />
    </div>
  </ErrorBoundary>
);

export default CongViecToiQuanLyPage;
