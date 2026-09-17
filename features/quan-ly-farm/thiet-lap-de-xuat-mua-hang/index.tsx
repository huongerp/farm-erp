import React from 'react';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import FarmTienDoMuaHangTab from './components/FarmTienDoMuaHangTab';

/** Thiết lập đề xuất mua hàng (Quản lý farm) — hiện chỉ có danh mục Tiến độ mua hàng. */
const ThietLapDeXuatMuaHangPage: React.FC = () => (
  <ErrorBoundary>
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col">
        <FarmTienDoMuaHangTab />
      </div>
    </div>
  </ErrorBoundary>
);

export default ThietLapDeXuatMuaHangPage;
