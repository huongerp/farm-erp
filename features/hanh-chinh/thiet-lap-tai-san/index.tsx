import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Tag, Layers, CircleDollarSign } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import TrangThaiTab from './components/trang-thai-tab';
import NhomTaiSanTab from './components/nhom-tai-san-tab';
import LoaiChiPhiTab from './components/loai-chi-phi-tab';

/** Thiết lập tài sản: Nhóm tài sản, Trạng thái, Loại chi phí. Tab Nơi lưu đã chuyển sang module Nơi quản lý. */
const ThietLapTaiSanPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('nhomtaisan');

  const tabFromUrl = searchParams.get('tab');
  useEffect(() => {
    if (tabFromUrl === 'nhomtaisan' || tabFromUrl === 'trangthai' || tabFromUrl === 'loaichiphi') setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const tabs = useMemo(
    () => [
      { id: 'nhomtaisan', label: t('thietLapTaiSan.tabs.nhomTaiSan'), icon: Layers },
      { id: 'trangthai', label: t('thietLapTaiSan.tabs.trangThai'), icon: Tag },
      { id: 'loaichiphi', label: t('thietLapTaiSan.tabs.loaiChiPhi'), icon: CircleDollarSign },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
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
