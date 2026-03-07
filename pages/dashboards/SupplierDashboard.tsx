
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Layers, FileText, History, Trophy } from 'lucide-react';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';

const SupplierDashboard: React.FC = () => {
  const navigate = useNavigate();

  const groups = [
    {
      groupTitle: "Quản lý Đối tác",
      items: [
        { title: "Danh sách NCC", description: "Thông tin và liên hệ nhà cung cấp.", icon: List, color: "bg-blue-500", action: () => navigate('/suppliers/list') },
        { title: "Nhóm NCC", description: "Phân loại đối tác cung ứng.", icon: Layers, color: "bg-orange-500", action: () => navigate('/suppliers/groups') },
      ]
    },
    {
      groupTitle: "Phân tích & Đánh giá",
      items: [
        { title: "Bảng xếp hạng", description: "So sánh chất lượng & hiệu quả.", icon: Trophy, color: "bg-indigo-500", action: () => navigate('/suppliers/rankings') },
      ]
    },
    {
      groupTitle: "Giao dịch",
      items: [
        { title: "Lịch sử nhập hàng", description: "Theo dõi các đơn nhập kho từ NCC.", icon: History, color: "bg-emerald-500", action: () => {} }, 
        { title: "Công nợ phải trả", description: "Quản lý nợ cần thanh toán.", icon: FileText, color: "bg-rose-500", action: () => {} }, 
      ]
    }
  ];

  return <ModuleDashboardLayout groups={groups} />;
};

export default SupplierDashboard;
