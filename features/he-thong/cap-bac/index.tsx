import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getLanguage } from '../../../lib/utils';

import { useModulePermissionFromContext } from '../../../components/shared/ModulePermissionGuard';
import JobLevelForm from './components/cap-bac-form';
import JobLevelDetail from './components/cap-bac-detail';
import JobLevelToolbar from './components/cap-bac-toolbar';
import JobLevelTable from './components/cap-bac-table';
import ExportDialog from '../../../components/shared/ExportDialog';

import { useJobLevels, useDeleteJobLevel, useUpdateStatusJobLevel } from './hooks/use-cap-bac';
import { useJobLevelStore } from './store/useJobLevelStore';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { CONFIRM_DELETE, CONFIRM_YES, CONFIRM_DELETE_ALL } from '../../../lib/button-labels';
import { useListWithFilter } from '../../../lib/hooks';
import { useExportData } from '../../../lib/useExportData';
import { JobLevel } from './core/types';
import { TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../lib/constants';

const JobLevelPage: React.FC = () => {
  const { t } = useTranslation();
  const { canCreate, canUpdate, canDelete } = useModulePermissionFromContext();
  const confirm = useConfirmStore((s) => s.confirm);

  const [showForm, setShowForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<JobLevel | null>(null);
  const [viewingLevel, setViewingLevel] = useState<JobLevel | null>(null);
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
  } = useJobLevelStore();

  const { data: jobLevels = [], isLoading } = useJobLevels();
  const deleteMutation = useDeleteJobLevel();
  const statusMutation = useUpdateStatusJobLevel();

  useEffect(() => {
    return () => resetState();
  }, [resetState]);

  // Đồng bộ viewing với list sau refetch (action từ detail hoặc từ nơi khác)
  useEffect(() => {
    if (!viewingLevel) return;
    const fresh = jobLevels.find((l) => l.id === viewingLevel.id);
    if (fresh && fresh !== viewingLevel) setViewingLevel(fresh);
  }, [jobLevels, viewingLevel?.id]);

  const filterFn = useCallback(
    (item: JobLevel, term: string, f: typeof filters) => {
      const searchLower = term.toLowerCase();
      const matchesSearch =
        !term ||
        item.ten_cap_bac.toLowerCase().includes(searchLower) ||
        (item.mo_ta && item.mo_ta.toLowerCase().includes(searchLower)) ||
        String(item.cap_bac).includes(term);
      const statusKey = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? 'Active' : 'Inactive';
      const matchesStatus = f.status.length === 0 || f.status.includes(statusKey);
      return matchesSearch && matchesStatus;
    },
    []
  );

  const filteredLevels = useListWithFilter(jobLevels, searchTerm, filters, filterFn);

  const sortedLevels = useMemo(() => {
    if (!sort.column || !sort.direction) return filteredLevels;
    const sorted = [...filteredLevels];
    sorted.sort((a: any, b: any) => {
      const aVal = a[sort.column!] ?? '';
      const bVal = b[sort.column!] ?? '';
      let cmp = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') cmp = aVal - bVal;
      else cmp = String(aVal).localeCompare(String(bVal), getLanguage());
      return sort.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [filteredLevels, sort]);

  const EXPORT_COLUMNS = useMemo(
    () => [
      { key: 'cap_bac', label: t('jobLevel.exportOrder') },
      { key: 'ten_cap_bac', label: t('jobLevel.exportName') },
      { key: 'mo_ta', label: t('jobLevel.exportDesc') },
      { key: 'trang_thai_text', label: t('jobLevel.exportStatus') },
    ],
    [t]
  );

  const exportMapFn = useCallback(
    (item: JobLevel) => ({
      cap_bac: item.cap_bac,
      ten_cap_bac: item.ten_cap_bac,
      mo_ta: item.mo_ta ?? '',
      trang_thai_text:
        item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('jobLevel.active') : t('common.inactiveStatus'),
    }),
    [t]
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: filteredLevels,
      isOpen: showExport,
      mapFn: exportMapFn,
      pagination,
      selectedIds,
      keyExtractor: (item) => item.id,
    });

  const visibleColumnKeys = useMemo(
    () => columns.filter((c) => c.visible).map((c) => c.id),
    [columns]
  );

  const handleEdit = (item: JobLevel) => {
    setFormOrigin(viewingLevel ? 'detail' : 'list');
    setEditingLevel(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: t('jobLevel.deleteTitle'),
      message: t('jobLevel.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: async () => {
        deleteMutation.mutate([id], {
          onSuccess: () => {
            if (viewingLevel && viewingLevel.id === id) setViewingLevel(null);
          },
        });
      },
    });
  };

  const handleStatusChange = (item: JobLevel) => {
    const newStatus = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    const statusLabel = newStatus === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('jobLevel.active') : t('jobLevel.inactive');
    confirm({
      title: t('jobLevel.statusChangeTitle'),
      message: `${t('jobLevel.statusChangeMessage', { count: 1 })} ${statusLabel}?`,
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate(
          { ids: [item.id], status: newStatus },
          {
            onSuccess: (updated) => {
              if (updated && viewingLevel?.id === updated.id) setViewingLevel(updated);
            },
          }
        );
      },
    });
  };

  const handleDeleteMany = (ids: string[]) => {
    confirm({
      title: t('jobLevel.bulkDeleteTitle'),
      message: t('jobLevel.bulkDeleteMessage', { count: ids.length }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE_ALL(),
      onConfirm: async () => {
        deleteMutation.mutate(ids, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleStatusChangeMany = (ids: string[], status: TrangThaiHoatDong) => {
    confirm({
      title: t('jobLevel.statusChangeTitle'),
      message: `${t('jobLevel.statusChangeMessage', { count: ids.length })} ${status === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? t('jobLevel.active') : t('common.inactiveStatus')}?`,
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        statusMutation.mutate({ ids, status }, { onSuccess: () => clearSelection() });
      },
    });
  };

  const handleExport = () => {
    if (filteredLevels.length === 0) {
      toast.warning(t('jobLevel.noExportData'));
      return;
    }
    setShowExport(true);
  };

  const handleCloseForm = () => {
    const wasEditing = editingLevel;
    const origin = formOrigin;
    setShowForm(false);
    setEditingLevel(null);
    if (origin === 'detail' && viewingLevel && wasEditing && viewingLevel.id === wasEditing.id) {
      const fresh = jobLevels.find((l) => l.id === viewingLevel.id);
      if (fresh) setViewingLevel(fresh);
    }
    setFormOrigin('list');
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <JobLevelToolbar
          items={jobLevels}
          onAdd={() => setShowForm(true)}
          onExport={handleExport}
          onImport={() => toast.info(t('jobLevel.importDeveloping'))}
          onDeleteMany={handleDeleteMany}
          onStatusChangeMany={handleStatusChangeMany}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
        />

        <div className="flex-1 min-h-0">
          <JobLevelTable
            data={sortedLevels}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onView={setViewingLevel}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <JobLevelForm initialData={editingLevel} onClose={handleCloseForm} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingLevel && !showForm && (
          <JobLevelDetail
            data={viewingLevel}
            onClose={() => setViewingLevel(null)}
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
            fileName="Danh_Sach_Cap_Bac"
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobLevelPage;
