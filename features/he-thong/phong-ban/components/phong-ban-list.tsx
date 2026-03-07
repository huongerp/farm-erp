import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Folder, Building2 } from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import { Department } from '../core/types';
import { TRANG_THAI } from '../../../../lib/constants';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import HierarchyTable from '../../../../components/shared/HierarchyTable';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import { useTreeFlatten } from '../../../../lib/hooks';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';

interface Props {
  data: Department[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (item: Department) => void;
  onDelete: (id: string) => void;
  onView?: (item: Department) => void;
}

/** 1 cấp: tất cả là root, sắp xếp theo tt */
const treeOptions = {
  getId: (d: Department) => d.id,
  getParentId: (_d: Department) => null as string | null,
  getOrder: (d: Department) => d.tt,
  includeOrphans: true as const,
};

const DepartmentList: React.FC<Props> = ({
  data, columns, selectedIds, onToggleSelection, onToggleAllSelection, isLoading,
  page, pageSize, onPageChange, onPageSizeChange,
  onEdit, onDelete, onView,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const sortedTreeData = useTreeFlatten(data, treeOptions);

  const totalRecords = sortedTreeData.length;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTreeData.slice(start, start + pageSize);
  }, [sortedTreeData, page, pageSize]);

  if (isLoading) {
    return (
      <ListPageSkeleton
        loadingText={t('department.loading')}
        tableColumns={visibleColumns.length}
        tableRowCount={5}
        tableColumnWithSubline={0}
        cardCount={3}
      />
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-4">
        <EmptyState
          title={t('department.empty')}
          description={t('department.emptyHint')}
          icon={<Folder className="w-10 h-10 text-muted-foreground" />}
        />
      </div>
    );
  }

  const renderCell = (dept: Department, col: ColumnConfig) => {
    const paddingLeft = 0;
    switch (col.id) {
      case 'tt':
        return (
          <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)}>
            <span className="text-sm font-medium text-muted-foreground">{dept.tt}</span>
          </td>
        );
      case 'ten_phong_ban':
        return (
          <td key={col.id} className="px-6 py-3.5 relative" style={getColumnCellStyle(col)}>
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              <div className="mr-3 shrink-0 flex items-center justify-center w-6 h-6">
                <div className="bg-primary/15 p-1.5 rounded-lg text-primary shadow-sm border border-primary/20">
                  <Building2 size={16} />
                </div>
              </div>
              <span className="font-medium text-foreground">{dept.ten_phong_ban}</span>
            </div>
          </td>
        );
      case 'chuc_nang':
        return (
          <td key={col.id} className="px-6 py-3.5 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground line-clamp-2">{dept.chuc_nang ?? '—'}</span>
          </td>
        );
      case 'trang_thai':
        return (
          <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)}>
            {dept.trang_thai === TRANG_THAI.DANG_DUNG ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {t('department.active')}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                {t('department.inactive')}
              </span>
            )}
          </td>
        );
      case 'tg_cap_nhat':
        return (
          <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground">{dept.tg_cap_nhat ? formatDateShort(dept.tg_cap_nhat) : '—'}</span>
          </td>
        );
      default:
        return <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)} />;
    }
  };

  const renderMobileCard = (dept: Department, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(dept)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(dept)}
      className={cn(
        'bg-card rounded-xl border p-3.5 shadow-sm transition-all active:scale-[0.98]',
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <Building2 size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{dept.ten_phong_ban}</h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(dept.id)}
                className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                aria-label={t('common.select')}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {dept.trang_thai === TRANG_THAI.DANG_DUNG ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {t('department.active')}
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                {t('department.inactive')}
              </span>
            )}
          </div>
        </div>
      </div>
      {dept.chuc_nang && (
        <div className="px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
          <p className="text-muted-foreground mb-0.5">{t('department.store.chucNangCol')}</p>
          <p className="font-medium text-foreground line-clamp-2">{dept.chuc_nang}</p>
        </div>
      )}
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">{t('department.detail.order')}: {dept.tt}</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(dept); }}
            className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
            aria-label={t('common.edit')}
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(dept.id); }}
            className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-card overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
          <HierarchyTable<Department>
            data={paginatedData}
            columns={visibleColumns}
            selectedIds={selectedIds}
            getId={(d) => d.id}
            getLevel={() => 1}
            renderCell={renderCell}
            onToggleSelection={onToggleSelection}
            onToggleAllSelection={onToggleAllSelection}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
          />
        </div>

        <div className="md:hidden flex-1 min-h-0 overflow-y-auto pb-3 px-3 pt-1 custom-scrollbar">
          <div className="space-y-3">
            {paginatedData.map((dept) => (
              <div key={dept.id} className="transition-all active:scale-[0.98]">
                {renderMobileCard(dept, selectedIds.has(dept.id))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-muted/30">
        <TablePaginationFooter
          totalRecords={totalRecords}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          selectedCount={selectedIds.size}
          recordsLabel={t('department.footerRecords')}
        />
      </div>
    </div>
  );
};

export default DepartmentList;
