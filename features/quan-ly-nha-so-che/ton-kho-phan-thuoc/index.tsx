import React from 'react';
import TonSanPhamPTTab from './components/TonSanPhamPTTab';

/** Tồn kho phân thuốc: một bảng tồn theo kỳ (từ ngày – đến ngày), mặc định tháng này. */
const TonKhoPhanThuocPage: React.FC = () => (
  <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative">
    <TonSanPhamPTTab />
  </div>
);

export default TonKhoPhanThuocPage;
