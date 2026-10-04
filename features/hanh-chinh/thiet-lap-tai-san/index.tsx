import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Tag, Layers, CircleDollarSign } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import EmptyState from '../../../components/shared/EmptyState';
import TrangThaiTab from './components/trang-thai-tab';
import NhomTaiSanTab from './components/nhom-tai-san-tab';
import LoaiChiPhiTab from './components/loai-chi-phi-tab';
import { useThietLapTaiSanViewScope } from './hooks/use-thiet-lap-tai-san-view-scope';

/** Thiết lập tài sản: Nhóm tài sản, Trạng thái, Loại chi phí. Tab Nơi lưu đã chuyển sang module Nơi quản lý. */
const ThietLapTaiSanPage: React.FC = () => {
  const { t } = useTranslation();
  const { viewAll, isLoading: scopeLoading } = useThietLapTaiSanViewScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const isValidTab = (id: string | null): id is string =>
    id === 'nhomtaisan' || id === 'trangthai' || id === 'loaichiphi';
  const [activeTab, setActiveTab] = useState(() => (isValidTab(tabFromUrl) ? tabFromUrl : 'nhomtaisan'));

  // Đồng bộ tab khi ?tab= trên URL đổi — điều chỉnh state ngay lúc render thay vì effect.
  const [prevTabFromUrl, setPrevTabFromUrl] = useState(tabFromUrl);
  if (tabFromUrl !== prevTabFromUrl) {
    setPrevTabFromUrl(tabFromUrl);
    if (isValidTab(tabFromUrl)) setActiveTab(tabFromUrl);
  }

  // Ghi tab vào URL — trước đây chỉ đọc, không ghi, nên bấm tab rồi F5 là nhảy về tab cũ.
  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', id);
      return next;
    });
  };

  const tabs = useMemo(
    () => [
      { id: 'nhomtaisan', label: t('thietLapTaiSan.tabs.nhomTaiSan'), icon: Layers },
      { id: 'trangthai', label: t('thietLapTaiSan.tabs.trangThai'), icon: Tag },
      { id: 'loaichiphi', label: t('thietLapTaiSan.tabs.loaiChiPhi'), icon: CircleDollarSign },
    ],
    [t]
  );

  if (scopeLoading) return null;
  if (!viewAll) {
    return (
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative flex-1 min-h-0">
        <EmptyState title={t('thietLapTaiSan.noViewAccess')} className="m-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {activeTab === 'nhomtaisan' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <NhomTaiSanTab />
        </div>
      )}
      {activeTab === 'trangthai' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <TrangThaiTab />
        </div>
      )}
      {activeTab === 'loaichiphi' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <LoaiChiPhiTab />
        </div>
      )}
    </div>
  );
};

export default ThietLapTaiSanPage;
