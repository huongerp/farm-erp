import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Wallet, Eye, Edit, Trash2 } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import Tooltip from '../../../../../components/ui/Tooltip';
import { formatDate, formatNumberVN } from '../../../../../lib/utils';
import { CONFIRM_DELETE } from '../../../../../lib/button-labels';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { useModulePermission } from '../../../../he-thong/phan-quyen/hooks/use-module-permission';
import { laCapBacToanQuyen } from '../../../../he-thong/phan-quyen/core/cap-bac-toan-quyen';
import { useAuthStore } from '../../../../../store/useStore';
import { canMutateThuChiQuy } from '../../core/trang-thai';
import { useThuChiQuyByChungTu, useDeleteThuChiQuy } from '../../hooks/use-thu-chi-quy';
import { THU_CHI_QUY_MODULE_ID, useThuChiQuyViewScope } from '../../hooks/use-thu-chi-quy-view-scope';
import { getLoaiBadgeClass, loaiThuChiToI18nKey } from '../../core/constants';
import type { LoaiThuChi, ThuChiNguon, ThuChiQuy } from '../../core/types';
import ThuChiQuyForm from '../ThuChiQuyForm';
import ThuChiQuyDetail from '../ThuChiQuyDetail';

export interface ThuChiLienQuanSectionProps {
  loaiChungTu: ThuChiNguon;
  idChungTu: string | number;
  /** Số phiếu nguồn (so_po / FDX-xxxx / CPTS-xxxx) — lưu snapshot vào phiếu quỹ */
  soChungTu?: string | null;
  /** Chi nhánh suy từ chứng từ nguồn (kho nhận / nơi đề xuất / tài sản) */
  idChiNhanhMacDinh?: string | null;
  ngayMacDinh?: string | null;
  dienGiaiMacDinh?: string;
  soTienGoiY?: number | null;
  loaiMacDinh?: LoaiThuChi;
  /** Chỉ xem, ẩn mọi nút thao tác */
  readOnly?: boolean;
  className?: string;
}

/**
 * Section "Thu chi quỹ liên quan" nhúng trong drawer chi tiết của Đơn đặt hàng /
 * Đề xuất mua hàng / Chi phí tài sản. Tự nạp dữ liệu theo (loai_chung_tu, id_chung_tu)
 * từ BẢNG GỐC (không đọc view tồn quỹ — xem ghi chú ở service).
 *
 * Dùng đúng drawer form / drawer chi tiết của module quỹ (stackLevel = 1 để chồng
 * lên drawer chứng từ đang mở), không dùng dialog riêng — thao tác giống hệt khi
 * làm việc trong module Thu chi quỹ.
 *
 * Quyền lấy theo module quỹ chứ KHÔNG theo context của drawer cha.
 */
