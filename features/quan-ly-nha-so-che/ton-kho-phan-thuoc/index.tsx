import React from 'react';
import TonSanPhamPTTab from './components/TonSanPhamPTTab';

/** Tồn kho phân thuốc: một bảng tồn theo kỳ (từ ngày – đến ngày), mặc định tháng này. */
const TonKhoPhanThuocPage: React.FC = () => (
  <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
    <TonSanPhamPTTab />
  </div>
);

export default TonKhoPhanThuocPage;
