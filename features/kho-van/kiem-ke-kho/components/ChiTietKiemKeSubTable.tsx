import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import Tooltip from '../../../../components/ui/Tooltip';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import SubTableActionButton from '../../../../components/shared/sub-table/SubTableActionButton';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { getKetQuaLabel, KET_QUA_SEMANTIC } from '../core/constants';
import { coTheSuaChiTiet, coTheSuaDongKiemKe } from '../core/quyen-sua-dot';
import type { ChiTietKiemKeKho, TrangThaiDotKiemKeKho } from '../core/types';

const getPhieuKhoDieuChinhPreviewUrl = (idPhieu: string) =>
  `/mua-hang/phieu-kho/preview/${encodeURIComponent(idPhieu)}`;

/** Lệch = thực tế − sổ; `null` khi chưa nhập kết quả. */
function getLech(item: ChiTietKiemKeKho): number | null {
  return item.so_luong_thuc_te == null ? null : item.so_luong_thuc_te - item.so_luong_so;
}

/** Còn điều chỉnh tồn được: đợt đang kiểm kê, đã nhập thực tế, có lệch, chưa sinh phiếu. */
function rowCanDieuChinh(item: ChiTietKiemKeKho, trangThaiDot: TrangThaiDotKiemKeKho): boolean {
  if (trangThaiDot !== 'dang_kiem_ke' || item.id_phieu_kho_dieu_chinh) return false;
  const lech = getLech(item);
  return lech != null && lech !== 0;
}

interface Props {
  data: ChiTietKiemKeKho[];
  trangThaiDot: TrangThaiDotKiemKeKho;
  capCao: boolean;
  /** Quyền module (ModulePermissionGuard) — nhập kết quả / điều chỉnh / thêm dòng. */
  canUpdate: boolean;
  canDelete: boolean;
  onNhapKetQua?: (item: ChiTietKiemKeKho) => void;
  onDieuChinh?: (id: string) => void;
  onDelete?: (item: ChiTietKiemKeKho) => void;
  dieuChinhLoading?: boolean;
  nhapKetQuaLoading?: boolean;
  deleteLoading?: boolean;
  emptyContent?: React.ReactNode;
}

/**
 * Bảng con chi tiết kiểm kê trong drawer — khuôn `SubTable` (ghim `#` + Hàng hoá
 * bên trái, Thao tác bên phải, kéo đổi bề rộng cột, card trên mobile).
 */
