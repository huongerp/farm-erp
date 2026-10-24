import React from 'react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import CongViecScopeTab from './components/cong-viec-scope-tab';

const CongViecCuaToiPage: React.FC = () => (
  <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative mt-1.5">
      <CongViecScopeTab scope="my" />
    </div>
  </ErrorBoundary>
);

export default CongViecCuaToiPage;
