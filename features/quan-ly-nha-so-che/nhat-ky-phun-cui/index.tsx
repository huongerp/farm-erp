/** Quản lý nhà sơ chế > Nhật ký pha thuốc phun cùi: tab Nhật ký + tab Định mức thuốc theo NSC. */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Droplets, ListChecks } from 'lucide-react';
import TabGroup from '../../../components/ui/TabGroup';
import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import { useBranches } from '../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useNhatKyPhunCuiViewScope } from './hooks/use-nhat-ky-phun-cui-view-scope';
import NhatKyTab from './components/NhatKyTab';
import DinhMucTab from './components/DinhMucTab';

type TabId = 'nhat-ky' | 'dinh-muc';

const NhatKyPhunCuiPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete, canAdmin } = useModulePermissionFromContext();
  const viewScope = useNhatKyPhunCuiViewScope();
  const { data: allBranches = [] } = useBranches();
  const [activeTab, setActiveTab] = useState<TabId>('nhat-ky');

  /** Cấp cao thấy mọi NSC; nhân viên thường chỉ NSC được phân (form + bộ lọc đều dùng danh sách này). */
  const branches = useMemo(
    () => (viewScope.viewAll ? allBranches : allBranches.filter((b) => viewScope.allowedBranchIds.includes(b.id))),
    [allBranches, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const tabs = useMemo(
    () => [
      { id: 'nhat-ky', label: t('nkpc.tabs.nhatKy'), icon: Droplets },
      { id: 'dinh-muc', label: t('nkpc.tabs.dinhMuc'), icon: ListChecks },
    ],
    [t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-7.75rem-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0 mb-1.5">
        <TabGroup tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TabId)} />
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {activeTab === 'nhat-ky' && (
          <NhatKyTab
            viewScope={viewScope}
            branches={branches}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
        {activeTab === 'dinh-muc' && <DinhMucTab viewScope={viewScope} branches={branches} canEdit={canAdmin || canUpdate} />}
      </div>
    </div>
  );
};

export default NhatKyPhunCuiPage;
