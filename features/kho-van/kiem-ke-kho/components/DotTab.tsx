import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModulePermissionFromContext } from '../../../../components/shared/ModulePermissionGuard';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import KiemKeKhoToolbar from './KiemKeKhoToolbar';
import DotKiemKeKhoTable from './DotKiemKeKhoTable';
import DotKiemKeKhoDetail from './DotKiemKeKhoDetail';
import DotKiemKeKhoForm from './DotKiemKeKhoForm';
import TaoDanhSachKiemKeDialog from './TaoDanhSachKiemKeDialog';
import {
  useDotKiemKeKhoList,
  useDotKiemKeKhoById,
  useChiTietByDot,
  useDeleteDotKiemKeKho,
  useTaoDanhSachKiemKe,
  useHoanThanhDot,
  useChangeTrangThaiDot,
} from '../hooks/use-kiem-ke-kho';
import { useKiemKeKhoViewScope } from '../hooks/use-kiem-ke-kho-view-scope';
import { filterDotKiemKeListByViewScope } from '../utils/dot-kiem-ke-view-scope-filter';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';
import { useKiemKeKhoStore } from '../store/useKiemKeKhoStore';
import { getLanguage } from '../../../../lib/utils';
import Select from '../../../../components/ui/Select';
import { CONFIRM_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { TRANG_THAI_DOT_OPTIONS } from '../core/constants';
import type { DotKiemKeKho, TrangThaiDotKiemKeKho } from '../core/types';

const DotTab: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);
  const { searchTerm, filters, sort, resetState, clearSelection } = useKiemKeKhoStore();
  const { data: list = [], isLoading } = useDotKiemKeKhoList({
    q: searchTerm || undefined,
    trang_thai_dot: filters.trang_thai_dot.length ? (filters.trang_thai_dot as TrangThaiDotKiemKeKho[]) : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    id_nguoi_phu_trach: filters.id_nguoi_phu_trach.length ? filters.id_nguoi_phu_trach : undefined,
    id_kho: filters.id_kho.length ? filters.id_kho : undefined,
  });
  const { data: khoList = [] } = useKhoList();
  const viewScope = useKiemKeKhoViewScope();

  const viewableList = useMemo(
    () => filterDotKiemKeListByViewScope(list, khoList, viewScope),
    [list, khoList, viewScope]
  );

  const deleteMutation = useDeleteDotKiemKeKho();
  const taoDanhSachMutation = useTaoDanhSachKiemKe();
  const hoanThanhMutation = useHoanThanhDot();
  const changeTrangThaiMutation = useChangeTrangThaiDot();
  const [detailItem, setDetailItem] = useState<DotKiemKeKho | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDot, setEditingDot] = useState<DotKiemKeKho | null>(null);
  const [showTaoDanhSachDialog, setShowTaoDanhSachDialog] = useState(false);
  const [dotIdForTaoDanhSach, setDotIdForTaoDanhSach] = useState<string | null>(null);

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  const sortedList = useMemo(() => {
    if (!sort.column || !sort.direction) return viewableList;
    const sorted = [...viewableList];
    sorted.sort((a, b) => {
      const aVal = a[sort.column as keyof DotKiemKeKho] ?? '';
      const bVal = b[sort.column as keyof DotKiemKeKho] ?? '';
      const cmp =
        typeof aVal === 'number' && typeof bVal === 'number'
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [viewableList, sort]);

  const handleAdd = useCallback(() => {
    setEditingDot(null);
    setShowForm(true);
  }, []);
  const handleView = useCallback((item: DotKiemKeKho) => {
    setDetailItem(item);
    setEditingDot(null);
    setShowForm(false);
  }, []);
  const handleEdit = useCallback((item: DotKiemKeKho) => {
    setDetailItem(null);
    setEditingDot(item);
    setShowForm(true);
  }, []);
  const handleSuccessAfterEdit = useCallback((item: DotKiemKeKho) => {
    setShowForm(false);
    setEditingDot(null);
    setDetailItem(item);
  }, []);
  const handleDelete = useCallback(
    (item: DotKiemKeKho) => {
      confirm({
        title: t('kiemKeKho.deleteTitle'),
        message: t('kiemKeKho.deleteMessage'),
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
        title: t('kiemKeKho.bulkDeleteTitle'),
        message: t('kiemKeKho.bulkDeleteMessage', { count: ids.length }),
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
    (dot: DotKiemKeKho) => {
      let selectedTrangThai: TrangThaiDotKiemKeKho = dot.trang_thai;
      confirm({
        title: t('kiemKeKho.changeStatusTitle'),
        message: (
          <div className="space-y-4 text-left py-2">
            <p className="text-sm">{t('kiemKeKho.changeStatusMessage')}</p>
            <Select
              defaultValue={dot.trang_thai}
              options={TRANG_THAI_DOT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
              onChange={(e) => { selectedTrangThai = e.target.value as TrangThaiDotKiemKeKho; }}
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

  const { data: detailDot } = useDotKiemKeKhoById(detailItem?.id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietByDot(detailItem?.id ?? null);
  const detailData = detailDot ?? detailItem;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <KiemKeKhoToolbar
        items={sortedList}
        onAdd={handleAdd}
        onDeleteMany={handleDeleteMany}
        showAdd={canCreate}
        canCreate={canCreate}
        canDelete={canDelete}
      />
      <div className="flex-1 min-h-0 mt-1.5">
        <DotKiemKeKhoTable
          data={sortedList}
          isLoading={isLoading}
          onView={handleView}
          onEdit={canUpdate ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          showActions
        />
      </div>

      {detailData && (
        <DotKiemKeKhoDetail
          data={detailData}
          chiTiet={chiTiet}
          chiTietLoading={chiTietLoading}
          onClose={() => setDetailItem(null)}
          onEdit={canUpdate ? handleEdit : undefined}
          onTaoDanhSach={canUpdate ? () => {
            setDotIdForTaoDanhSach(detailData.id);
            setShowTaoDanhSachDialog(true);
          } : undefined}
          onHoanThanh={canUpdate ? () => hoanThanhMutation.mutate(detailData.id) : undefined}
          onStatusChange={canUpdate ? handleStatusChange : undefined}
          taoDanhSachLoading={taoDanhSachMutation.isPending}
          hoanThanhLoading={hoanThanhMutation.isPending}
        />
      )}

      {showForm && (
        <DotKiemKeKhoForm
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
        onConfirm={(id_dot_kiem_ke_kho, filters) => {
          taoDanhSachMutation.mutate(
            { id_dot_kiem_ke_kho, filters },
            {
              onSettled: () => {
                setShowTaoDanhSachDialog(false);
                setDotIdForTaoDanhSach(null);
              },
            }
          );
        }}
        isLoading={taoDanhSachMutation.isPending}
        dotId={dotIdForTaoDanhSach ?? detailData?.id ?? null}
        idKhoOfDot={detailData?.id_kho}
      />
    </div>
  );
};

export default DotTab;
