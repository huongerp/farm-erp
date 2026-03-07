import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Settings } from 'lucide-react';
import type { LoaiChienLuoc, NhomLoaiChienLuoc } from '../core/types';
import { NHOM_LOAI_CHIEN_LUOC_LABEL_KEYS } from '../core/constants';
import { useThietLapChienLuocStore } from '../store/useThietLapChienLuocStore';
import { getColumnCellStyle } from '../../../../store/createGenericStore';
import EmptyState from '../../../../components/shared/EmptyState';
import ListPageSkeleton from '../../../../components/shared/ListPageSkeleton';
import TablePaginationFooter from '../../../../components/shared/TablePaginationFooter';

interface Props {
  data: LoaiChienLuoc[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (item: LoaiChienLuoc) => void;
  onDelete: (id: string) => void;
}

const ThietLapLoaiChienLuocList: React.FC<Props> = ({
  data,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { columns } = useThietLapChienLuocStore();

  const visibleColumns = useMemo(
    () => [...columns].filter((c) => c.visible).sort((a, b) => a.order - b.order),
    [columns]
  );

  const totalRecords = data.length;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const isEmpty = data.length === 0;

  if (isLoading) {
    return (
      <ListPageSkeleton
        loadingText={t('chienLuoc.thietLap.searchPlaceholder')}
        tableColumns={visibleColumns.length + 1}
        tableRowCount={5}
        tableColumnWithSubline={0}
        cardCount={0}
      />
    );
  }

  const renderCellContent = (col: typeof visibleColumns[number], item: LoaiChienLuoc) => {
    switch (col.id) {
      case 'thu_tu':
        return <span className="text-foreground">{item.thu_tu}</span>;
      case 'nhom':
        return (
          <span className="text-foreground">
            {t(NHOM_LOAI_CHIEN_LUOC_LABEL_KEYS[item.nhom as NhomLoaiChienLuoc])}
          </span>
        );
      case 'ma':
        return <span className="font-mono text-xs text-muted-foreground">{item.ma}</span>;
      case 'ten':
        return <span className="font-medium text-foreground">{item.ten}</span>;
      case 'mo_ta':
        return (
          <span className="text-muted-foreground line-clamp-2">{item.mo_ta || '—'}</span>
        );
      case 'cau_chien_luoc_mau':
        return (
          <span className="text-muted-foreground line-clamp-2">
            {item.cau_chien_luoc_mau || '—'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-card overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
              <tr>
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    className="px-4 py-3 font-semibold text-muted-foreground text-xs whitespace-nowrap"
                    style={getColumnCellStyle(col)}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs text-right w-24">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
              {isEmpty ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="px-4 py-12 text-center">
                    <EmptyState
                      title={t('chienLuoc.thietLap.empty')}
                      description={t('chienLuoc.thietLap.emptyHint')}
                      icon={<Settings className="w-10 h-10 text-muted-foreground mx-auto" />}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-muted/50 transition-colors"
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        className="px-4 py-3 text-sm"
                        style={getColumnCellStyle(col)}
                      >
                        {renderCellContent(col, item)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                          title={t('common.edit')}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                          title={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="shrink-0 border-t border-border bg-muted/30">
        <TablePaginationFooter
          totalRecords={totalRecords}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          recordsLabel={t('chienLuoc.thietLap.footerRecords')}
        />
      </div>
    </div>
  );
};

export default ThietLapLoaiChienLuocList;
