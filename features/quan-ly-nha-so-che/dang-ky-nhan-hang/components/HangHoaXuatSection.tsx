import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Package, Plus, ScanLine, Trash2, Undo2 } from 'lucide-react';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import SubTableActionButton from '../../../../components/shared/sub-table/SubTableActionButton';
import Button from '../../../../components/ui/Button';
import { cn, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/useStore';
import type { DangKyNhanHangCt } from '../core/types';
import { useHoanTacDongCuoi, useThemDongHang, useXoaDongHang } from '../hooks/use-dang-ky-nhan-hang';

export interface NhomHangHoa {
  id_hang_hoa: string;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  dvt: string;
  so_luong: number;
  so_dong: number;
  /** Dòng mới nhất của mã này — dùng cho nút "−1". */
  dongMoiNhat: DangKyNhanHangCt;
}

/** Gộp dòng (mỗi thùng 1 dòng) theo mã hàng — `rows` đã sắp mới nhất trước. */
export function gopTheoHangHoa(rows: DangKyNhanHangCt[]): NhomHangHoa[] {
  const map = new Map<string, NhomHangHoa>();
  for (const r of rows) {
    const cur = map.get(r.id_hang_hoa);
    if (cur) {
      cur.so_luong += r.so_luong;
      cur.so_dong += 1;
    } else {
      map.set(r.id_hang_hoa, {
        id_hang_hoa: r.id_hang_hoa,
        ma_hang_hoa: r.ma_hang_hoa ?? '',
        ten_hang_hoa: r.ten_hang_hoa ?? '',
        dvt: r.dvt ?? '',
        so_luong: r.so_luong,
        so_dong: 1,
        dongMoiNhat: r,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.ma_hang_hoa.localeCompare(b.ma_hang_hoa));
}

interface Props {
  idPhieu: string;
  rows: DangKyNhanHangCt[];
  loading: boolean;
  /** Theo trạng thái phiếu + quyền (coTheSuaHangHoa && canUpdate). */
  canEdit: boolean;
  onAdd: () => void;
  onScan: () => void;
}

/**
 * Bảng con "Hàng hoá xuất" — TUỲ CHỌN: phiếu chỉ đăng ký xe thì để trống.
 * Hai chế độ xem: gộp theo mã hàng (mặc định) / từng dòng (từng thùng quét).
 */
const HangHoaXuatSection: React.FC<Props> = ({ idPhieu, rows, loading, canEdit, onAdd, onScan }) => {
  const { t } = useTranslation();
  const [cheDo, setCheDo] = useState<'gop' | 'dong'>('gop');
  const userId = useAuthStore((s) => s.user?.id);
  const them = useThemDongHang();
  const xoa = useXoaDongHang();
  const hoanTac = useHoanTacDongCuoi();

  const nhom = useMemo(() => gopTheoHangHoa(rows), [rows]);
  const tong = useMemo(() => rows.reduce((s, r) => s + r.so_luong, 0), [rows]);
  const busy = them.isPending || xoa.isPending || hoanTac.isPending;

  const colsGop = useMemo<SubTableColumn[]>(
    () => [
      { id: 'hang_hoa', label: t('dangKyNhanHang.hangHoa.hangHoa'), width: 260, minWidth: 150, sticky: true, mobile: 'title' },
      { id: 'dvt', label: t('dangKyNhanHang.hangHoa.dvt'), width: 80, minWidth: 56 },
      { id: 'so_luong', label: t('dangKyNhanHang.hangHoa.soLuong'), width: 100, minWidth: 72, align: 'right', mobile: 'badge' },
      { id: 'so_dong', label: t('dangKyNhanHang.hangHoa.soLanGhi'), width: 100, minWidth: 72, align: 'right' },
    ],
    [t]
  );

  const colsDong = useMemo<SubTableColumn[]>(
    () => [
      { id: 'hang_hoa', label: t('dangKyNhanHang.hangHoa.hangHoa'), width: 240, minWidth: 140, sticky: true, mobile: 'title' },
      { id: 'so_luong', label: t('dangKyNhanHang.hangHoa.soLuong'), width: 80, minWidth: 56, align: 'right', mobile: 'badge' },
      { id: 'nguon', label: t('dangKyNhanHang.hangHoa.nguon'), width: 90, minWidth: 70 },
      { id: 'tg_quet', label: t('dangKyNhanHang.hangHoa.thoiDiem'), width: 140, minWidth: 110 },
      { id: 'nguoi', label: t('dangKyNhanHang.hangHoa.nguoiGhi'), width: 150, minWidth: 100 },
    ],
    [t]
  );

  const tenHang = (ma: string | null, ten: string | null) => (
    <>
      <span className="text-body-sm font-medium text-foreground">{ten || ma || '—'}</span>
      {ma && <span className="text-caption text-muted-foreground block font-mono">{ma}</span>}
    </>
  );

  return (
    <GenericSubTableSection
      title={t('dangKyNhanHang.hangHoa.title')}
      icon={<Package size={14} className="text-primary" />}
      count={rows.length === 0 ? 0 : tong}
      addLabel={canEdit ? t('dangKyNhanHang.hangHoa.them') : undefined}
      onAdd={canEdit ? onAdd : undefined}
      loading={loading}
      loadingText={t('dangKyNhanHang.loading')}
      emptyTitle={t('dangKyNhanHang.hangHoa.empty')}
      emptyDescription={t(canEdit ? 'dangKyNhanHang.hangHoa.emptyHint' : 'dangKyNhanHang.hangHoa.emptyHintKhongSua')}
      contentMode="raw"
    >
      {rows.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
              {(['gop', 'dong'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCheDo(k)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition',
                    cheDo === k ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t(k === 'gop' ? 'dangKyNhanHang.hangHoa.xemGop' : 'dangKyNhanHang.hangHoa.xemTungDong')}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t('dangKyNhanHang.hangHoa.tongKet', { tong: formatNumberVN(tong), soMa: nhom.length })}
            </span>
            {canEdit && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => hoanTac.mutate(idPhieu)} disabled={busy}>
                  <Undo2 size={14} className="mr-1.5" />
                  {t('dangKyNhanHang.hangHoa.hoanTacCuoi')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onScan}>
                  <ScanLine size={14} className="mr-1.5" />
                  {t('dangKyNhanHang.toolbar.quetQr')}
                </Button>
              </div>
            )}
          </div>

          {cheDo === 'gop' ? (
            <SubTable<NhomHangHoa>
              tableKey="dang-ky-nhan-hang.hang-hoa-gop"
              columns={colsGop}
              rows={nhom}
              keyExtractor={(r) => r.id_hang_hoa}
              renderCell={(colId, r) => {
                switch (colId) {
                  case 'hang_hoa':
                    return tenHang(r.ma_hang_hoa, r.ten_hang_hoa);
                  case 'dvt':
                    return <span className="text-caption text-muted-foreground">{r.dvt || '—'}</span>;
                  case 'so_luong':
                    return <span className="tabular-nums font-semibold">{formatNumberVN(r.so_luong)}</span>;
                  case 'so_dong':
                    return <span className="tabular-nums text-muted-foreground">{formatNumberVN(r.so_dong)}</span>;
                  default:
                    return null;
                }
              }}
              renderActions={
                canEdit
                  ? (r) => (
                      <>
                        <SubTableActionButton
                          label={t('dangKyNhanHang.hangHoa.cong1')}
                          icon={<Plus size={14} />}
                          disabled={busy}
                          onClick={() =>
                            them.mutate([
                              {
                                id_phieu: idPhieu,
                                id_hang_hoa: r.id_hang_hoa,
                                ma_hang_hoa: r.ma_hang_hoa,
                                so_luong: 1,
                                nguon: 'tay',
                                id_nguoi_quet: userId ? String(userId) : null,
                              },
                            ])
                          }
                        />
                        <SubTableActionButton
                          label={t('dangKyNhanHang.hangHoa.tru1')}
                          icon={<Minus size={14} />}
                          tone="warning"
                          disabled={busy}
                          onClick={() => xoa.mutate([r.dongMoiNhat.id])}
                        />
                      </>
                    )
                  : undefined
              }
              actionsWidth={84}
            />
          ) : (
            <SubTable<DangKyNhanHangCt>
              tableKey="dang-ky-nhan-hang.hang-hoa-dong"
              columns={colsDong}
              rows={rows}
              keyExtractor={(r) => r.id}
              renderCell={(colId, r) => {
                switch (colId) {
                  case 'hang_hoa':
                    return tenHang(r.ma_hang_hoa, r.ten_hang_hoa);
                  case 'so_luong':
                    return <span className="tabular-nums">{formatNumberVN(r.so_luong)}</span>;
                  case 'nguon':
                    return (
                      <span className="text-caption text-muted-foreground">
                        {t(r.nguon === 'quet' ? 'dangKyNhanHang.hangHoa.nguonQuet' : 'dangKyNhanHang.hangHoa.nguonTay')}
                      </span>
                    );
                  case 'tg_quet':
                    return <span className="text-caption tabular-nums">{formatDateTimeShort(r.tg_quet)}</span>;
                  case 'nguoi':
                    return <span className="text-caption text-muted-foreground">{r.ten_nguoi_quet || '—'}</span>;
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
                        onClick={() => xoa.mutate([r.id])}
                      />
                    )
                  : undefined
              }
              actionsWidth={56}
              maxHeight="420px"
            />
          )}
        </div>
      )}
    </GenericSubTableSection>
  );
};

export default HangHoaXuatSection;
