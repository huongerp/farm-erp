
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Layers, Target, MessageSquare, CalendarClock, PieChart, Activity } from 'lucide-react';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const groups = [
    {
      groupTitle: "Nghiệp vụ CRM",
      items: [
        { title: "Danh sách khách hàng", description: "Quản lý thông tin và liên hệ khách hàng.", icon: Users, color: "bg-amber-500", action: () => navigate('/customers/list') },
        { title: "Phân nhóm", description: "Phân loại khách hàng theo đặc điểm.", icon: Layers, color: "bg-orange-500", action: () => navigate('/customers/groups') },
      ]
    },
    {
      groupTitle: "Bán hàng (Sales)",
      items: [
        { title: "Cơ hội & Đầu mối", description: "Theo dõi Lead và Pipeline bán hàng.", icon: Target, color: "bg-emerald-500", action: () => navigate('/customers/opportunities') },
      ]
    },
    {
      groupTitle: "Chăm sóc & Hỗ trợ",
      items: [
        { title: "Tổng quan tương tác", description: "KPI và Timeline hoạt động.", icon: Activity, color: "bg-indigo-500", action: () => navigate('/customers/support-overview') },
        { title: "Phiếu hỗ trợ", description: "Xử lý yêu cầu và khiếu nại.", icon: MessageSquare, color: "bg-blue-500", action: () => navigate('/customers/support-tickets') },
        { title: "Lịch hẹn & Chăm sóc", description: "Lên lịch gọi điện, gặp mặt.", icon: CalendarClock, color: "bg-rose-500", action: () => navigate('/customers/support-appointments') },
        { title: "Khảo sát hài lòng", description: "Đánh giá chất lượng dịch vụ.", icon: PieChart, color: "bg-amber-500", action: () => navigate('/customers/support-surveys') },
      ]
    }
  ];

  return <ModuleDashboardLayout groups={groups} />;
};

export default CustomerDashboard;
