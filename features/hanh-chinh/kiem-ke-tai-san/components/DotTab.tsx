import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import KiemKeTaiSanToolbar from './KiemKeTaiSanToolbar';
import DotKiemKeTable from './DotKiemKeTable';
import DotKiemKeDetail from './DotKiemKeDetail';
import DotKiemKeForm from './DotKiemKeForm';
import TaoDanhSachKiemKeDialog from './TaoDanhSachKiemKeDialog';
import { useDotKiemKeList, useDotKiemKeById, useChiTietByDot, useDeleteDotKiemKe, useTaoDanhSachKiemKe, useHoanThanhDot, useChangeTrangThaiDot } from '../hooks/use-kiem-ke-tai-san';
import { useKiemKeTaiSanViewScope } from '../hooks/use-kiem-ke-tai-san-view-scope';
import { useAuthStore } from '../../../../store/useStore';
import { useKiemKeTaiSanStore } from '../store/useKiemKeTaiSanStore';
import { getLanguage } from '../../../../lib/utils';
import Select from '../../../../components/ui/Select';
import { CONFIRM_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { TRANG_THAI_DOT_OPTIONS } from '../core/constants';
import type { DotKiemKe, TrangThaiDotKiemKe } from '../core/types';

const DotTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchTerm, filters, sort, resetState, clearSelection } = useKiemKeTaiSanStore();
  const user = useAuthStore((s) => s.user);
  const { viewAll } = useKiemKeTaiSanViewScope();
  const { data: list = [], isLoading } = useDotKiemKeList({
    q: searchTerm || undefined,
    trang_thai_dot: filters.trang_thai_dot.length ? filters.trang_thai_dot : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    id_nguoi_phu_trach: filters.id_nguoi_phu_trach.length ? filters.id_nguoi_phu_trach : undefined,
  });

  const viewableList = useMemo(() => {
    if (viewAll) return list;
    const myId = user?.id ?? '';
    return list.filter((d) => String(d.id_nguoi_phu_trach) === String(myId));
  }, [list, viewAll, user?.id]);

  const deleteMutation = useDeleteDotKiemKe();
  const taoDanhSachMutation = useTaoDanhSachKiemKe();
  const hoanThanhMutation = useHoanThanhDot();
  const changeTrangThaiMutation = useChangeTrangThaiDot();
  const [detailItem, setDetailItem] = useState<DotKiemKe | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDot, setEditingDot] = useState<DotKiemKe | null>(null);
  const [showTaoDanhSachDialog, setShowTaoDanhSachDialog] = useState(false);
  const [dotIdForTaoDanhSach, setDotIdForTaoDanhSach] = useState<string | null>(null);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return viewableList;
    const sorted = [...viewableList];
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof DotKiemKe] ?? '';
      const bVal = b[sort.column as keyof DotKiemKe] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [viewableList, sort]);

  const handleAdd = useCallback(() => {
    setEditingDot(null);
    setShowForm(true);
  }, []);
  const handleView = useCallback((item: DotKiemKe) => {
    setDetailItem(item);
    setEditingDot(null);
    setShowForm(false);
  }, []);
  const handleEdit = useCallback((item: DotKiemKe) => {
    setDetailItem(null);
    setEditingDot(item);
    setShowForm(true);
  }, []);
  const handleSuccessAfterEdit = useCallback((item: DotKiemKe) => {
    setShowForm(false);
    setEditingDot(null);
    setDetailItem(item);
  }, []);
  const handleDelete = useCallback(
    (item: DotKiemKe) => {
      confirm({
        title: t('kiemKeTaiSan.deleteTitle'),
        message: t('kiemKeTaiSan.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate([item.id], {
            onSuccess: () => {
              if (detailItem?.id === item.id) setDetailItem(null);
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem]
  );
  const handleDeleteMany = useCallback(
    (ids: string[]) => {
      confirm({
        title: t('kiemKeTaiSan.bulkDeleteTitle'),
        message: t('kiemKeTaiSan.bulkDeleteMessage', { count: ids.length }),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: () => {
          deleteMutation.mutate(ids, {
            onSuccess: () => {
              if (detailItem && ids.includes(detailItem.id)) setDetailItem(null);
              clearSelection();
            },
          });
        },
      });
    },
    [confirm, t, deleteMutation, detailItem, clearSelection]
  );

  const handleStatusChange = useCallback(
    (dot: DotKiemKe) => {
      let selectedTrangThai: TrangThaiDotKiemKe = dot.trang_thai;
      confirm({
        title: t('kiemKeTaiSan.changeStatusTitle'),
        message: (
          <div className="space-y-4 text-left py-2">
            <p className="text-sm">{t('kiemKeTaiSan.changeStatusMessage')}</p>
            <Select
              defaultValue={dot.trang_thai}
              options={TRANG_THAI_DOT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              onChange={(e) => { selectedTrangThai = e.target.value as TrangThaiDotKiemKe; }}
            />
          </div>
        ),
        variant: 'info',
        confirmText: CONFIRM_YES(),
        onConfirm: () => {
          changeTrangThaiMutation.mutate({ id: dot.id, trang_thai: selectedTrangThai });
        },
      });
    },
    [confirm, t, changeTrangThaiMutation]
  );

  const { data: detailDot } = useDotKiemKeById(detailItem?.id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietByDot(detailItem?.id ?? null);
  const detailData = detailDot ?? detailItem;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <KiemKeTaiSanToolbar
        items={sortedList}
        onAdd={handleAdd}
        onDeleteMany={handleDeleteMany}
        showAdd={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 mt-1.5">
        <DotKiemKeTable
          data={sortedList}
          isLoading={isLoading}
          onView={handleView}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          showActions
        />
      </div>

      {detailData && (
        <DotKiemKeDetail
          data={detailData}
          chiTiet={chiTiet}
          chiTietLoading={chiTietLoading}
          onClose={() => setDetailItem(null)}
          onEdit={canUpdate ? handleEdit : undefined}
          onTaoDanhSach={() => {
            setDotIdForTaoDanhSach(detailData.id);
            setShowTaoDanhSachDialog(true);
          }}
          onHoanThanh={() => hoanThanhMutation.mutate(detailData.id)}
          onStatusChange={handleStatusChange}
          taoDanhSachLoading={taoDanhSachMutation.isPending}
          hoanThanhLoading={hoanThanhMutation.isPending}
        />
      )}

      {showForm && (
        <DotKiemKeForm
          initialData={editingDot}
          onClose={() => {
            setShowForm(false);
            setEditingDot(null);
          }}
          onSuccessAfterEdit={handleSuccessAfterEdit}
        />
      )}

      <TaoDanhSachKiemKeDialog
        open={showTaoDanhSachDialog}
        onClose={() => {
          setShowTaoDanhSachDialog(false);
          setDotIdForTaoDanhSach(null);
        }}
        onConfirm={(filters) => {
          if (dotIdForTaoDanhSach) {
            taoDanhSachMutation.mutate(
              { id_dot_kiem_ke: dotIdForTaoDanhSach, filters },
              {
                onSettled: () => {
                  setShowTaoDanhSachDialog(false);
                  setDotIdForTaoDanhSach(null);
                },
              }
            );
          }
        }}
        isLoading={taoDanhSachMutation.isPending}
      />
    </div>
  );
};

export default DotTab;
