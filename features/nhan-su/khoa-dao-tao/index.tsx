import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import DanhSachTab from './components/DanhSachTab';
import { useLoaiKhoaHocs } from '@/features/nhan-su/thiet-lap-dao-tao/hooks/use-loai-khoa-hoc';

const TAB_TAT_CA = 'tat-ca';

/** Khóa đào tạo: tab Tất cả + một tab cho mỗi Loại khóa học */
const KhoaDaoTaoPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: loaiList = [] } = useLoaiKhoaHocs();
  const [activeTab, setActiveTab] = useState(TAB_TAT_CA);

  const tabs = useMemo(
    () => [
      { id: TAB_TAT_CA, label: t('khoaDaoTao.tabs.tatCa'), icon: BookOpen },
      ...loaiList.map((l) => ({ id: l.id, label: l.ten, icon: BookOpen })),
    ],
    [t, loaiList]
  );

  const idLoaiKhoaHoc = activeTab === TAB_TAT_CA ? null : activeTab;

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <DanhSachTab idLoaiKhoaHoc={idLoaiKhoaHoc} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default KhoaDaoTaoPage;
