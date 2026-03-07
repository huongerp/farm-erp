import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Route cũ /hanh-chinh/cong-viec redirect sang Công việc của tôi (giữ query nếu có).
 */
const CongViecPage: React.FC = () => {
  const location = useLocation();
  const search = location.search || '';
  return <Navigate to={`/hanh-chinh/cong-viec-cua-toi${search}`} replace />;
};

export default CongViecPage;
