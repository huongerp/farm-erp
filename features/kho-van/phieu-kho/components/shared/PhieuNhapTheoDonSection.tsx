import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { PackagePlus, Eye, Edit, Trash2 } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import Tooltip from '../../../../../components/ui/Tooltip';
import { cn, formatDate, formatNumberVN } from '../../../../../lib/utils';
import { CONFIRM_DELETE } from '../../../../../lib/button-labels';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { useModulePermission } from '../../../../he-thong/phan-quyen/hooks/use-module-permission';
import { useKhoList } from '../../../danh-sach-kho/hooks/use-kho';
import { usePhieuKhoByDonDatHang, usePhieuKhoById, useDeletePhieuKho } from '../../hooks/use-phieu-kho';
import { PHIEU_KHO_MODULE_ID } from '../../hooks/use-phieu-kho-view-scope';
import {
  canMutatePhieuKhoByTrangThai,
  getTrangThaiPhieuBadgeClass,
  trangThaiToI18nKey,
} from '../../core/constants';
import { tinhTienDoNhapDon } from '../../core/tien-do-nhap-don';
import type { PhieuKho } from '../../core/types';
import PhieuKhoForm from '../PhieuKhoForm';
import PhieuKhoDetail from '../PhieuKhoDetail';

export interface PhieuNhapTheoDonSectionProps {
  idDonDatHang: string | number;
  /** Dòng hàng của đơn — để tính tổng đặt ở dòng tổng. */
  chiTietDon?: ReadonlyArray<{ so_luong: number | null | undefined }>;
  /** Mở form tạo phiếu nhập từ đơn (luồng sẵn có của module đơn). */
  onAdd?: () => void;
  /** Tầng drawer cho drawer phiếu mở từ section (drawer đơn đang ở tầng stackLevel - 1). */
  stackLevel?: number;
  className?: string;
}

/**
 * Section "Phiếu nhập kho" trong drawer chi tiết Đơn đặt hàng: các phiếu nhập có
 * `id_don_dat_hang` = đơn này + dòng tổng "đã nhập / đặt".
 *
 * Quyền lấy theo module Phiếu kho chứ KHÔNG theo context drawer cha (cùng lý do
 * với ThuChiLienQuanSection): người xem được đơn chưa chắc xem/sửa được phiếu kho.
 */
