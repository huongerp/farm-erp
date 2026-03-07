import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Swords, History, FileText } from 'lucide-react';
import Button from '../../../components/ui/Button';
import DashboardToolbar from '../../../components/shared/DashboardToolbar';
import TabGroup from '../../../components/ui/TabGroup';
import EmptyState from '../../../components/shared/EmptyState';
import { useDoiThuById } from './hooks/use-phan-tich-doi-thu';
import TabHoSo from './components/TabHoSo';
import TabTaiLieu from './components/TabTaiLieu';
import TabBattlecard from './components/TabBattlecard';
import TabNhatKy from './components/TabNhatKy';

const TAB_HO_SO = 'ho-so';
const TAB_TAI_LIEU = 'tai-lieu';
const TAB_SWOT = 'swot';
const TAB_NHAT_KY = 'nhat-ky';

const PhanTichDoiThuDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TAB_HO_SO);

  const { data: doiThu, isLoading: loadingDoiThu } = useDoiThuById(id);

  const tabs = [
    { id: TAB_HO_SO, label: t('phanTichDoiThu.tab.hoSo'), icon: Building2 },
    { id: TAB_TAI_LIEU, label: t('phanTichDoiThu.tab.taiLieu'), icon: FileText },
    { id: TAB_SWOT, label: t('phanTichDoiThu.tab.swot'), icon: Swords },
    { id: TAB_NHAT_KY, label: t('phanTichDoiThu.tab.nhatKy'), icon: History },
  ];

  if (loadingDoiThu || !id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!doiThu) {
    return (
      <div className="flex flex-col min-h-[40vh]">
        <DashboardToolbar onBack={() => navigate('/dieu-hanh/phan-tich-doi-thu')} />
        <EmptyState
          title={t('phanTichDoiThu.service.notFound')}
          description={t('phanTichDoiThu.backToList')}
          icon={<Building2 className="w-10 h-10 text-muted-foreground" />}
        />
        <Button variant="outline" onClick={() => navigate('/dieu-hanh/phan-tich-doi-thu')} className="mt-4 mx-auto">
          {t('phanTichDoiThu.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] min-h-0">
      <DashboardToolbar
        onBack={() => navigate('/dieu-hanh/phan-tich-doi-thu')}
        leadingContent={
          <div className="flex items-center gap-3 min-w-0">
            {doiThu.logo && (
              <img
                src={doiThu.logo}
                alt=""
                className="w-10 h-10 rounded-lg border border-border object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-foreground truncate">{doiThu.ten_doi_thu}</h1>
              <p className="text-xs text-muted-foreground truncate">{doiThu.diem_manh_nhat ?? '—'}</p>
            </div>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex flex-col px-4 pb-4 overflow-hidden">
        <div className="pt-2 pb-3 shrink-0">
          <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          {activeTab === TAB_HO_SO && <TabHoSo data={doiThu} />}
          {activeTab === TAB_TAI_LIEU && <TabTaiLieu doiThuId={doiThu.id} />}
          {activeTab === TAB_SWOT && <TabBattlecard doiThuId={doiThu.id} data={doiThu} />}
          {activeTab === TAB_NHAT_KY && <TabNhatKy doiThuId={doiThu.id} />}
        </div>
      </div>
    </div>
  );
};

export default PhanTichDoiThuDetailPage;