const ThuChiLienQuanSection: React.FC<ThuChiLienQuanSectionProps> = ({
  loaiChungTu,
  idChungTu,
  soChungTu,
  idChiNhanhMacDinh,
  ngayMacDinh,
  dienGiaiMacDinh,
  soTienGoiY,
  loaiMacDinh = 'chi',
  readOnly = false,
  className,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const perm = useModulePermission(THU_CHI_QUY_MODULE_ID);
  const capBac = useAuthStore((s) => s.user?.cap_bac);
  const viewScope = useThuChiQuyViewScope();
  const idStr = idChungTu != null ? String(idChungTu) : '';

  const { data: items = [], isLoading } = useThuChiQuyByChungTu(
    perm.canView ? loaiChungTu : null,
    perm.canView ? idStr : null
  );
  const deleteMutation = useDeleteThuChiQuy();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ThuChiQuy | null>(null);
  const [detailItem, setDetailItem] = useState<ThuChiQuy | null>(null);

  const tong = useMemo(() => {
    let thu = 0;
    let chi = 0;
    for (const it of items) {
      if (it.loai === 'thu') thu += it.so_tien;
      else chi += it.so_tien;
    }
    return { thu, chi };
  }, [items]);

  /** Giá trị điền sẵn khi lập phiếu quỹ từ chính chứng từ này. */
  const prefill = useMemo(
    () => ({
      loai: loaiMacDinh,
      ngay: ngayMacDinh || undefined,
      id_chi_nhanh: idChiNhanhMacDinh ? String(idChiNhanhMacDinh) : undefined,
      dien_giai: dienGiaiMacDinh || undefined,
      so_tien: soTienGoiY ?? undefined,
      loai_chung_tu: loaiChungTu,
      id_chung_tu: idStr,
      so_chung_tu: soChungTu ?? null,
    }),
    [loaiMacDinh, ngayMacDinh, idChiNhanhMacDinh, dienGiaiMacDinh, soTienGoiY, loaiChungTu, idStr, soChungTu]
  );

  if (!perm.canView) return null;

  const canCreate = !readOnly && perm.canCreate;
  const canUpdate = !readOnly && perm.canUpdate;
  const canDelete = !readOnly && perm.canDelete;
  /**
   * Bảng này nhúng trong drawer của 3 module khác nên KHÔNG đọc được
   * ModulePermissionGuard của Thu chi quỹ — phải tự tra quyền + cấp bậc, nếu
   * không phiếu đã khoá vẫn còn đường vòng để sửa/xoá từ đây.
   */
  const laCapCao = perm.canAdmin || laCapBacToanQuyen(capBac);
  const canEditRow = (item: ThuChiQuy) => canMutateThuChiQuy(item, canUpdate, laCapCao);
  const canDeleteRow = (item: ThuChiQuy) => canMutateThuChiQuy(item, canDelete, laCapCao);
  const money = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });

  const handleDelete = (item: ThuChiQuy) => {
    confirm({
      title: t('thuChiQuy.deleteTitle'),
      message: t('thuChiQuy.deleteMessage', { soPhieu: item.so_phieu }),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate([item.id], {
          onSuccess: () => {
            if (detailItem?.id === item.id) setDetailItem(null);
          },
        }),
    });
  };

  const openEdit = (item: ThuChiQuy) => {
    setEditingItem(item);
    setShowForm(true);
    if (detailItem?.id === item.id) setDetailItem(null);
  };

  return (
    <>
      <GenericSubTableSection
        title={t('thuChiQuy.lienQuan.title')}
        icon={<Wallet size={14} className="text-primary" />}
        count={items.length}
        addLabel={canCreate ? t('thuChiQuy.lienQuan.add') : undefined}
        onAdd={
          canCreate
            ? () => {
                setEditingItem(null);
                setShowForm(true);
              }
            : undefined
        }
        emptyTitle={t('thuChiQuy.lienQuan.emptyTitle')}
        emptyDescription={t('thuChiQuy.lienQuan.emptyHint')}
        emptyIcon={<Wallet className="w-10 h-10 text-muted-foreground" />}
        loading={isLoading}
        loadingText={t('common.loading')}
        maxTableHeight="280px"
        className={className}
      >
        {items.length > 0 ? (
          <>
            <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('thuChiQuy.store.ngayCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('thuChiQuy.store.soPhieuCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('thuChiQuy.store.loaiCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('thuChiQuy.store.hangMucCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                  {t('thuChiQuy.form.soTien')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs text-left">
                  {t('thuChiQuy.store.dienGiaiCol')}
                </th>
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
                  <td className="px-4 py-2 text-xs tabular-nums whitespace-nowrap">{formatDate(item.ngay)}</td>
                  <td className="px-4 py-2 text-xs font-mono whitespace-nowrap">{item.so_phieu}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getLoaiBadgeClass(item.loai)}`}
                    >
                      {t(loaiThuChiToI18nKey(item.loai))}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">{item.ten_hang_muc || '—'}</td>
                  <td
                    className={`px-4 py-2 text-xs font-semibold tabular-nums text-right whitespace-nowrap ${item.loai === 'thu' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                  >
                    {money(item.so_tien)}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    <span className="line-clamp-2">{item.dien_giai}</span>
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
              <tr className="bg-muted/40 font-semibold">
                <td className="px-4 py-2 text-xs" colSpan={4}>
                  {t('thuChiQuy.lienQuan.total')}
                </td>
                <td className="px-4 py-2 text-xs text-right tabular-nums whitespace-nowrap">
                  <span className="text-emerald-600 dark:text-emerald-400">{money(tong.thu)}</span>
                  {' / '}
                  <span className="text-rose-600 dark:text-rose-400">{money(tong.chi)}</span>
                </td>
                <td className="px-4 py-2" colSpan={2} />
              </tr>
            </tbody>
          </>
        ) : null}
      </GenericSubTableSection>

      <AnimatePresence>
        {showForm && (
          <ThuChiQuyForm
            initialData={editingItem}
            prefill={editingItem ? undefined : prefill}
            stackLevel={1}
            defaultChiNhanhId={idChiNhanhMacDinh ? String(idChiNhanhMacDinh) : ''}
            allowedBranchIds={viewScope.viewAll ? [] : viewScope.allowedBranchIds}
            onClose={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && (
          <ThuChiQuyDetail
            data={detailItem}
            stackLevel={1}
            onClose={() => setDetailItem(null)}
            onEdit={canEditRow(detailItem) ? openEdit : undefined}
            onDelete={canDeleteRow(detailItem) ? handleDelete : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ThuChiLienQuanSection;
