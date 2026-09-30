import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import Tooltip from '../../../../components/ui/Tooltip';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import SubTableActionButton from '../../../../components/shared/sub-table/SubTableActionButton';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { getKetQuaLabelPT, KET_QUA_SEMANTIC_PT } from '../core/constants';
import { getPhieuKhoPTPreviewUrl } from '../core/preview-url';
import { getLechKiemKePT, rowCanDieuChinhPT } from '../core/ket-qua';
import { coTheSuaChiTietPT, coTheSuaDongKiemKePT } from '../core/quyen-sua-dot';
import type { ChiTietKiemKePT, TrangThaiDotKiemKePT } from '../core/types';

interface Props {
  data: ChiTietKiemKePT[];
  trangThaiDot: TrangThaiDotKiemKePT;
  capCao: boolean;
  /** Quyền module (ModulePermissionGuard) — nhập kết quả / điều chỉnh / thêm dòng. */
  canUpdate: boolean;
  canDelete: boolean;
  onNhapKetQua?: (item: ChiTietKiemKePT) => void;
  onDieuChinh?: (id: string) => void;
  onDelete?: (item: ChiTietKiemKePT) => void;
  dieuChinhLoading?: boolean;
  nhapKetQuaLoading?: boolean;
  deleteLoading?: boolean;
  emptyContent?: React.ReactNode;
}

/**
 * Bảng con chi tiết kiểm kê trong drawer — khuôn `SubTable` (ghim `#` + Hàng hoá
 * bên trái, Thao tác bên phải, kéo đổi bề rộng cột, card trên mobile).
 */
const ChiTietKiemKePTSubTable: React.FC<Props> = ({
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

  const canNhap = (item: ChiTietKiemKePT) =>
    Boolean(onNhapKetQua && canUpdate && isDangKiemKe && coTheSuaDongKiemKePT(item, trangThaiDot, capCao));
  const canDieuChinh = (item: ChiTietKiemKePT) =>
    Boolean(onDieuChinh && canUpdate && rowCanDieuChinhPT(item, trangThaiDot));
  const canXoa = (item: ChiTietKiemKePT) =>
    Boolean(onDelete && canDelete && coTheSuaDongKiemKePT(item, trangThaiDot, capCao));

  const showActions = (canUpdate || canDelete) && coTheSuaChiTietPT(trangThaiDot, capCao);

  const columns = useMemo<SubTableColumn[]>(
    () => [
      { id: 'hang_hoa', label: t('kiemKeKhoPT.store.hangHoaCol'), width: 240, minWidth: 140, sticky: true, mobile: 'title' },
      { id: 'kho', label: t('kiemKeKhoPT.store.khoCol'), width: 150, minWidth: 90 },
      { id: 'dvt', label: t('kiemKeKhoPT.store.dvtCol'), width: 80, minWidth: 56 },
      { id: 'so_luong_so', label: t('kiemKeKhoPT.store.soLuongSoCol'), width: 104, minWidth: 72, align: 'right' },
      { id: 'so_luong_thuc_te', label: t('kiemKeKhoPT.store.soLuongThucTeCol'), width: 112, minWidth: 72, align: 'right' },
      { id: 'chenh_lech', label: t('kiemKeKhoPT.detail.chenhLech'), width: 104, minWidth: 72, align: 'right' },
      { id: 'ket_qua', label: t('kiemKeKhoPT.store.ketQuaCol'), width: 112, minWidth: 90, mobile: 'badge' },
      { id: 'dieu_chinh', label: t('kiemKeKhoPT.store.dieuChinhCol'), width: 150, minWidth: 100 },
      { id: 'ghi_chu', label: t('kiemKeKhoPT.store.ghiChuCol'), width: 200, minWidth: 100, mobile: 'full' },
    ],
    [t]
  );

  const renderCell = (colId: string, item: ChiTietKiemKePT) => {
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
        const lech = getLechKiemKePT(item);
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
              getStatusBadgeClass(KET_QUA_SEMANTIC_PT[item.ket_qua])
            )}
          >
            {getKetQuaLabelPT(item.ket_qua, t)}
          </span>
        );
      case 'dieu_chinh':
        return item.id_phieu_kho_dieu_chinh ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
              {t('kiemKeKhoPT.dieuChinhStatus.done')}
            </span>
            {item.so_luong_dieu_chinh != null && (
              <span className="text-caption text-muted-foreground tabular-nums">
                {formatNumberVN(item.so_luong_dieu_chinh)}
              </span>
            )}
            <Tooltip content={t('kiemKeKhoPT.table.xemPhieuDieuChinh')} placement="top">
              <a
                href={getPhieuKhoPTPreviewUrl(item.id_phieu_kho_dieu_chinh)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-primary hover:bg-primary/10 rounded-md inline-flex"
                aria-label={t('kiemKeKhoPT.table.xemPhieuDieuChinh')}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={14} />
              </a>
            </Tooltip>
          </div>
        ) : (
          <span className="text-caption text-muted-foreground">{t('kiemKeKhoPT.dieuChinhStatus.pending')}</span>
        );
      case 'ghi_chu':
        return <span className="text-caption text-muted-foreground">{item.ghi_chu_dong || '—'}</span>;
      default:
        return null;
    }
  };

  const renderActions = (item: ChiTietKiemKePT) => {
    const buttons: React.ReactNode[] = [];
    if (canNhap(item)) {
      buttons.push(
        <SubTableActionButton
          key="nhap"
          primary
          label={t('kiemKeKhoPT.table.nhapKetQua')}
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
          label={t('kiemKeKhoPT.dieuChinhTonTheoKetQua')}
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
          label={t('kiemKeKhoPT.table.xoaDong')}
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
      tableKey="kiem-ke-kho-pt.chi-tiet"
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

export default ChiTietKiemKePTSubTable;
