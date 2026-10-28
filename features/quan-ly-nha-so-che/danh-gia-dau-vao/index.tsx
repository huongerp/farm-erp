import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { List, Grid3x3, CalendarRange, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import DanhSachTab from './components/DanhSachTab';
import BangDanhGiaTab from './components/BangDanhGiaTab';
import TongHopTuanTab from './components/TongHopTuanTab';
import SoSanhThangTab from './components/SoSanhThangTab';

const VALID_TABS = ['danh-sach', 'bang', 'tuan', 'thang'] as const;
type TabId = (typeof VALID_TABS)[number];

/**
 * Đánh giá đầu vào: «Phiếu chuyến» (id `danh-sach`), «Tổng hợp ngày» (id `bang` — giữ cho link cũ từ Báo cáo
 * sơ chế / Dự báo), «Tổng hợp tuần», «So sánh tháng». Cả trang nằm trong ModulePermissionGuard của route.
 */
const DanhGiaDauVaoPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    VALID_TABS.includes(tabFromUrl as TabId) ? (tabFromUrl as TabId) : 'danh-sach'
  );
  // Tab trên URL đổi (back/forward, link) → đồng bộ tab đang mở, điều chỉnh ngay lúc render.
  const [prevTabFromUrl, setPrevTabFromUrl] = useState(tabFromUrl);
  if (tabFromUrl !== prevTabFromUrl) {
    setPrevTabFromUrl(tabFromUrl);
    if (VALID_TABS.includes(tabFromUrl as TabId)) setActiveTab(tabFromUrl as TabId);
  }

  const handleTabChange = (id: string) => {
    if (!VALID_TABS.includes(id as TabId)) return;
    setActiveTab(id as TabId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', id);
      return next;
    });
  };

  const tabs = useMemo(
    () => [
      { id: 'danh-sach', label: t('danhGiaDauVao.tabs.danhSach'), icon: List },
      { id: 'bang', label: t('danhGiaDauVao.tabs.tongHopNgay'), icon: Grid3x3 },
      { id: 'tuan', label: t('danhGiaDauVao.tabs.tongHopTuan'), icon: CalendarRange },
      { id: 'thang', label: t('danhGiaDauVao.tabs.soSanhThang'), icon: BarChart3 },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col mt-1.5">
        {activeTab === 'danh-sach' && <DanhSachTab />}
        {activeTab === 'bang' && <BangDanhGiaTab />}
        {activeTab === 'tuan' && <TongHopTuanTab />}
        {activeTab === 'thang' && <SoSanhThangTab />}
      </div>
    </div>
  );
};

export default DanhGiaDauVaoPage;
