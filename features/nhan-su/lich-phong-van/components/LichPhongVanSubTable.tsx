import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { getTrangThaiLichPVLabel, getHinhThucLabel, HINH_THUC_BADGE_CLASS } from '../core/constants';
import type { LichPhongVan } from '../core/types';

export interface LichPhongVanSubTableProps {
  items: LichPhongVan[];
  loading?: boolean;
  addLabel?: string;
  onAdd?: () => void;
  onView?: (item: LichPhongVan) => void;
  onEdit?: (item: LichPhongVan) => void;
  onDelete?: (item: LichPhongVan) => void;
}

const TRANG_THAI_CLASS: Record<number, string> = {
  0: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  1: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  2: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  3: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
};

/** Bảng con Lịch phỏng vấn trong Detail Ứng viên – chuẩn GenericSubTableSection (Thêm, Xem, Sửa, Xóa). */
const LichPhongVanSubTable: React.FC<LichPhongVanSubTableProps> = ({
  items,
  loading = false,
  addLabel,
  onAdd,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const list = items ?? [];
  const hasItems = list.length > 0;
  const showActions = onView != null || onEdit != null || onDelete != null;

  return (
    <GenericSubTableSection
      title={t('lichPhongVan.detail.lichSection')}
      icon={<Calendar size={14} className="text-primary" />}
      count={list.length}
      addLabel={addLabel}
      onAdd={onAdd}
      emptyTitle={t('lichPhongVan.detail.lichEmpty')}
      emptyDescription={t('lichPhongVan.detail.lichEmptyHint')}
      emptyIcon={<Calendar className="w-10 h-10 text-muted-foreground" />}
      loading={loading}
      loadingText={t('common.loading')}
      maxTableHeight="320px"
    >
      {hasItems ? (
        <>
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('lichPhongVan.detail.lichColVong')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('lichPhongVan.detail.lichColNgayGio')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('lichPhongVan.detail.lichColHinhThuc')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('lichPhongVan.detail.lichColDiaDiem')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('lichPhongVan.detail.lichColTrangThai')}
              </th>
              {showActions && (
                <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center bg-muted border-l border-border min-w-[120px]">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {list.map((pv, index) => (
              <tr key={pv.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{pv.so_vong}</td>
                <td className="px-4 py-2.5 text-foreground tabular-nums">
                  {pv.ngay} – {pv.gio}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${HINH_THUC_BADGE_CLASS[pv.hinh_thuc] ?? HINH_THUC_BADGE_CLASS.offline}`}
                  >
                    {getHinhThucLabel(pv.hinh_thuc, t)}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-foreground line-clamp-1 max-w-[180px]">
                  {pv.dia_diem || '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TRANG_THAI_CLASS[pv.trang_thai] ?? TRANG_THAI_CLASS[0]}`}
                  >
                    {getTrangThaiLichPVLabel(pv.trang_thai, t)}
                  </span>
                </td>
                {showActions && (
                  <td
                    className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-0.5">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(pv)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                          title={t('common.view')}
                          aria-label={t('common.view')}
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(pv)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                          title={t('common.edit')}
                          aria-label={t('common.edit')}
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(pv)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </>
      ) : null}
    </GenericSubTableSection>
  );
};

export default LichPhongVanSubTable;
