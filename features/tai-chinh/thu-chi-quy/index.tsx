import React from 'react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import DanhSachTab from './components/DanhSachTab';

/** Thu chi quỹ (Tài chính) — sổ quỹ tiền mặt theo chi nhánh. */
const ThuChiQuyPage: React.FC = () => (
  <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col">
        <DanhSachTab />
      </div>
    </div>
  </ErrorBoundary>
);

export default ThuChiQuyPage;
