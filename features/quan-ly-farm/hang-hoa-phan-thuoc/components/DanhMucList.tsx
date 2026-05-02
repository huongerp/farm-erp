import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Folder,
  CornerDownRight,
  List,
  FolderPlus,
} from 'lucide-react';
import { cn, formatDateShort } from '../../../../lib/utils';
import type { FarmDanhMuc } from '../core/types';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';
import { useTreeFlatten } from '../../../../lib/hooks';
import { getNameStyleDefault } from '../../../../lib/tree-utils';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import Tooltip from '../../../../components/ui/Tooltip';

interface Props {
  data: FarmDanhMuc[];
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit?: (item: FarmDanhMuc) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parent: FarmDanhMuc) => void;
  onView?: (item: FarmDanhMuc) => void;
}

const treeOptions = {
  getId: (d: FarmDanhMuc) => d.id,
  getParentId: (d: FarmDanhMuc) => d.id_cha,
  getOrder: (d: FarmDanhMuc) => d.thu_tu,
  includeOrphans: true as const,
};

function getLevel(item: FarmDanhMuc): number {
  return item.id_cha ? 2 : 1;
}

const DanhMucList: React.FC<Props> = ({
  data,
  columns,
  selectedIds,
  onToggleSelection,
  onToggleAllSelection,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onAddChild,
  onView,
}) => {
  const { t } = useTranslation();

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const sortedTreeData = useTreeFlatten(data, treeOptions);

  const parentNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    data.forEach((d) => {
      m[d.id] = d.ten_danh_muc;
    });
    return m;
  }, [data]);

  const totalRecords = sortedTreeData.length;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedTreeData.slice(start, start + pageSize);
  }, [sortedTreeData, page, pageSize]);

  if (isLoading) {
    return (
      <ListPageSkeleton
        loadingText={t('farmHangHoaPhanThuoc.danhMuc.loading')}
        tableColumns={visibleColumns.length + 1}
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
          title={t('farmHangHoaPhanThuoc.danhMuc.empty')}
          description={t('farmHangHoaPhanThuoc.danhMuc.emptyHint')}
          icon={<Folder className="w-10 h-10 text-muted-foreground" />}
        />
      </div>
    );
  }

  const renderCell = (item: FarmDanhMuc, col: ColumnConfig) => {
    const level = getLevel(item);
    const isRoot = level === 1;
    const paddingLeft = (level - 1) * 32;
    switch (col.id) {
      case 'thu_tu':
        return (
          <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)}>
            <span className="text-sm font-medium text-muted-foreground">{item.thu_tu}</span>
          </td>
        );
      case 'ten_danh_muc':
        return (
          <td key={col.id} className="px-6 py-3.5 relative" style={getColumnCellStyle(col)}>
            {isRoot && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            <div className="flex items-center" style={{ paddingLeft: `${paddingLeft}px` }}>
              <div className="mr-3 shrink-0 flex items-center justify-center w-6 h-6">
                {isRoot ? (
                  <div className="bg-primary/15 p-1.5 rounded-lg text-primary shadow-sm border border-primary/20">
                    <List size={16} />
                  </div>
                ) : (
                  <div className="relative h-full w-full flex items-center justify-center">
                    <div className="absolute -left-[18px] top-1/2 w-[18px] h-px bg-border" />
                    <CornerDownRight size={14} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={`${getNameStyleDefault(level)} group-hover:text-primary transition-colors`}
                >
                  {item.ten_danh_muc}
                </span>
                <div className="md:hidden text-xs text-muted-foreground mt-0.5 font-mono">
                  {item.ma_danh_muc}
                </div>
              </div>
            </div>
          </td>
        );
      case 'ma_danh_muc':
        return (
          <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)}>
            <span className="font-mono text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
              {item.ma_danh_muc}
            </span>
          </td>
        );
      case 'ten_cha':
        return (
          <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)}>
            <span
              className="text-sm text-muted-foreground truncate block"
              title={parentNameMap[item.id_cha ?? ''] ?? '—'}
            >
              {item.id_cha ? parentNameMap[item.id_cha] ?? '—' : '—'}
            </span>
          </td>
        );
      case 'mo_ta':
        return (
          <td key={col.id} className="px-6 py-3.5 min-w-0" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground line-clamp-2">{item.mo_ta ?? '—'}</span>
          </td>
        );
      case 'tg_cap_nhat':
        return (
          <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)}>
            <span className="text-xs text-muted-foreground">
              {formatDateShort(item.tg_cap_nhat)}
            </span>
          </td>
        );
      default:
        return <td key={col.id} className="px-6 py-3.5" style={getColumnCellStyle(col)} />;
    }
  };

  const currentPageIds = paginatedData.map((d) => d.id);
  const isAllSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
  const isIndeterminate =
    currentPageIds.some((id) => selectedIds.has(id)) && !isAllSelected;
  const actionsLabel = t('common.actions');

  return (
    <div className="flex flex-col h-full min-h-0 bg-card overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
          <div
            className="flex-1 min-h-0 overflow-auto custom-scrollbar"
            style={{ overscrollBehavior: 'contain' }}
          >
            <table className="w-full text-sm text-left border-separate border-spacing-0 min-w-max">
              <thead className="sticky top-0 z-[2]">
                <tr className="bg-muted border-b border-border">
                  <th
                    className="sticky left-0 z-[3] w-11 px-3 py-2 border-b border-r border-border text-center bg-[hsl(var(--muted))]"
                    style={{ minWidth: 44, maxWidth: 44 }}
                  >
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => el && (el.indeterminate = isIndeterminate)}
                      onChange={() => onToggleAllSelection(currentPageIds)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-border text-primary accent-primary"
                      aria-label={t('common.selectAll')}
                    />
                  </th>
                  {visibleColumns.map((col) => (
                    <th
                      key={col.id}
                      className="px-4 py-2 font-semibold text-foreground/80 border-b border-border text-xs whitespace-nowrap min-w-0"
                      style={getColumnCellStyle(col)}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="sticky right-0 z-[3] min-w-[120px] px-3 py-2 border-b border-l border-border text-center font-semibold text-foreground/80 text-xs shadow-[inset 8px 0 8px -8px rgba(0,0,0,0.12)] bg-[hsl(var(--muted))]">
                    {actionsLabel}
                  </th>
                </tr>
              </thead>
              <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                {paginatedData.map((item) => {
                  const id = item.id;
                  const level = getLevel(item);
                  const isRoot = level === 1;
                  const isParent = !item.id_cha;
                  const isSelected = selectedIds.has(id);
                  return (
                    <tr
                      key={id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onView?.(item)}
                      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
                      className={cn(
                        'group transition-all hover:bg-muted/80 cursor-pointer',
                        isRoot ? 'bg-muted/40' : 'bg-card',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      <td
                        className={cn(
                          'sticky left-0 z-[1] w-11 px-3 py-3.5 text-center border-r border-border transition-colors group-hover:bg-[hsl(var(--muted))]',
                          isSelected && '!bg-[hsl(var(--primary)/0.12)]',
                          isRoot && !isSelected && 'bg-[hsl(var(--muted))]',
                          !isRoot && !isSelected && 'bg-[hsl(var(--card))]'
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelection(id)}
                          className="w-4 h-4 rounded border-border text-primary accent-primary"
                          aria-label={t('common.select')}
                        />
                      </td>
                      {visibleColumns.map((col) => renderCell(item, col))}
                      <td
                        className={cn(
                          'sticky right-0 z-[1] min-w-[120px] px-2 py-3.5 border-l border-border/50 text-center transition-colors shadow-[inset 8px 0 8px -8px rgba(0,0,0,0.08)] group-hover:bg-[hsl(var(--muted))]',
                          isSelected && '!bg-[hsl(var(--primary)/0.12)]',
                          isRoot && !isSelected && 'bg-[hsl(var(--muted))]',
                          !isRoot && !isSelected && 'bg-[hsl(var(--card))]'
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-0 flex-nowrap">
                          {isParent && onAddChild && (
                            <Tooltip content={t('farmHangHoaPhanThuoc.danhMuc.detail.addChild')} placement="top">
                              <button
                                type="button"
                                onClick={() => onAddChild(item)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-md transition-all active:scale-95 shrink-0"
                              >
                                <FolderPlus size={15} />
                              </button>
                            </Tooltip>
                          )}
                          {onEdit && (
                            <Tooltip content={t('common.edit')} placement="top">
                              <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all active:scale-95 shrink-0"
                              >
                                <Edit size={15} />
                              </button>
                            </Tooltip>
                          )}
                          {onDelete && (
                            <Tooltip content={t('common.delete')} placement="top">
                              <button
                                type="button"
                                onClick={() => onDelete(id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all active:scale-95 shrink-0"
                              >
                                <Trash2 size={15} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden flex-1 min-h-0 overflow-y-auto pb-3 px-3 pt-1 custom-scrollbar">
          <div className="space-y-3">
            {paginatedData.map((item) => {
              const isParent = !item.id_cha;
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-xl border border-border p-3.5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <List size={22} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground text-sm truncate">
                        {item.ten_danh_muc}
                      </h4>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">
                        {item.ma_danh_muc}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => onToggleSelection(item.id)}
                      className="w-4 h-4 rounded border-border text-primary accent-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 items-center justify-center">
                    {isParent && onAddChild && (
                      <button
                        type="button"
                        onClick={() => onAddChild(item)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs inline-flex items-center gap-1"
                      >
                        <FolderPlus size={14} />
                        {t('farmHangHoaPhanThuoc.danhMuc.detail.addChild')}
                      </button>
                    )}
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
          recordsLabel={t('farmHangHoaPhanThuoc.danhMuc.footerRecords')}
        />
      </div>
    </div>
  );
};

export default DanhMucList;
