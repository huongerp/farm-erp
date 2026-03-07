
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, UserPlus, Users, Calendar, BarChart3 } from 'lucide-react';
import ModuleDashboardLayout from '../../components/dashboard/ModuleDashboardLayout';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const groups = [
    {
      groupTitle: "Tuyển dụng",
      items: [
        { title: "Đề xuất tuyển dụng", description: "Lập và duyệt kế hoạch nhân sự.", icon: FileText, color: "bg-blue-500", action: () => navigate('/admin-tasks/recruitment-proposals') },
        { title: "Ứng viên", description: "Danh sách hồ sơ ứng viên.", icon: Users, color: "bg-indigo-500", action: () => navigate('/admin-tasks/candidates') },
        { title: "Ứng tuyển", description: "Quản lý đơn ứng tuyển (Applications).", icon: UserPlus, color: "bg-emerald-500", action: () => navigate('/admin-tasks/applications') },
        { title: "Lịch phỏng vấn", description: "Sắp xếp lịch gặp mặt ứng viên.", icon: Calendar, color: "bg-amber-500", action: () => navigate('/admin-tasks/interviews') },
      ]
    },
    {
      groupTitle: "Báo cáo",
      items: [
        { title: "Báo cáo tuyển dụng", description: "Thống kê hiệu quả kênh tuyển dụng.", icon: BarChart3, color: "bg-rose-500", action: () => navigate('/admin-tasks/recruitment-reports') },
      ]
    }
  ];

  return <ModuleDashboardLayout groups={groups} />;
};

export default AdminDashboard;