const PhieuNhapTheoDonSection: React.FC<PhieuNhapTheoDonSectionProps> = ({
  idDonDatHang,
  chiTietDon,
  onAdd,
  stackLevel = 1,
  className,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const perm = useModulePermission(PHIEU_KHO_MODULE_ID);
  const idStr = idDonDatHang != null ? String(idDonDatHang) : '';

  const { data: items = [], isLoading } = usePhieuKhoByDonDatHang(perm.canView && idStr ? idStr : null);
  const deleteMutation = useDeletePhieuKho();

  const [detailItem, setDetailItem] = useState<PhieuKho | null>(null);
  const [editingItem, setEditingItem] = useState<PhieuKho | null>(null);
  /** Bản đầy đủ (có chi_tiet) — danh sách chỉ đọc view summary. */
  const { data: detailFull } = usePhieuKhoById(detailItem?.id);
  const { data: editingFull } = usePhieuKhoById(editingItem?.id);
  const { data: khoListData } = useKhoList();
  const khoList = useMemo(() => khoListData ?? [], [khoListData]);

  const tienDo = useMemo(() => tinhTienDoNhapDon(items, chiTietDon), [items, chiTietDon]);

  if (!perm.canView) return null;

  const canEditRow = (item: PhieuKho) =>
    canMutatePhieuKhoByTrangThai(item.trang_thai, perm.canUpdate, perm.canApprove);
  const canDeleteRow = (item: PhieuKho) =>
    canMutatePhieuKhoByTrangThai(item.trang_thai, perm.canDelete, perm.canApprove);
  const qty = (v: number) => formatNumberVN(v, { maxFractionDigits: 3 });

  const handleDelete = (item: PhieuKho) => {
    confirm({
      title: t('phieuKho.deleteTitle'),
      message: t('phieuKho.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate(item.id, {
          onSuccess: () => {
            if (detailItem?.id === item.id) setDetailItem(null);
          },
        }),
    });
  };

  const openEdit = (item: PhieuKho) => {
    setEditingItem(item);
    setDetailItem(null);
  };

  const canAdd = !!onAdd && perm.canCreate;
  const thCls = 'px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap';

  return (
    <>
      <GenericSubTableSection
        title={t('phieuKho.lienQuanDon.title')}
        icon={<PackagePlus size={14} className="text-primary" />}
        count={items.length}
        addLabel={canAdd ? t('phieuKho.lienQuanDon.add') : undefined}
        onAdd={canAdd ? onAdd : undefined}
        emptyTitle={t('phieuKho.lienQuanDon.emptyTitle')}
        emptyDescription={t('phieuKho.lienQuanDon.emptyHint')}
        emptyIcon={<PackagePlus className="w-10 h-10 text-muted-foreground" />}
        loading={isLoading}
        loadingText={t('common.loading')}
        maxTableHeight="280px"
        className={className}
      >
        {items.length > 0 ? (
          <>
            <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
              <tr>
                <th className={cn(thCls, 'text-left')}>{t('phieuKho.store.soPhieuCol')}</th>
                <th className={cn(thCls, 'text-left')}>{t('phieuKho.store.ngayCol')}</th>
                <th className={cn(thCls, 'text-left')}>{t('phieuKho.store.khoCol')}</th>
                <th className={cn(thCls, 'text-left')}>{t('phieuKho.store.statusCol')}</th>
                <th className={cn(thCls, 'text-right')}>{t('phieuKho.list.totalQuantity')}</th>
                <th className="sticky right-0 z-[2] bg-muted px-2 py-2 w-[104px] border-l border-border" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailItem(item);
                    }
                  }}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-2 text-xs font-mono whitespace-nowrap">{item.so_phieu}</td>
                  <td className="px-4 py-2 text-xs tabular-nums whitespace-nowrap">{formatDate(item.ngay)}</td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">{item.ten_kho || '—'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        getTrangThaiPhieuBadgeClass(item.trang_thai),
                      )}
                    >
                      {t(`phieuKho.status.${trangThaiToI18nKey(item.trang_thai)}`)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs font-semibold tabular-nums text-right whitespace-nowrap">
                    {qty(Number(item.tong_so_luong) || 0)}
                  </td>
                  <td className="sticky right-0 z-[1] bg-card px-2 py-2 border-l border-border">
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content={t('common.view')} placement="left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailItem(item);
                          }}
                          className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg"
                          aria-label={t('common.view')}
                        >
                          <Eye size={14} />
                        </button>
                      </Tooltip>
                      {canEditRow(item) && (
                        <Tooltip content={t('common.edit')} placement="left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(item);
                            }}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg"
                            aria-label={t('common.edit')}
                          >
                            <Edit size={14} />
                          </button>
                        </Tooltip>
                      )}
                      {canDeleteRow(item) && (
                        <Tooltip content={t('common.delete')} placement="left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                            aria-label={t('common.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/40 font-semibold" title={t('phieuKho.lienQuanDon.totalHint')}>
                <td className="px-4 py-2 text-xs" colSpan={4}>
                  {t('phieuKho.lienQuanDon.total')}
                </td>
                <td
                  className={cn(
                    'px-4 py-2 text-xs text-right tabular-nums whitespace-nowrap',
                    tienDo.dat > 0 && tienDo.daNhap >= tienDo.dat
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400',
                  )}
                >
                  {qty(tienDo.daNhap)} / {qty(tienDo.dat)}
                </td>
                <td className="px-4 py-2" />
              </tr>
            </tbody>
          </>
        ) : null}
      </GenericSubTableSection>

      <AnimatePresence>
        {editingItem && (
          <PhieuKhoForm
            loai="nhap"
            khoList={khoList}
            initialData={editingFull ?? editingItem}
            stackLevel={stackLevel}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && (
          <PhieuKhoDetail
            data={detailFull ?? detailItem}
            loai="nhap"
            stackLevel={stackLevel}
            onClose={() => setDetailItem(null)}
            onEdit={canEditRow(detailItem) ? openEdit : undefined}
            onDelete={
              canDeleteRow(detailItem)
                ? (id) => {
                    const item = items.find((p) => p.id === id) ?? detailItem;
                    handleDelete(item);
                  }
                : undefined
            }
            canApprove={perm.canApprove}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PhieuNhapTheoDonSection;
