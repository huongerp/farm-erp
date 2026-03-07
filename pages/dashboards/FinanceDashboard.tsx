
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, PieChart, ListTree, CreditCard } from 'lucide-react';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();

  const groups = [
    {
      groupTitle: "Quản lý Giao dịch",
      items: [
        { title: "Thu chi", description: "Kiểm soát dòng tiền và giao dịch.", icon: Wallet, color: "bg-emerald-500", action: () => navigate('/finance/transactions') },
        { title: "Báo cáo", description: "Biểu đồ doanh thu và lợi nhuận.", icon: PieChart, color: "bg-blue-500", action: () => navigate('/finance/reports') },
      ]
    },
    {
      groupTitle: "Thiết lập",
      items: [
        { title: "Danh mục", description: "Phân loại thu chi.", icon: ListTree, color: "bg-amber-500", action: () => navigate('/finance/categories') },
        { title: "Tài khoản", description: "Quản lý ngân hàng và ví.", icon: CreditCard, color: "bg-indigo-500", action: () => navigate('/finance/accounts') },
      ]
    }
  ];

  return <ModuleDashboardLayout groups={groups} />;
};

export default FinanceDashboard;
