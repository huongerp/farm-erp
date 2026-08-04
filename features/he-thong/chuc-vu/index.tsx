import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getLanguage } from '../../../lib/utils';

import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import PositionForm from './components/chuc-vu-form';
import PositionDetail from './components/chuc-vu-detail';
import PositionToolbar from './components/chuc-vu-toolbar';
import PositionTable from './components/chuc-vu-table';
import ExportDialog from '../../../components/shared/LazyExportDialog';

import { usePositions, useDeletePosition, useUpdateStatusPosition } from './hooks/use-chuc-vu';
import { usePositionStore } from './store/usePositionStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { Position } from './core/types';
import { TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../lib/constants';

const PositionPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);

  const [showForm, setShowForm] = useState(false);
  const [editingPos, setEditingPos] = useState<Position | null>(null);
  const [viewingPos, setViewingPos] = useState<Position | null>(null);
  const [formOrigin, setFormOrigin] = useState<'list' | 'detail'>('list');
  const [showExport, setShowExport] = useState(false);

  const {
    searchTerm,
    filters,
    sort,
    resetState,
    clearSelection,
    selectedIds,
    pagination,
    columns,
  } = usePositionStore();

  const { data: positions = [], isLoading } = usePositions();
  const deleteMutation = useDeletePosition();
  const statusMutation = useUpdateStatusPosition();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Đồng bộ viewing với list sau refetch (action từ detail hoặc từ nơi khác)
  useEffect(() => {
    if (!viewingPos) return;
    const fresh = positions.find((p) => p.id === viewingPos.id);
    if (fresh && fresh !== viewingPos) setViewingPos(fresh);
  }, [positions, viewingPos?.id]);

  const filterFn = useCallback(
    (item: Position, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch = Boolean(
        !term ||
        (item.ma_chuc_vu && item.ma_chuc_vu.toLowerCase().includes(searchLower)) ||
        item.ten_chuc_vu.toLowerCase().includes(searchLower) ||
        (item.mo_ta && item.mo_ta.toLowerCase().includes(searchLower))
      );
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredPositions = useListWithFilter(positions, searchTerm, filters, filterFn);

  const sortedPositions = useMemo(() => {
    const sorted = [...filteredPositions];
    if (sort.column && sort.direction) {
      sorted.sort((a: any, b: any) => {
        const aVal = a[sort.column!] ?? '';
        const bVal = b[sort.column!] ?? '';
        let cmp = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
        else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
        return sort.direction === 'desc' ? -cmp : cmp;
      });
    } else {
      sorted.sort((a: Position, b: Position) => a.tt - b.tt || a.ten_chuc_vu.localeCompare(b.ten_chuc_vu, getLanguage()));
    }
    return sorted;
  }, [filteredPositions, sort]);

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'ten_chuc_vu', label: t('position.exportName') },
      { key: 'ten_phong_ban', label: t('position.store.deptCol') },
      { key: 'ten_cap_bac', label: t('position.store.levelCol') },
      { key: 'mo_ta', label: t('position.exportDesc') },
      { key: 'trang_thai_text', label: t('position.exportStatus') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: Position) => ({
      ten_chuc_vu: item.ten_chuc_vu,
      ten_phong_ban: item.ten_phong_ban ?? '',
      ten_cap_bac: item.ten_cap_bac ?? '',
      mo_ta: item.mo_ta ?? '',
      trang_thai_text:
        item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('position.active') : t('common.inactive'),
    }),
    [t]
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: filteredPositions,
      isOpen: showExport,
      mapFn: exportMapFn,
      pagination,
      selectedIds,
      keyExtractor: (p) => p.id,
    });

  const visibleColumnKeys = useMemo(
    () => columns.filter((c) => c.visible).map((c) => c.id),
    [columns]
  );

  const handleEdit = (item: Position) => {
    setFormOrigin(viewingPos ? 'detail' : 'list');
    setEditingPos(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('position.deleteTitle'),
      message: t('position.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (viewingPos && viewingPos.id === id) setViewingPos(null);
          },
        });
      },
    });
  };

  const handleStatusChange = (item: Position) => {
    const newStatus =
      item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG
        ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG
        : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    const statusLabel =
      newStatus === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('position.active') : t('position.inactive');
    confirm({
      title: t('position.statusChangeTitle'),
      message: `${t('position.statusChangeMessage', { count: 1 })} ${statusLabel}?`,
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { ids: [item.id], status: newStatus },
          {
            onSuccess: (updated) => {
              if (updated && viewingPos?.id === updated.id) setViewingPos(updated);
            },
          }
        );
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('position.bulkDeleteTitle'),
      message: t('position.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleStatusChangeMany = (ids: string[], status: TrangThaiHoatDong) => {
    confirm({
      title: t('position.statusChangeTitle'),
      message: `${t('position.statusChangeMessage', { count: ids.length })} ${status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('position.active') : t('common.inactive')}?`,
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate({ ids, status }, { onSuccess: () => clearSelection() });
      },
    });
  };

  const toolbarItems = useMemo(
    () => positions.map((p) => ({ trang_thai: p.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Đang dùng' : 'Ngừng' })),
    [positions]
  );

  const handleExport = () => {
    if (filteredPositions.length === 0) {
      toast.warning(t('position.noExportData'));
      return;
    }
    setShowExport(true);
  };

  const handleCloseForm = () => {
    const wasEditing = editingPos;
    const origin = formOrigin;
    setShowForm(false);
    setEditingPos(null);
    if (origin === 'detail' && viewingPos && wasEditing && viewingPos.id === wasEditing.id) {
      const fresh = positions.find((p) => p.id === viewingPos.id);
      if (fresh) setViewingPos(fresh);
    }
    setFormOrigin('list');
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <PositionToolbar
          items={toolbarItems}
          onAdd={() => setShowForm(true)}
          onExport={handleExport}
          onImport={() => toast.info(t('position.importDeveloping'))}
          onDeleteMany={handleDeleteMany}
          onStatusChangeMany={handleStatusChangeMany}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />

        <div className="flex-1 min-h-0">
          <PositionTable
            data={sortedPositions}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onView={setViewingPos}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <PositionForm initialData={editingPos} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingPos && !showForm && (
          <PositionDetail
            data={viewingPos}
            onClose={() => setViewingPos(null)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={EXPORT_COLUMNS}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName="Danh_Sach_Chuc_Vu"
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PositionPage;
