import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Warehouse, Eye, Edit, Trash2 } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import Tooltip from '../../../../../components/ui/Tooltip';
import { formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import { CONFIRM_DELETE } from '../../../../../lib/button-labels';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../../store/useStore';
import { useModulePermission } from '../../../../he-thong/phan-quyen/hooks/use-module-permission';
import { useKhoList } from '../../../../kho-van/danh-sach-kho/hooks/use-kho';
import { useKhoBienThe } from '../../../kho-bien-the/KhoBienTheProvider';
import { khoModuleId } from '../../../kho-bien-the/bien-the';
import { useDeletePhieuKhoPT, usePhieuKhoPTByDeXuat, usePhieuKhoPTById } from '../../hooks/use-phieu-kho-pt';
import { usePhieuKhoPTCapCao } from '../../hooks/use-phieu-kho-pt-cap-cao';
import { usePhieuKhoPTViewScope } from '../../hooks/use-phieu-kho-pt-view-scope';
import { buildPhieuKhoPTPhamVi } from '../../services/phieu-kho-pt-list-query';
import { phieuMoChoSuaXoa } from '../../core/quyen-sua-phieu';
import type { PhieuKhoPT } from '../../core/types';
import PhieuKhoPTDetail from '../PhieuKhoPTDetail';
import PhieuKhoPTForm from '../PhieuKhoPTForm';
import { LoaiPhieuKhoPTBadge, TrangThaiPhieuKhoPTBadge } from './PhieuKhoPTBadges';

export interface PhieuKhoTheoDeXuatSectionProps {
  idDeXuat: string;
  /** Tầng drawer cho chi tiết/form phiếu kho mở từ section (mặc định 1 = chồng lên drawer Đề xuất). */
  stackLevel?: number;
  className?: string;
}

/**
 * Section "Phiếu kho liên quan" trong drawer chi tiết Đề xuất mua hàng (Sơ chế / Phân thuốc theo
 * biến thể). Bấm dòng mở drawer chi tiết phiếu kho chồng lên; sửa / xoá / duyệt theo quyền module
 * PHIẾU KHO của biến thể, KHÔNG theo context của drawer Đề xuất, và theo luật khoá phiếu đã duyệt
 * (core/quyen-sua-phieu.ts) như trong module phiếu kho.
 */
const PhieuKhoTheoDeXuatSection: React.FC<PhieuKhoTheoDeXuatSectionProps> = ({ idDeXuat, stackLevel = 1, className }) => {
  const { t } = useTranslation();
  const bt = useKhoBienThe();
  const confirm = useConfirmStore((s) => s.confirm);
  const perm = useModulePermission(khoModuleId(bt, 'phieu-kho-phan-thuoc'));
  const capCao = usePhieuKhoPTCapCao();
  const userId = useAuthStore((s) => s.user?.id);
  const nhanVienIdRaw = userId != null ? Number(userId) : NaN;
  const nhanVienId = Number.isNaN(nhanVienIdRaw) ? null : nhanVienIdRaw;

  const { data: items = [], isLoading } = usePhieuKhoPTByDeXuat(perm.canView && idDeXuat ? [idDeXuat] : []);
  const deleteMutation = useDeletePhieuKhoPT();

  const [detailItem, setDetailItem] = useState<PhieuKhoPT | null>(null);
  const [editingItem, setEditingItem] = useState<PhieuKhoPT | null>(null);
  // Bản đầy đủ (kèm dòng hàng) cho drawer chi tiết / form sửa; dòng trong bảng chỉ là bản tóm tắt.
  const { data: detailFull } = usePhieuKhoPTById(detailItem?.id);
  const { data: editingFull } = usePhieuKhoPTById(editingItem?.id);

  // Kho chọn được trong form sửa: lọc theo phạm vi xem của module phiếu kho (giống DanhSachTab).
  const { data: khoListAll = [] } = useKhoList();
  const viewScope = usePhieuKhoPTViewScope();
  const khoList = useMemo(() => {
    const phamVi = buildPhieuKhoPTPhamVi(viewScope, khoListAll);
    if (phamVi.viewAll) return khoListAll;
    const allowed = new Set(phamVi.allowedKhoIds.map(String));
    return khoListAll.filter((k) => allowed.has(String(k.id)));
  }, [viewScope, khoListAll]);

  if (!perm.canView) return null;

  const moChoSuaXoa = (item: PhieuKhoPT) => phieuMoChoSuaXoa(item, { capCao, nhanVienId });
  const canEditRow = (item: PhieuKhoPT) => perm.canUpdate && moChoSuaXoa(item);
  const canDeleteRow = (item: PhieuKhoPT) => perm.canDelete && moChoSuaXoa(item);

  const handleDelete = (id: string) => {
    confirm({
      title: t('phieuKhoPhanThuoc.deleteTitle'),
      message: t('phieuKhoPhanThuoc.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () =>
        deleteMutation.mutate(id, {
          onSuccess: () => {
            if (detailItem?.id === id) setDetailItem(null);
          },
        }),
    });
  };

  const openEdit = (item: PhieuKhoPT) => {
    setDetailItem(null);
    setEditingItem(item);
  };

  const tenKho = (item: PhieuKhoPT) =>
    item.loai === 'chuyển' && item.ten_kho_den ? `${item.ten_kho ?? '—'} → ${item.ten_kho_den}` : (item.ten_kho ?? '—');

  return (
    <>
      <GenericSubTableSection
        title={t('phieuKhoPhanThuoc.theoDeXuat.title')}
        icon={<Warehouse size={14} className="text-primary" />}
        count={items.length}
        emptyTitle={t('phieuKhoPhanThuoc.theoDeXuat.emptyTitle')}
        emptyDescription={t('phieuKhoPhanThuoc.theoDeXuat.emptyHint')}
        emptyIcon={<Warehouse className="w-10 h-10 text-muted-foreground" />}
        loading={isLoading && !!idDeXuat}
        loadingText={t('common.loading')}
        maxTableHeight="280px"
        className={className}
      >
        {items.length > 0 ? (
          <>
            <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('phieuKhoPhanThuoc.store.soPhieuCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('phieuKhoPhanThuoc.store.ngayCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('phieuKhoPhanThuoc.store.loaiCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('phieuKhoPhanThuoc.store.khoCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-left">
                  {t('phieuKhoPhanThuoc.store.statusCol')}
                </th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap text-right">
                  {t('phieuKhoPhanThuoc.list.totalQuantity')}
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
                  <td className="px-4 py-2 text-xs font-mono whitespace-nowrap">{item.so_phieu}</td>
                  <td className="px-4 py-2 text-xs tabular-nums whitespace-nowrap">{formatYmdToDisplay(item.ngay)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <LoaiPhieuKhoPTBadge loai={item.loai} />
                  </td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">{tenKho(item)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <TrangThaiPhieuKhoPTBadge trangThai={item.trang_thai} />
                  </td>
                  <td className="px-4 py-2 text-xs font-semibold tabular-nums text-right whitespace-nowrap">
                    {formatNumberVN(item.tong_so_luong ?? 0)}
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
                              handleDelete(item.id);
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
            </tbody>
          </>
        ) : null}
      </GenericSubTableSection>

      <AnimatePresence>
        {detailItem && (
          <PhieuKhoPTDetail
            data={detailFull ?? detailItem}
            stackLevel={stackLevel}
            onClose={() => setDetailItem(null)}
            // PhieuKhoPTDetail tự chặn sửa/xoá phiếu đã khoá và hiện "Xin sửa" khi được truyền handler.
            onEdit={perm.canUpdate ? openEdit : undefined}
            onDelete={perm.canDelete ? handleDelete : undefined}
            canApprove={perm.canApprove}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingItem && (
          <PhieuKhoPTForm
            khoList={khoList}
            khoDenList={khoListAll}
            initialData={editingFull ?? editingItem}
            stackLevel={stackLevel}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PhieuKhoTheoDeXuatSection;
