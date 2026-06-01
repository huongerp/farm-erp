import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, MessageSquare, ArrowLeft } from 'lucide-react';
import TabGroup from '../../../../components/ui/TabGroup';
import { useCongViecList, useDeleteCongViecList } from '../hooks/use-cong-viec';
import { useAuthStore } from '../../../../store/useStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import CongViecTable from './cong-viec-table';
import CongViecDetail from './cong-viec-detail';
import EmptyState from '../../../../components/shared/EmptyState';
import { AnimatePresence } from 'framer-motion';
import type { CongViec } from '../core/types';
import { ClipboardList } from 'lucide-react';
import Button from '../../../../components/ui/Button';

const DASHBOARD_VIEW = { my: 'my', waitReport: 'waitReport' } as const;

const CongViecDashboardTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const [activeView, setActiveView] = useState<keyof typeof DASHBOARD_VIEW>(DASHBOARD_VIEW.my);
  const [detailStack, setDetailStack] = useState<CongViec[]>([]);

  const { data: list = [], isLoading } = useCongViecList();
  const deleteMutation = useDeleteCongViecList();

  const myList = useMemo(() => {
    const uid = currentUserId === '' ? null : currentUserId;
    if (uid == null) return [];
    const match = (id: number) => id === Number(uid) || String(id) === uid;
    return list.filter(
      (c) =>
        match(c.id_nguoi_giao) ||
        (c.trach_nhiem != null && match(c.trach_nhiem)) ||
        (c.nguoi_ho_tro?.length && c.nguoi_ho_tro.some(match))
    );
  }, [list, currentUserId]);

  const waitReportList = useMemo(
    () => list.filter((c) => c.trang_thai === 'cho_bao_cao'),
    [list]
  );

  const displayList = activeView === DASHBOARD_VIEW.my ? myList : waitReportList;

  const emptyConfig = useMemo(() => {
    if (activeView === DASHBOARD_VIEW.my)
      return { title: t('congViec.dashboard.emptyMy'), description: t('congViec.dashboard.emptyMyHint') };
    return { title: t('congViec.dashboard.emptyWaitReport'), description: t('congViec.dashboard.emptyWaitReportHint') };
  }, [activeView, t]);

  const tabs = useMemo(
    () => [
      { id: DASHBOARD_VIEW.my, label: t('congViec.dashboard.cuaToi'), icon: User },
      { id: DASHBOARD_VIEW.waitReport, label: t('congViec.dashboard.choBaoCao'), icon: MessageSquare },
    ],
    [t]
  );

  const handleEdit = (item: CongViec) => setDetailStack([item]);

  const handleDelete = (id: number | string) => {
    confirm({
      title: t('congViec.deleteTitle'),
      message: t('congViec.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            setDetailStack((prev) => prev.filter((x) => x.id !== id && x.id !== Number(id)));
          },
        });
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 active:scale-95 transition-all"
            aria-label={t('common.back')}
          >
            <ArrowLeft size={15} className="stroke-[2.5px]" />
          </button>
        </div>
        <TabGroup tabs={tabs} activeTab={activeView} onChange={(id) => setActiveView(id as keyof typeof DASHBOARD_VIEW)} />
      </div>
      <div className="flex-1 min-h-0 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
        {!isLoading && displayList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              title={emptyConfig.title}
              description={emptyConfig.description}
              icon={<ClipboardList className="w-10 h-10 text-muted-foreground" />}
              action={
                <Button
                  type="button"
                  size="sm"
                  onClick={() => navigate('/hanh-chinh/cong-viec')}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {t('congViec.tabs.list')}
                </Button>
              }
            />
          </div>
        ) : (
          <CongViecTable
            data={displayList}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={(item) => setDetailStack([item])}
          />
        )}
      </div>

      <AnimatePresence>
        {detailStack.map((item, i) => (
          <CongViecDetail
            key={item.id}
            data={item}
            stackLevel={i}
            onClose={() => setDetailStack((prev) => prev.slice(0, i))}
            onEdit={(edited) => {
              setDetailStack([]);
              handleEdit(edited);
            }}
            onDelete={handleDelete}
            onDeleteChild={handleDelete}
            onViewChild={(child) => setDetailStack((prev) => [...prev.slice(0, i + 1), child])}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default CongViecDashboardTab;
