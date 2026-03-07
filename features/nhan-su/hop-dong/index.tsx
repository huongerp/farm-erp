/**
 * Module Hợp đồng – danh sách HĐ thử việc/chính thức, tạo HĐ chính thức từ thử việc, phiếu thanh lý.
 */
import React from 'react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import DanhSachTab from './components/DanhSachTab';

const HopDongPage: React.FC = () => {
  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <DanhSachTab />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default HopDongPage;
