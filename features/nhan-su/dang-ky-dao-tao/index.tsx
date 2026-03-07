import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import ErrorBoundary from '../../../components/shared/ErrorBoundary';
import DanhSachTab from './components/DanhSachTab';

const TAB_CUA_TOI = 'cua-toi';
const TAB_DANG_KY_MOI = 'dang-ky-moi';
const TAB_QUAN_LY_GIAO = 'quan-ly-giao';

const DangKyDaoTaoPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const state = location.state as { prefillIdKhoaHoc?: string } | null;
  const initialPrefillIdKhoaHoc = state?.prefillIdKhoaHoc;
  const [activeTab, setActiveTab] = useState(TAB_CUA_TOI);

  useEffect(() => {
    if (initialPrefillIdKhoaHoc) {
      setActiveTab(TAB_DANG_KY_MOI);
    }
  }, [initialPrefillIdKhoaHoc]);

  const tabs = useMemo(
    () => [
      { id: TAB_CUA_TOI, label: t('dangKyDaoTao.tabs.khoaCuaToi'), icon: ClipboardList },
      { id: TAB_DANG_KY_MOI, label: t('dangKyDaoTao.tabs.dangKyMoi'), icon: ClipboardList },
      { id: TAB_QUAN_LY_GIAO, label: t('dangKyDaoTao.tabs.quanLyGiao'), icon: ClipboardList },
    ],
    [t]
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
        <div className="shrink-0 relative z-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <DanhSachTab activeTab={activeTab} initialPrefillIdKhoaHoc={initialPrefillIdKhoaHoc} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DangKyDaoTaoPage;
