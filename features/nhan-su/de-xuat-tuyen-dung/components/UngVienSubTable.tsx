import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Eye, Edit, Trash2 } from 'lucide-react';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import type { UngVien } from '@/features/nhan-su/ung-vien/core/types';

export interface UngVienSubTableProps {
  items: UngVien[];
  loading?: boolean;
  addLabel?: string;
  onAdd?: () => void;
  onView?: (item: UngVien) => void;
  onEdit?: (item: UngVien) => void;
  onDelete?: (item: UngVien) => void;
}

/** Bảng con Ứng viên trong Detail đề xuất tuyển dụng – chuẩn GenericSubTableSection (Thêm, Sửa, Xóa). */
const UngVienSubTable: React.FC<UngVienSubTableProps> = ({
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
      title={t('deXuatTuyenDung.detail.ungVienSection')}
      icon={<UserPlus size={14} className="text-primary" />}
      count={list.length}
      addLabel={addLabel}
      onAdd={onAdd}
      emptyTitle={t('deXuatTuyenDung.detail.ungVienEmpty')}
      emptyDescription={t('deXuatTuyenDung.detail.ungVienEmptyHint')}
      emptyIcon={<UserPlus className="w-10 h-10 text-muted-foreground" />}
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
                {t('deXuatTuyenDung.detail.ungVienColHoTen')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('deXuatTuyenDung.detail.ungVienColEmail')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('deXuatTuyenDung.detail.ungVienColTrangThai')}
              </th>
              {showActions && (
                <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center bg-muted border-l border-border min-w-[120px]">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {list.map((uv, index) => (
              <tr key={uv.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                <td className="px-4 py-2.5 font-medium text-foreground">{uv.ho_ten || '—'}</td>
                <td className="px-4 py-2.5 text-foreground">{uv.email || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/80 text-foreground border border-border">
                    {uv.ten_trang_thai || '—'}
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
                          onClick={() => onView(uv)}
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
                          onClick={() => onEdit(uv)}
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
                          onClick={() => onDelete(uv)}
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

export default UngVienSubTable;
