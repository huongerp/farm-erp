import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useKeHoachChiPhiList, useDeleteKeHoachChiPhi } from '../hooks/use-ke-hoach-chi-phi';
import { useKeHoachChiPhiStore } from '../store/useKeHoachChiPhiStore';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import KeHoachChiPhiPlanFlatTable from './KeHoachChiPhiPlanFlatTable';
import KeHoachChiPhiDetail from './KeHoachChiPhiDetail';
import type { KeHoachChiPhi } from '../core/types';

interface KeHoachChiPhiPlanTabProps {
  onAddClick: () => void;
  onEditRow: (row: KeHoachChiPhi) => void;
}

const KeHoachChiPhiPlanTab: React.FC<KeHoachChiPhiPlanTabProps> = ({
  onAddClick,
  onEditRow,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: list = [], isLoading } = useKeHoachChiPhiList();
  const deleteMutation = useDeleteKeHoachChiPhi();
  const {
    filters,
    searchTerm,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    pagination,
    setPage,
    setPageSize,
    columns,
  } = useKeHoachChiPhiStore();
  const [viewingRow, setViewingRow] = React.useState<KeHoachChiPhi | null>(null);

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const filteredList = useMemo(() => {
    let result = list.filter((r) => r.nam === filters.nam);
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(
        (r) =>
          (r.ten_danh_muc && r.ten_danh_muc.toLowerCase().includes(q)) ||
          (r.mo_ta && r.mo_ta.toLowerCase().includes(q)) ||
          (r.ten_phong_ban && r.ten_phong_ban.toLowerCase().includes(q))
      );
    }
    return result;
  }, [list, filters.nam, searchTerm]);

  const filteredIds = useMemo(() => filteredList.map((r) => r.id), [filteredList]);

  const paginatedList = useMemo(() => {
    const { page, pageSize } = pagination;
    const start = (page - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, pagination.page, pagination.pageSize]);

  const handleDelete = (id: string) => {
    confirm({
      title: t('keHoachChiPhi.deleteTitle'),
      message: t('keHoachChiPhi.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (viewingRow?.id === id) setViewingRow(null);
          },
        });
      },
    });
  };

  const handleToggleAll = (checked: boolean) => {
    if (checked && filteredIds.length > 0) {
      toggleAllSelection(filteredIds);
    } else {
      clearSelection();
    }
  };

  return (
    <>
      <div className="flex flex-col h-full min-h-0 bg-card overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <KeHoachChiPhiPlanFlatTable
            rows={paginatedList}
            visibleColumns={visibleColumns}
            isLoading={isLoading}
            emptyMessage={t('keHoachChiPhi.noPlanForYear')}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAll={handleToggleAll}
            onView={setViewingRow}
            onEdit={(row) => {
              setViewingRow(null);
              onEditRow(row);
            }}
            onDelete={handleDelete}
          />
        </div>
        <div className="shrink-0 border-t border-border bg-muted/30">
          <TablePaginationFooter
            totalRecords={filteredList.length}
            page={pagination.page}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            selectedCount={selectedIds.size}
            recordsLabel={t('keHoachChiPhi.footerRecords')}
          />
        </div>
      </div>

      <AnimatePresence>
        {viewingRow && (
          <KeHoachChiPhiDetail
            data={viewingRow}
            onClose={() => setViewingRow(null)}
            onEdit={(row) => {
              setViewingRow(null);
              onEditRow(row);
            }}
            onDelete={(id) => {
              setViewingRow(null);
              handleDelete(id);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default KeHoachChiPhiPlanTab;
