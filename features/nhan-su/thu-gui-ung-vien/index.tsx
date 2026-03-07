/**
 * Module Thư gửi ứng viên – bảng con (liên kết ứng viên).
 * Luồng: Chọn ứng viên → Chọn loại phiếu → Điền thông tin.
 * Pattern: GenericToolbar + GenericTable + store + DanhSachTab (như Lịch phỏng vấn / Ứng viên).
 */
import React from 'react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import DanhSachTab from './components/DanhSachTab';

const ThuGuiUngVienPage: React.FC = () => {
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

export default ThuGuiUngVienPage;
