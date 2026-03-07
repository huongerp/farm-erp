import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Tag, Megaphone, Mail } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import TrangThaiUngVienTab from './components/trang-thai-ung-vien-tab';
import KenhTuyenDungTab from './components/kenh-tuyen-dung-tab';
import MauPhanHoiTab from './components/mau-phan-hoi-tab';

/** Thiết lập tuyển dụng: Trạng thái ứng viên, Kênh tuyển dụng, Mẫu phản hồi */
const ThietLapTuyenDungPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('trangthai');

  const tabFromUrl = searchParams.get('tab');
  useEffect(() => {
    if (tabFromUrl === 'trangthai' || tabFromUrl === 'kenh' || tabFromUrl === 'mauphanhoi') {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const tabs = useMemo(
    () => [
      { id: 'trangthai', label: t('thietLapTuyenDung.tabs.trangThaiUngVien'), icon: Tag },
      { id: 'kenh', label: t('thietLapTuyenDung.tabs.kenhTuyenDung'), icon: Megaphone },
      { id: 'mauphanhoi', label: t('thietLapTuyenDung.tabs.mauPhanHoi'), icon: Mail },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'trangthai' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <TrangThaiUngVienTab />
        </div>
      )}
      {activeTab === 'kenh' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <KenhTuyenDungTab />
        </div>
      )}
      {activeTab === 'mauphanhoi' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <MauPhanHoiTab />
        </div>
      )}
    </div>
  );
};

export default ThietLapTuyenDungPage;