const ChiTietKiemKeSubTable: React.FC<Props> = ({
  data,
  trangThaiDot,
  capCao,
  canUpdate,
  canDelete,
  onNhapKetQua,
  onDieuChinh,
  onDelete,
  dieuChinhLoading,
  nhapKetQuaLoading,
  deleteLoading,
  emptyContent,
}) => {
  const { t } = useTranslation();
  const isDangKiemKe = trangThaiDot === 'dang_kiem_ke';

  const canNhap = (item: ChiTietKiemKeKho) =>
    Boolean(onNhapKetQua && canUpdate && isDangKiemKe && coTheSuaDongKiemKe(item, trangThaiDot, capCao));
  const canDieuChinh = (item: ChiTietKiemKeKho) =>
    Boolean(onDieuChinh && canUpdate && rowCanDieuChinh(item, trangThaiDot));
  const canXoa = (item: ChiTietKiemKeKho) =>
    Boolean(onDelete && canDelete && coTheSuaDongKiemKe(item, trangThaiDot, capCao));

  const showActions = (canUpdate || canDelete) && coTheSuaChiTiet(trangThaiDot, capCao);

  const columns = useMemo<SubTableColumn[]>(
    () => [
      { id: 'hang_hoa', label: t('kiemKeKho.store.hangHoaCol'), width: 240, minWidth: 140, sticky: true, mobile: 'title' },
      { id: 'kho', label: t('kiemKeKho.store.khoCol'), width: 150, minWidth: 90 },
      { id: 'dvt', label: t('kiemKeKho.store.dvtCol'), width: 80, minWidth: 56 },
      { id: 'so_luong_so', label: t('kiemKeKho.store.soLuongSoCol'), width: 104, minWidth: 72, align: 'right' },
      { id: 'so_luong_thuc_te', label: t('kiemKeKho.store.soLuongThucTeCol'), width: 112, minWidth: 72, align: 'right' },
      { id: 'chenh_lech', label: t('kiemKeKho.detail.chenhLech'), width: 104, minWidth: 72, align: 'right' },
      { id: 'ket_qua', label: t('kiemKeKho.store.ketQuaCol'), width: 112, minWidth: 90, mobile: 'badge' },
      { id: 'dieu_chinh', label: t('kiemKeKho.store.dieuChinhCol'), width: 150, minWidth: 100 },
      { id: 'ghi_chu', label: t('kiemKeKho.store.ghiChuCol'), width: 200, minWidth: 100, mobile: 'full' },
    ],
    [t]
  );

  const renderCell = (colId: string, item: ChiTietKiemKeKho) => {
    switch (colId) {
      case 'hang_hoa':
        return (
          <>
            <span className="text-body-sm font-medium text-foreground">{item.ten_hang || item.ma_hang || '—'}</span>
            {item.ma_hang && <span className="text-caption text-muted-foreground block">{item.ma_hang}</span>}
          </>
        );
      case 'kho':
        return <span className="text-body-sm">{item.ten_kho || item.ma_kho || '—'}</span>;
      case 'dvt':
        return <span className="text-caption text-muted-foreground">{item.don_vi_tinh || '—'}</span>;
      case 'so_luong_so':
        return <span className="tabular-nums">{formatNumberVN(item.so_luong_so)}</span>;
      case 'so_luong_thuc_te':
        return (
          <span className={cn('tabular-nums', item.so_luong_thuc_te == null && 'text-muted-foreground')}>
            {item.so_luong_thuc_te != null ? formatNumberVN(item.so_luong_thuc_te) : '—'}
          </span>
        );
      case 'chenh_lech': {
        const lech = getLech(item);
        return (
          <span
            className={cn(
              'tabular-nums font-medium',
              lech != null && lech < 0 && 'text-rose-600 dark:text-rose-400',
              lech != null && lech > 0 && 'text-violet-600 dark:text-violet-400'
            )}
          >
            {lech == null ? '—' : lech > 0 ? `+${formatNumberVN(lech)}` : formatNumberVN(lech)}
          </span>
        );
      }
      case 'ket_qua':
        return (
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
              getStatusBadgeClass(KET_QUA_SEMANTIC[item.ket_qua])
            )}
          >
            {getKetQuaLabel(item.ket_qua, t)}
          </span>
        );
      case 'dieu_chinh':
        return item.id_phieu_kho_dieu_chinh ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
              {t('kiemKeKho.dieuChinhStatus.done')}
            </span>
            {item.so_luong_dieu_chinh != null && (
              <span className="text-caption text-muted-foreground tabular-nums">
                {formatNumberVN(item.so_luong_dieu_chinh)}
              </span>
            )}
            <Tooltip content={t('kiemKeKho.table.xemPhieuDieuChinh')} placement="top">
              <a
                href={getPhieuKhoDieuChinhPreviewUrl(item.id_phieu_kho_dieu_chinh)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-primary hover:bg-primary/10 rounded-md inline-flex"
                aria-label={t('kiemKeKho.table.xemPhieuDieuChinh')}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            </Tooltip>
          </div>
        ) : (
          <span className="text-caption text-muted-foreground">{t('kiemKeKho.dieuChinhStatus.pending')}</span>
        );
      case 'ghi_chu':
        return <span className="text-caption text-muted-foreground">{item.ghi_chu_dong || '—'}</span>;
      default:
        return null;
    }
  };

  const renderActions = (item: ChiTietKiemKeKho) => {
    const buttons: React.ReactNode[] = [];
    if (canNhap(item)) {
      buttons.push(
        <SubTableActionButton
          key="nhap"
          primary
          label={t('kiemKeKho.table.nhapKetQua')}
          icon={<Edit size={14} />}
          onClick={() => onNhapKetQua?.(item)}
          disabled={nhapKetQuaLoading}
        />
      );
    }
    if (canDieuChinh(item)) {
      buttons.push(
        <SubTableActionButton
          key="dieu-chinh"
          tone="warning"
          label={t('kiemKeKho.dieuChinhTonTheoKetQua')}
          icon={<RefreshCw size={14} />}
          onClick={() => onDieuChinh?.(item.id)}
          disabled={dieuChinhLoading}
        />
      );
    }
    if (canXoa(item)) {
      buttons.push(
        <SubTableActionButton
          key="xoa"
          tone="danger"
          label={t('kiemKeKho.table.xoaDong')}
          icon={<Trash2 size={14} />}
          onClick={() => onDelete?.(item)}
          disabled={deleteLoading}
        />
      );
    }
    return buttons.length > 0 ? <>{buttons}</> : null;
  };

  return (
    <SubTable
      tableKey="kiem-ke-kho.chi-tiet"
      columns={columns}
      rows={data}
      keyExtractor={(item) => item.id}
      renderCell={renderCell}
      renderActions={showActions ? renderActions : undefined}
      // Người đi kho chạm cả card để nhập số — nhanh hơn nhắm nút nhỏ.
      onMobileCardClick={
        isDangKiemKe && canUpdate && onNhapKetQua
          ? (item) => {
              if (canNhap(item)) onNhapKetQua(item);
            }
          : undefined
      }
      emptyContent={emptyContent}
    />
  );
};

export default ChiTietKiemKeSubTable;
