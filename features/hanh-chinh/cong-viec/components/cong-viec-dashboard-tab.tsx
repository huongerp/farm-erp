import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User, Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import TabGroup from '../../../../components/ui/TabGroup';
import { useCongViecList, useDeleteCongViecList } from '../hooks/use-cong-viec';
import { useAuthStore } from '../../../../store/useStore';
import { useNotificationStore } from '../../../../store/useNotificationStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import dayjs from 'dayjs';
import { useCauHinhCongViec } from '../../thiet-lap-cong-viec/hooks/use-cau-hinh-cong-viec';
import { getDueStatus } from '../core/constants';
import CongViecTable from './cong-viec-table';
import CongViecDetail from './cong-viec-detail';
import EmptyState from '../../../../components/shared/EmptyState';
import { AnimatePresence } from 'framer-motion';
import type { CongViec } from '../core/types';
import { ClipboardList } from 'lucide-react';
import Button from '../../../../components/ui/Button';

const DASHBOARD_VIEW = { my: 'my', due: 'due', waitReport: 'waitReport' } as const;

const CongViecDashboardTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const currentUserId = user?.id ?? '';
  const [activeView, setActiveView] = useState(DASHBOARD_VIEW.my);
  const [detailItem, setDetailItem] = useState<CongViec | null>(null);

  const { data: list = [], isLoading } = useCongViecList();
  const deleteMutation = useDeleteCongViecList();
  const { data: cauHinh } = useCauHinhCongViec();
  const soNgayCanhBao = cauHinh?.so_ngay_canh_bao_sap_han ?? 7;
  const batCanhBaoQuaHan = cauHinh?.bat_canh_bao_qua_han ?? true;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const myList = useMemo(
    () =>
      list.filter(
        (c) =>
          c.danh_sach_nguoi_thuc_hien?.includes(currentUserId) || c.id_nguoi_giao === currentUserId
      ),
    [list, currentUserId]
  );

  const dueList = useMemo(() => {
    const endOfRange = dayjs().add(soNgayCanhBao, 'day').endOf('day').valueOf();
    return list.filter((c) => {
      const due = dayjs(c.ngay_het_han, 'YYYY-MM-DD').startOf('day').valueOf();
      if (due < today) return batCanhBaoQuaHan; // quá hạn
      return due <= endOfRange; // sắp hạn trong N ngày
    });
  }, [list, today, soNgayCanhBao, batCanhBaoQuaHan]);

  const waitReportList = useMemo(
    () => list.filter((c) => c.trang_thai === 'cho_bao_cao'),
    [list]
  );

  useEffect(() => {
    if (!myList.length || !cauHinh || !currentUserId) return;
    if (sessionStorage.getItem('congViecDueNotifiedSession')) return;
    let sapHan = 0;
    let quaHan = 0;
    myList.forEach((c) => {
      const status = getDueStatus(c.ngay_het_han, cauHinh);
      if (status === 'sap_han') sapHan += 1;
      if (status === 'qua_han') quaHan += 1;
    });
    if (sapHan + quaHan > 0) {
      sessionStorage.setItem('congViecDueNotifiedSession', '1');
      useNotificationStore.getState().add({
        title: t('congViec.dueSoon'),
        message: t('congViec.notif.dueSoonSummary', { sapHan, quaHan }),
        type: 'warning',
        link: '/hanh-chinh/cong-viec-cua-toi',
      });
    }
  }, [myList, cauHinh, currentUserId, t]);

  const displayList =
    activeView === DASHBOARD_VIEW.my
      ? myList
      : activeView === DASHBOARD_VIEW.due
        ? dueList
        : waitReportList;

  const emptyConfig = useMemo(() => {
    if (activeView === DASHBOARD_VIEW.my)
      return { title: t('congViec.dashboard.emptyMy'), description: t('congViec.dashboard.emptyMyHint') };
    if (activeView === DASHBOARD_VIEW.due)
      return { title: t('congViec.dashboard.emptyDue'), description: t('congViec.dashboard.emptyDueHint') };
    return { title: t('congViec.dashboard.emptyWaitReport'), description: t('congViec.dashboard.emptyWaitReportHint') };
  }, [activeView, t]);

  const tabs = useMemo(
    () => [
      { id: DASHBOARD_VIEW.my, label: t('congViec.dashboard.cuaToi'), icon: User },
      { id: DASHBOARD_VIEW.due, label: t('congViec.dashboard.denHan'), icon: Clock },
      { id: DASHBOARD_VIEW.waitReport, label: t('congViec.dashboard.choBaoCao'), icon: MessageSquare },
    ],
    [t]
  );

  const handleEdit = (item: CongViec) => setDetailItem(item);

  const handleDelete = (id: string) => {
    confirm({
      title: t('congViec.deleteTitle'),
      message: t('congViec.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
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
                  onClick={() => navigate('/hanh-chinh/cong-viec-cua-toi')}
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
            onView={(item) => setDetailItem(item)}
          />
        )}
      </div>

      <AnimatePresence>
        {detailItem && (
          <CongViecDetail
            data={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(item) => {
              setDetailItem(null);
              handleEdit(item);
            }}
            onDelete={handleDelete}
            onDeleteChild={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CongViecDashboardTab;
