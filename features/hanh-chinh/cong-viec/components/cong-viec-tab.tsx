import React from 'react';
import CongViecScopeTab from './cong-viec-scope-tab';

/**
 * Tab "Tất cả công việc" – dùng chung CongViecScopeTab với scope "all"
 * để tránh trùng lặp code và dễ bảo trì (local: xem toàn bộ danh sách).
 */
const CongViecTab: React.FC = () => <CongViecScopeTab scope="all" />;

export default CongViecTab;
