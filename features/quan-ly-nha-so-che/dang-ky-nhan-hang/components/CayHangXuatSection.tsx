import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Layers, ScanLine, Trash2, Undo2 } from 'lucide-react';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import SubTableActionButton from '../../../../components/shared/sub-table/SubTableActionButton';
import Button from '../../../../components/ui/Button';
import { getStatusBadgeClass } from '../../../../lib/status-badge';
import { cn, formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import type { DangKyNhanHangCt } from '../core/types';
import { gopTheoHangHoa } from '../core/gop-hang-hoa';
import { useHoanTacDongCuoi, useXoaDongHang } from '../hooks/use-dang-ky-nhan-hang';

interface Props {
  idPhieu: string;
  rows: DangKyNhanHangCt[];
  loading: boolean;
  /** Theo trạng thái phiếu + quyền (coTheSuaHangHoa && canUpdate). */
  canEdit: boolean;
  onScan: () => void;
}

/**
 * Bảng con "Cây hàng xuất" — TUỲ CHỌN: phiếu chỉ đăng ký xe thì để trống.
 * Mỗi dòng 1 cây hàng (phiếu Giám sát chất lượng), ghi bằng quét tem QC hoặc chọn tay.
 */
const CayHangXuatSection: React.FC<Props> = ({ idPhieu, rows, loading, canEdit, onScan }) => {
  const { t } = useTranslation();
  const xoa = useXoaDongHang();
  const hoanTac = useHoanTacDongCuoi();
  const confirm = useConfirmStore((s) => s.confirm);
  const busy = xoa.isPending || hoanTac.isPending;

  const tongThung = useMemo(() => rows.reduce((s, r) => s + r.so_luong, 0), [rows]);
  const theoThanhPham = useMemo(() => gopTheoHangHoa(rows), [rows]);

  const xoaDong = (r: DangKyNhanHangCt) =>
    confirm({
      title: t('dangKyNhanHang.cayHang.xoaTitle'),
      message: t('dangKyNhanHang.cayHang.xoaMessage', { so: r.so_phieu_gscl ?? '', thung: formatNumberVN(r.so_luong) }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: () => xoa.mutate([r.id]),
    });

  const cols = useMemo<SubTableColumn[]>(
    () => [
      { id: 'phieu', label: t('dangKyNhanHang.cayHang.phieuQc'), width: 130, minWidth: 110, sticky: true, mobile: 'title' },
      { id: 'thanh_pham', label: t('dangKyNhanHang.cayHang.thanhPham'), width: 220, minWidth: 140 },
      { id: 'so_thung', label: t('dangKyNhanHang.cayHang.thung'), width: 80, minWidth: 64, align: 'right', mobile: 'badge' },
      { id: 'ket_luan', label: t('dangKyNhanHang.cayHang.ketLuan'), width: 110, minWidth: 90 },
      { id: 'ghi', label: t('dangKyNhanHang.hangHoa.thoiDiem'), width: 170, minWidth: 130 },
    ],
    [t]
  );

  return (
    <GenericSubTableSection
      title={t('dangKyNhanHang.cayHang.title')}
      icon={<Layers size={14} className="text-primary" />}
      count={rows.length}
      addLabel={canEdit ? t('dangKyNhanHang.cayHang.quetTem') : undefined}
      onAdd={canEdit ? onScan : undefined}
      loading={loading}
      loadingText={t('dangKyNhanHang.loading')}
      emptyTitle={t('dangKyNhanHang.cayHang.empty')}
      emptyDescription={t(canEdit ? 'dangKyNhanHang.cayHang.emptyHint' : 'dangKyNhanHang.hangHoa.emptyHintKhongSua')}
      contentMode="raw"
    >
      {rows.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {t('dangKyNhanHang.cayHang.tongKet', { cay: rows.length, thung: formatNumberVN(tongThung) })}
            </span>
            {theoThanhPham.length > 1 &&
              theoThanhPham.map((n) => (
                <span
                  key={n.id_hang_hoa}
                  className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/40 text-muted-foreground tabular-nums"
                >
                  {n.ten_hang_hoa || n.ma_hang_hoa || '—'}: {formatNumberVN(n.so_dong)} · {formatNumberVN(n.so_luong)}
                </span>
              ))}
            {canEdit && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => hoanTac.mutate(idPhieu)} disabled={busy}>
                  <Undo2 size={14} className="mr-1.5" />
                  {t('dangKyNhanHang.hangHoa.hoanTacCuoi')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onScan}>
                  <ScanLine size={14} className="mr-1.5" />
                  {t('dangKyNhanHang.cayHang.quetTem')}
                </Button>
              </div>
            )}
          </div>

          <SubTable<DangKyNhanHangCt>
            tableKey="dang-ky-nhan-hang.cay-hang"
            columns={cols}
            rows={rows}
            keyExtractor={(r) => r.id}
            renderCell={(colId, r) => {
              switch (colId) {
                case 'phieu':
                  return (
                    <>
                      <span className="text-body-sm font-semibold font-mono text-foreground">{r.so_phieu_gscl ?? '—'}</span>
                      {r.ngay_gscl && (
                        <span className="text-caption text-muted-foreground block tabular-nums">{formatYmdToDisplay(r.ngay_gscl)}</span>
                      )}
                    </>
                  );
                case 'thanh_pham':
                  return (
                    <>
                      <span className="text-body-sm text-foreground">{r.ten_hang_hoa || r.ma_hang_hoa || '—'}</span>
                      {r.ma_cay_hang && (
                        <span className="text-caption text-muted-foreground block">
                          {t('dangKyNhanHang.cayHang.cay', { ma: r.ma_cay_hang })}
                        </span>
                      )}
                      {r.xe_khac.length > 0 && (
                        <span className="text-caption text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle size={11} />
                          {t('dangKyNhanHang.cayHang.cungTrenXe', { xe: r.xe_khac.join(', ') })}
                        </span>
                      )}
                    </>
                  );
                case 'so_thung':
                  return <span className="tabular-nums font-semibold">{formatNumberVN(r.so_luong)}</span>;
                case 'ket_luan':
                  return r.ket_luan_gscl ? (
                    <span
                      className={cn(
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
                        getStatusBadgeClass(r.ket_luan_gscl === 'dat' ? 'success' : 'rejected')
                      )}
                    >
                      {t(`dangKyNhanHang.cayHang.ketLuan_${r.ket_luan_gscl}`)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  );
                case 'ghi':
                  return (
                    <>
                      <span className="text-caption tabular-nums">{formatDateTimeShort(r.tg_quet)}</span>
                      <span className="text-caption text-muted-foreground block">
                        {[
                          t(r.nguon === 'quet' ? 'dangKyNhanHang.hangHoa.nguonQuet' : 'dangKyNhanHang.hangHoa.nguonTay'),
                          r.ten_nguoi_quet,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </>
                  );
                default:
                  return null;
              }
            }}
            renderActions={
              canEdit
                ? (r) => (
                    <SubTableActionButton
                      label={t('common.delete')}
                      icon={<Trash2 size={14} />}
                      tone="danger"
                      disabled={busy}
                      onClick={() => xoaDong(r)}
                    />
                  )
                : undefined
            }
            actionsWidth={56}
            maxHeight="420px"
          />
        </div>
      )}
    </GenericSubTableSection>
  );
};

export default CayHangXuatSection;
