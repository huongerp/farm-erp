import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Minus, X } from 'lucide-react';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { tinhTieuChi, type KetQuaTieuChi } from '../core/ket-luan';
import { tiLeLoi } from '../core/ti-le';
import type { GiaTriKetQua, ThungMau, TieuChi } from '../core/types';

interface Props {
  tieuChi: TieuChi[];
  thung: ThungMau[];
  soThungMau: number;
  /** Bấm tiêu đề cột thùng để nhập / sửa kết quả thùng đó (khi được phép). */
  onChonThung?: (thung: ThungMau) => void;
}

const so = (n: number | null) => (n == null ? '—' : formatNumberVN(n, { maxFractionDigits: 2 }));
const phanTram = (n: number) => `${formatNumberVN(n, { maxFractionDigits: 1 })}%`;

function oGiaTri(tc: TieuChi, v: GiaTriKetQua | undefined, daKiem: boolean): React.ReactNode {
  if (!daKiem) return <span className="text-muted-foreground/40">·</span>;
  if (tc.loai === 'dat_khong') {
    if (v === true) return <Check size={14} className="inline text-emerald-600" />;
    if (v === false) return <X size={14} className="inline text-rose-600" />;
    return <span className="text-muted-foreground/60">—</span>;
  }
  if (typeof v !== 'number') return tc.loai === 'dem_loi' ? '0' : <span className="text-muted-foreground/60">—</span>;
  return (
    <span className={cn(tc.loai === 'dem_loi' && v > 0 && 'text-amber-700 dark:text-amber-400 font-medium')}>
      {so(v)}
    </span>
  );
}

function tongHienThi(tc: TieuChi, kq: KetQuaTieuChi): string {
  if (tc.loai === 'dat_khong') return kq.soThungCoGiaTri ? `${kq.soKhong} ✗` : '—';
  if (tc.loai === 'do_luong') return kq.trungBinh != null ? `TB ${so(kq.trungBinh)}` : '—';
  return so(kq.tong);
}

function nguongHienThi(tc: TieuChi, kq: KetQuaTieuChi): string {
  if (tc.loai === 'do_luong') {
    if (kq.nguongMin != null && kq.nguongMax != null) return `${so(kq.nguongMin)}–${so(kq.nguongMax)}`;
    if (kq.nguongMin != null) return `≥ ${so(kq.nguongMin)}`;
    if (kq.nguongMax != null) return `≤ ${so(kq.nguongMax)}`;
    return '—';
  }
  return kq.nguongMax != null ? `≤ ${so(kq.nguongMax)}` : '—';
}

const DatIcon: React.FC<{ dat: boolean | null }> = ({ dat }) =>
  dat == null ? (
    <Minus size={14} className="inline text-muted-foreground/50" />
  ) : dat ? (
    <Check size={15} className="inline text-emerald-600" />
  ) : (
    <X size={15} className="inline text-rose-600" />
  );

/** Ma trận tiêu chí × thùng mẫu + cột tổng / ngưỡng / đạt (ngưỡng đã quy đổi theo số thùng mẫu). */
const BangKetQuaThung: React.FC<Props> = ({ tieuChi, thung, soThungMau, onChonThung }) => {
  const { t } = useTranslation();
  const chiTiet = useMemo(() => {
    const kq = thung.filter((x) => x.da_kiem).map((x) => x.ket_qua);
    return tieuChi.map((tc) => tinhTieuChi(tc, kq, soThungMau));
  }, [tieuChi, thung, soThungMau]);

  if (tieuChi.length === 0) {
    return <p className="text-sm text-muted-foreground italic m-0">{t('giamSatChatLuong.detail.khongCoTieuChi')}</p>;
  }

  const th = 'px-2 py-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap';
  const td = 'px-2 py-1.5 text-sm tabular-nums text-center whitespace-nowrap';
  const sticky = 'sticky left-0 z-[1] bg-card';

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse">
        <thead className="bg-muted/50">
          <tr className="border-b border-border">
            <th className={cn(th, sticky, 'bg-muted text-left min-w-[150px]')}>{t('giamSatChatLuong.detail.tieuChi')}</th>
            {thung.map((x) => (
              <th key={x.id} className={cn(th, 'text-center p-0')}>
                <button
                  type="button"
                  disabled={!onChonThung}
                  onClick={() => onChonThung?.(x)}
                  title={x.ma_tem}
                  className={cn(
                    'w-full min-w-[40px] px-1.5 py-1.5 inline-flex items-center justify-center gap-0.5 rounded-md',
                    x.da_kiem ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground',
                    onChonThung && 'hover:bg-primary/10 cursor-pointer'
                  )}
                >
                  {t('giamSatChatLuong.detail.thungSo', { stt: x.stt_thung })}
                  {x.da_kiem && <Check size={11} />}
                </button>
              </th>
            ))}
            <th className={cn(th, 'text-center border-l border-border')}>{t('giamSatChatLuong.detail.tong')}</th>
            <th className={cn(th, 'text-center')}>{t('giamSatChatLuong.detail.nguong')}</th>
            <th className={cn(th, 'text-center')}>{t('giamSatChatLuong.detail.dat')}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border bg-muted/20">
            <td className={cn('px-2 py-1.5 text-sm font-medium', sticky, 'bg-muted')}>{t('giamSatChatLuong.detail.tongNhanh')}</td>
            {thung.map((x) => (
              <td key={x.id} className={cn(td, 'font-medium')}>
                {x.da_kiem ? so(x.tong_nhanh) : <span className="text-muted-foreground/40">·</span>}
              </td>
            ))}
            <td className={cn(td, 'border-l border-border')} colSpan={3} />
          </tr>
          {tieuChi.map((tc, i) => {
            const kq = chiTiet[i];
            return (
              <tr key={tc.ma} className={cn('border-b border-border last:border-0', kq.dat === false && 'bg-rose-500/5')}>
                <td className={cn('px-2 py-1.5 text-sm', sticky, kq.dat === false && 'bg-rose-50 dark:bg-rose-950/30')}>
                  <span className="font-medium">{tc.ten}</span>
                  {tc.don_vi && <span className="text-xs text-muted-foreground"> ({tc.don_vi})</span>}
                </td>
                {thung.map((x) => {
                  const tiLe = x.da_kiem ? tiLeLoi(tc, x.ket_qua[tc.ma], x.tong_nhanh) : null;
                  return (
                    <td key={x.id} className={td}>
                      {oGiaTri(tc, x.ket_qua[tc.ma], x.da_kiem)}
                      {tiLe != null && <span className="ml-1 text-[11px] text-muted-foreground">{phanTram(tiLe)}</span>}
                    </td>
                  );
                })}
                <td className={cn(td, 'font-semibold border-l border-border')}>{tongHienThi(tc, kq)}</td>
                <td className={cn(td, 'text-muted-foreground')}>{nguongHienThi(tc, kq)}</td>
                <td className={td}>
                  <DatIcon dat={kq.dat} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BangKetQuaThung;
