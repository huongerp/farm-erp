import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Warehouse, Eye, Edit, Trash2 } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../../components/shared/sub-table/SubTable';
import SubTableActionButton from '../../../../../components/shared/sub-table/SubTableActionButton';
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

  const columns: SubTableColumn[] = [
    { id: 'so_phieu', label: t('phieuKhoPhanThuoc.store.soPhieuCol'), width: 150, minWidth: 110, sticky: true, mobile: 'title' },
    { id: 'ngay', label: t('phieuKhoPhanThuoc.store.ngayCol'), width: 100, minWidth: 90 },
    { id: 'loai', label: t('phieuKhoPhanThuoc.store.loaiCol'), width: 110, minWidth: 80 },
    { id: 'kho', label: t('phieuKhoPhanThuoc.store.khoCol'), width: 180, minWidth: 120 },
    { id: 'trang_thai', label: t('phieuKhoPhanThuoc.store.statusCol'), width: 130, minWidth: 90, mobile: 'badge' },
    { id: 'tong_so_luong', label: t('phieuKhoPhanThuoc.list.totalQuantity'), width: 110, minWidth: 80, align: 'right' },
  ];

  const renderCell = (colId: string, item: PhieuKhoPT) => {
    switch (colId) {
      case 'so_phieu':
        return <span className="text-xs font-mono">{item.so_phieu}</span>;
      case 'ngay':
        return <span className="text-xs tabular-nums">{formatYmdToDisplay(item.ngay)}</span>;
      case 'loai':
        return <LoaiPhieuKhoPTBadge loai={item.loai} />;
      case 'kho':
        return <span className="text-xs">{tenKho(item)}</span>;
      case 'trang_thai':
        return <TrangThaiPhieuKhoPTBadge trangThai={item.trang_thai} />;
      case 'tong_so_luong':
        return <span className="text-xs font-semibold tabular-nums">{formatNumberVN(item.tong_so_luong ?? 0)}</span>;
      default:
        return null;
    }
  };

  const renderActions = (item: PhieuKhoPT) => (
    <>
      <SubTableActionButton
        primary
        tone="neutral"
        label={t('common.view')}
        icon={<Eye size={14} />}
        onClick={() => setDetailItem(item)}
      />
      {canEditRow(item) && (
        <SubTableActionButton label={t('common.edit')} icon={<Edit size={14} />} onClick={() => openEdit(item)} />
      )}
      {canDeleteRow(item) && (
        <SubTableActionButton
          label={t('common.delete')}
          icon={<Trash2 size={14} />}
          tone="danger"
          onClick={() => handleDelete(item.id)}
        />
      )}
    </>
  );

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
        contentMode="raw"
        className={className}
      >
        {items.length > 0 ? (
          // SubTable: desktop là bảng như cũ (nút thao tác ghim phải), điện thoại chuyển sang thẻ — khỏi vuốt ngang.
          <SubTable
            tableKey="phieu-kho-pt.theo-de-xuat"
            columns={columns}
            rows={items}
            keyExtractor={(item) => item.id}
            renderCell={renderCell}
            renderActions={renderActions}
            onMobileCardClick={setDetailItem}
            onRowClick={setDetailItem}
            maxHeight="280px"
          />
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
