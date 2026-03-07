
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Tags, ArrowRightLeft, Warehouse, ClipboardCheck, ScanLine, Settings2 } from 'lucide-react';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';

const WarehouseDashboard: React.FC = () => {
  const navigate = useNavigate();

  const groups = [
    {
      groupTitle: "Hàng hóa",
      items: [
        { title: "Danh sách sản phẩm", description: "Thông tin hàng hóa và tồn kho.", icon: Package, color: "bg-rose-500", action: () => navigate('/warehouse/products') },
        { title: "Nhóm hàng hóa", description: "Phân loại thành phẩm và nguyên liệu.", icon: Tags, color: "bg-orange-500", action: () => navigate('/warehouse/categories') },
        { title: "Định mức tồn kho", description: "Cài đặt Min/Max & Cảnh báo nhập hàng.", icon: Settings2, color: "bg-red-500", action: () => navigate('/warehouse/limits') },
      ]
    },
    {
      groupTitle: "Điều phối & Kho",
      items: [
        { title: "Nhập Xuất Kho", description: "Tạo phiếu nhập, xuất và điều chuyển.", icon: ArrowRightLeft, color: "bg-emerald-500", action: () => navigate('/warehouse/inventory') },
        { title: "Kiểm kê kho", description: "Đối soát tồn kho và quét mã QR.", icon: ScanLine, color: "bg-amber-500", action: () => navigate('/warehouse/audit') },
        { title: "Tổng hợp Tồn kho", description: "Báo cáo tồn kho theo điểm lưu trữ.", icon: ClipboardCheck, color: "bg-violet-500", action: () => navigate('/warehouse/stock') },
        { title: "Danh sách Kho", description: "Quản lý kho bãi và địa điểm lưu trữ.", icon: Warehouse, color: "bg-blue-500", action: () => navigate('/warehouse/locations') },
      ]
    }
  ];

  return <ModuleDashboardLayout groups={groups} />;
};

export default WarehouseDashboard;
