import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Eye, Edit, Trash2 } from 'lucide-react';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import type { PhieuKho, LoaiPhieuKho } from '../../phieu-kho/core/types';
import { getTrangThaiPhieuBadgeClass, trangThaiToI18nKey } from '../../phieu-kho/core/constants';
import { cn, formatDateShort } from '../../../../lib/utils';

export interface PhieuKhoLienQuanSubTableProps {
  items: PhieuKho[];
  loading?: boolean;
  addLabel?: string;
  onAdd?: () => void;
  onView?: (item: PhieuKho) => void;
  onEdit?: (item: PhieuKho) => void;
  onDelete?: (id: string) => void;
}

const getLoaiLabel = (loai: LoaiPhieuKho, t: (k: string) => string) => {
  if (loai === 'nhập') return t('phieuKho.tabs.nhap');
  if (loai === 'xuất') return t('phieuKho.tabs.xuat');
  return t('phieuKho.tabs.chuyen');
};

const getStatusLabel = (trang_thai: PhieuKho['trang_thai'], t: (k: string) => string) =>
  t(`phieuKho.status.${trangThaiToI18nKey(trang_thai)}`);

const PhieuKhoLienQuanSubTable: React.FC<PhieuKhoLienQuanSubTableProps> = ({
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
      title={t('doiTac.detail.phieuKhoSection')}
      icon={<Package size={14} className="text-primary" />}
      count={list.length}
      addLabel={addLabel}
      onAdd={onAdd}
      emptyTitle={t('doiTac.detail.phieuKhoEmpty')}
      emptyDescription={t('doiTac.detail.phieuKhoEmptyHint')}
      emptyIcon={<Package className="w-10 h-10 text-muted-foreground" />}
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
                {t('phieuKho.store.soPhieuCol')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('phieuKho.form.date')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('phieuKho.chiTietTab.loaiPhieuCol')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('phieuKho.store.khoCol')}
              </th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                {t('phieuKho.store.statusCol')}
              </th>
              {showActions && (
                <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center bg-muted border-l border-border min-w-[120px]">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {list.map((pk, index) => (
              <tr key={pk.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                <td className="px-4 py-2.5 font-mono text-sm text-foreground">{pk.so_phieu}</td>
                <td className="px-4 py-2.5 text-foreground">{formatDateShort(pk.ngay)}</td>
                <td className="px-4 py-2.5 text-foreground">{getLoaiLabel(pk.loai, t)}</td>
                <td className="px-4 py-2.5 text-foreground">{pk.ten_kho ?? pk.kho_id}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border',
                      getTrangThaiPhieuBadgeClass(pk.trang_thai),
                    )}
                  >
                    {getStatusLabel(pk.trang_thai, t)}
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
                          onClick={() => onView(pk)}
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
                          onClick={() => onEdit(pk)}
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
                          onClick={() => onDelete(pk.id)}
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

export default PhieuKhoLienQuanSubTable;
