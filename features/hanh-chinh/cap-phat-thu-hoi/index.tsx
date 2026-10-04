import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { History, User, FileSpreadsheet, BarChart3 } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import LichSuTab from './components/LichSuTab';
import CuaToiTab from './components/CuaToiTab';
import ChiTietTab from './components/ChiTietTab';
import ThongKeTab from './components/ThongKeTab';
import { useCapPhatThuHoiViewScope } from './hooks/use-cap-phat-thu-hoi-view-scope';

const VALID_TABS = ['history', 'mine', 'detail', 'stats'] as const;
type TabId = (typeof VALID_TABS)[number];
const isValidTab = (id: string | null): id is TabId => VALID_TABS.includes(id as TabId);

const CapPhatThuHoiPage: React.FC = () => {
  const { t } = useTranslation();
  const { viewAll } = useCapPhatThuHoiViewScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const taiSanIdFromQuery = searchParams.get('tai_san_id') ?? undefined;
  const tabFromUrl = searchParams.get('tab');
  // Tab ban đầu: có ?tai_san_id= (và xem được toàn bộ) thì ưu tiên "Lịch sử", sau đó mới tới ?tab=.
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    taiSanIdFromQuery && viewAll ? 'history' : isValidTab(tabFromUrl) ? tabFromUrl : 'history'
  );

  // Các đồng bộ dưới đây điều chỉnh state ngay lúc render (mẫu "adjust state while rendering")
  // thay vì effect; thứ tự giữ như các effect cũ: URL → tai_san_id → chặn tab "Lịch sử".
  const [prevTabFromUrl, setPrevTabFromUrl] = useState(tabFromUrl);
  if (tabFromUrl !== prevTabFromUrl) {
    setPrevTabFromUrl(tabFromUrl);
    if (isValidTab(tabFromUrl)) setActiveTab(tabFromUrl);
  }

  const handleTabChange = (id: string) => {
    if (VALID_TABS.includes(id as TabId)) {
      setActiveTab(id as TabId);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', id);
        return next;
      });
    }
  };

  const tabs = useMemo(() => {
    const all = [
      { id: 'history', label: t('capPhatThuHoi.tabs.history'), icon: History },
      { id: 'mine', label: t('capPhatThuHoi.tabs.mine'), icon: User },
      { id: 'detail', label: t('capPhatThuHoi.tabs.detail'), icon: FileSpreadsheet },
      { id: 'stats', label: t('capPhatThuHoi.tabs.stats'), icon: BarChart3 },
    ];
    return viewAll ? all : [all[1], all[2], all[3]];
  }, [t, viewAll]);

  const [prevTaiSanScope, setPrevTaiSanScope] = useState({ taiSanIdFromQuery, viewAll });
  if (prevTaiSanScope.taiSanIdFromQuery !== taiSanIdFromQuery || prevTaiSanScope.viewAll !== viewAll) {
    setPrevTaiSanScope({ taiSanIdFromQuery, viewAll });
    if (taiSanIdFromQuery && viewAll) setActiveTab('history');
  }

  if (!viewAll && activeTab === 'history') setActiveTab('mine');

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />
      </div>

      {activeTab === 'history' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <LichSuTab defaultTaiSanId={taiSanIdFromQuery} />
        </div>
      )}
      {activeTab === 'mine' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <CuaToiTab />
        </div>
      )}
      {activeTab === 'detail' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <ChiTietTab />
        </div>
      )}
      {activeTab === 'stats' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5">
          <ThongKeTab />
        </div>
      )}
    </div>
  );
};

export default CapPhatThuHoiPage;
