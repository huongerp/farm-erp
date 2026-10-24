import React from 'react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import HangMucThuChiTab from './components/HangMucThuChiTab';

/** Thiết lập quỹ (Tài chính) — hiện chỉ có danh mục Hạng mục thu chi. */
const ThietLapQuyPage: React.FC = () => (
  <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col">
        <HangMucThuChiTab />
      </div>
    </div>
  </ErrorBoundary>
);

export default ThietLapQuyPage;
