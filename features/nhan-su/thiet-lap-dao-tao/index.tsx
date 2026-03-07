import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Box } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import LoaiKhoaHocTab from './components/loai-khoa-hoc-tab';
import TabPlaceholderDaoTao from './components/tab-placeholder-dao-tao';

/** Thiết lập đào tạo: Loại khóa học, tab placeholder */
const ThietLapDaoTaoPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('loaikhoahoc');

  const tabFromUrl = searchParams.get('tab');
  useEffect(() => {
    if (tabFromUrl === 'loaikhoahoc' || tabFromUrl === 'placeholder') {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const tabs = useMemo(
    () => [
      { id: 'loaikhoahoc', label: t('thietLapDaoTao.tabs.loaiKhoaHoc'), icon: BookOpen },
      { id: 'placeholder', label: t('thietLapDaoTao.tabs.placeholder'), icon: Box },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === 'loaikhoahoc' && (
          <div className="flex-1 min-h-0 flex flex-col mt-1.5">
            <LoaiKhoaHocTab />
          </div>
        )}
        {activeTab === 'placeholder' && (
          <div className="flex-1 min-h-0 flex flex-col mt-1.5">
            <TabPlaceholderDaoTao />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default ThietLapDaoTaoPage;
