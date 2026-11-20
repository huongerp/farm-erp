import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronRight, FileSpreadsheet } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import EmptyState from '../../../../components/shared/EmptyState';
import ErrorState from '../../../../components/shared/ErrorState';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { docHeSo, tongHopThuongThang, type DongThuongThang } from '../core/thuong-vuot-thung';
import {
  useCaiDatThuongVuot,
  useHeSoLoiThang,
  useLuuHeSoLoiThang,
  useNhaSoCheTrongPhamVi,
  usePhieuThangThuongVuot,
  useViTriKhongThuongVuot,
} from '../hooks/use-thuong-vuot';
import { useBaoCaoNhanCongPermissions } from '../hooks/use-bao-cao-nhan-cong-permissions';
import { exportThuongVuotThangToXLSX } from '../utils/export-thuong-vuot-thang';

const KI_TOI_DA = 2;
const th = 'px-3 py-2 font-medium text-right whitespace-nowrap border-b border-border';
const td = 'px-3 py-2 text-right tabular-nums whitespace-nowrap';
const thangHienTai = () => new Date().toISOString().slice(0, 7);
const fmt2 = (v: number) => formatNumberVN(v, { maxFractionDigits: 2 });

/** Ô Ki: gõ «0,95» rồi rời ô / Enter mới lưu; trống = về 1. */
const OKi: React.FC<{ dong: DongThuongThang; disabled: boolean; onLuu: (ki: number | null) => void }> = ({ dong, disabled, onLuu }) => {
  const { t } = useTranslation();
  const [go, setGo] = useState<string | null>(null);
  const gia = go ?? String(dong.ki).replace('.', ',');
  const v = gia.trim() === '' ? 1 : docHeSo(gia);
  const loi = v == null || v > KI_TOI_DA;
  const xong = () => {
    if (go == null) return;
    setGo(null);
    if (!loi && v !== dong.ki) onLuu(v === 1 ? null : v);
  };
  if (disabled) return <span>{fmt2(dong.ki)}</span>;
  return (
    <input
      type="text"
      inputMode="decimal"
      value={gia}
      onChange={(e) => setGo(e.target.value)}
      onBlur={xong}
      onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
      onClick={(e) => e.stopPropagation()}
      aria-label={`${t('baoCaoNhanCong.vuot.colKi')} — ${dong.ho_ten}`}
      className={cn('h-8 w-16 rounded-md border bg-background px-1.5 text-right text-sm', loi ? 'border-rose-500' : 'border-border', dong.ki !== 1 && 'font-semibold text-amber-700 dark:text-amber-400')}
    />
  );
};

/** Tab «Thưởng vượt tháng»: cộng thưởng vượt thùng từng ngày của mỗi công nhân trong tháng × Ki. */
const ThuongVuotThangTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const thangParam = searchParams.get('thang');
  const thang = thangParam && /^\d{4}-\d{2}$/.test(thangParam) ? thangParam : thangHienTai();
  const { options, scope, isLoading: dangTaiNha } = useNhaSoCheTrongPhamVi();
  const cnParam = searchParams.get('cn') ?? '';
  const idChiNhanh = options.some((o) => o.value === cnParam) ? cnParam : (options[0]?.value ?? '');
  const tenNhaSoChe = options.find((o) => o.value === idChiNhanh)?.label ?? '';

  const datParam = (k: string, v: string) =>
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set(k, v);
        return p;
      },
      { replace: true }
    );

  const { canUpdate, canAdmin } = useBaoCaoNhanCongPermissions();
  const coQuyenKi = canUpdate || canAdmin;
  const { caiDat, isPending: dangTaiCaiDat } = useCaiDatThuongVuot(idChiNhanh);
  const viTriLoai = useViTriKhongThuongVuot();
  const phieuQ = usePhieuThangThuongVuot(idChiNhanh, thang, scope, !scope.isLoading);
  const kiQ = useHeSoLoiThang(idChiNhanh, thang, !scope.isLoading);
  const luuKi = useLuuHeSoLoiThang();
  const [moRong, setMoRong] = useState<string | null>(null);

  const ds = useMemo(
    () => tongHopThuongThang(phieuQ.data ?? [], caiDat, viTriLoai, kiQ.data ?? {}),
    [phieuQ.data, caiDat, viTriLoai, kiQ.data]
  );
  const tong = ds.reduce(
    (s, d) => ({ gio: s.gio + d.gioCong, thung: s.thung + d.thungVuotQuyDoi, truocKi: s.truocKi + d.tienTruocKi, tien: s.tien + d.tien }),
    { gio: 0, thung: 0, truocKi: 0, tien: 0 }
  );
  const isLoading = dangTaiNha || (idChiNhanh !== '' && (phieuQ.isPending || kiQ.isPending || dangTaiCaiDat));

  const renderBody = () => {
    if (isLoading) return <LoadingSpinnerWithText text={t('baoCaoNhanCong.loading')} className="py-10" />;
    if (options.length === 0) return <EmptyState title={t('baoCaoNhanCong.vuot.chuaCoNhaSoChe')} />;
    if (phieuQ.isError || kiQ.isError) return <ErrorState onRetry={() => { void phieuQ.refetch(); void kiQ.refetch(); }} />;
    if (ds.length === 0) return <EmptyState title={t('baoCaoNhanCong.vuot.thangTrong')} />;
    return (
      <div className={cn('overflow-x-auto rounded-lg border border-border transition-opacity', phieuQ.isFetching && 'opacity-60')}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className={cn(th, 'text-left w-10')}>{t('baoCaoNhanCong.vuot.colStt')}</th>
              <th className={cn(th, 'text-left sticky left-0 z-[1] bg-muted min-w-[10rem]')}>{t('baoCaoNhanCong.nsNhom.colHoTen')}</th>
              <th className={cn(th, 'text-left')}>{t('baoCaoNhanCong.vuot.colViTri')}</th>
              <th className={th}>{t('baoCaoNhanCong.vuot.colSoNgay')}</th>
              <th className={th}>{t('baoCaoNhanCong.nv.gioCong')}</th>
              <th className={th}>{t('baoCaoNhanCong.vuot.colThungQuyDoi')}</th>
              <th className={th}>{t('baoCaoNhanCong.vuot.colTruocKi')}</th>
              <th className={th} title={t('baoCaoNhanCong.vuot.kiHint')}>{t('baoCaoNhanCong.vuot.colKi')}</th>
              <th className={cn(th, 'font-semibold text-emerald-600 dark:text-emerald-400')}>{t('baoCaoNhanCong.vuot.colThuong')}</th>
            </tr>
          </thead>
          <tbody>
            {ds.map((d, i) => {
              const mo = moRong === d.khoa;
              return (
                <React.Fragment key={d.khoa}>
                  <tr className="border-b border-border/60 cursor-pointer hover:bg-muted/30" onClick={() => setMoRong(mo ? null : d.khoa)}>
                    <td className={cn(td, 'text-left text-muted-foreground')}>{i + 1}</td>
                    <td className="px-3 py-2 sticky left-0 z-[1] bg-card">
                      <span className="inline-flex items-center gap-1 font-medium">
                        {mo ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {d.ho_ten}
                      </span>
                      <span className="block text-caption text-muted-foreground">{d.chuyen.map((l) => t(`baoCaoNhanCong.chuyen.${l}`)).join(' · ')}</span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{d.vi_tri ?? '—'}</td>
                    <td className={td}>{d.soNgay}</td>
                    <td className={td}>{fmt2(d.gioCong)}</td>
                    <td className={td}>{fmt2(d.thungVuotQuyDoi)}</td>
                    <td className={td}>{formatNumberVN(Math.round(d.tienTruocKi))}</td>
                    <td className={td}>
                      <OKi
                        dong={d}
                        disabled={!coQuyenKi}
                        onLuu={(ki) => luuKi.mutate({ idChiNhanh, thang, khoa: d.khoa, hoTen: d.ho_ten, idNhanVien: d.id_nhan_vien, heSoLoi: ki })}
                      />
                    </td>
                    <td className={cn(td, 'font-semibold text-emerald-600 dark:text-emerald-400')}>{formatNumberVN(d.tien)}</td>
                  </tr>
                  {mo && (
                    <tr className="bg-muted/20">
                      <td />
                      <td colSpan={8} className="px-3 py-2">
                        <table className="text-xs">
                          <thead className="text-muted-foreground">
                            <tr>
                              <th className="pr-4 text-left font-medium">{t('baoCaoNhanCong.vuot.colNgay')}</th>
                              <th className="pr-4 text-left font-medium">{t('baoCaoNhanCong.nsNhom.colChuyen')}</th>
                              <th className="pr-4 text-left font-medium">{t('baoCaoNhanCong.nsNhom.colNhom')}</th>
                              <th className="pr-4 text-right font-medium">{t('baoCaoNhanCong.nv.gioCong')}</th>
                              <th className="pr-4 text-right font-medium">{t('baoCaoNhanCong.vuot.colThungQuyDoi')}</th>
                              <th className="text-right font-medium">{t('baoCaoNhanCong.vuot.colTruocKi')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {d.ngay.map((n, j) => (
                              <tr key={j}>
                                <td className="pr-4">{formatYmdToDisplay(n.ngay)}</td>
                                <td className="pr-4">{t(`baoCaoNhanCong.chuyen.${n.loai_chuyen}`)}</td>
                                <td className="pr-4">{t('baoCaoNhanCong.nsNhom.nhomN', { n: n.soNhom })}</td>
                                <td className="pr-4 text-right tabular-nums">{fmt2(n.gioCong)}</td>
                                <td className="pr-4 text-right tabular-nums">{fmt2(n.thungVuotQuyDoi)}</td>
                                <td className="text-right tabular-nums">{formatNumberVN(Math.round(n.tien))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/60 font-semibold">
              <td className="px-3 py-2" />
              <td className="px-3 py-2 sticky left-0 z-[1] bg-muted" colSpan={3}>
                {t('baoCaoNhanCong.vuot.tongCongNhan', { n: ds.length })}
              </td>
              <td className={td}>{fmt2(tong.gio)}</td>
              <td className={td}>{fmt2(tong.thung)}</td>
              <td className={td}>{formatNumberVN(Math.round(tong.truocKi))}</td>
              <td />
              <td className={cn(td, 'text-emerald-600 dark:text-emerald-400')}>{formatNumberVN(tong.tien)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="shrink-0 flex flex-col gap-2 px-4 py-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative w-full sm:w-[160px]">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="month"
              value={thang}
              onChange={(e) => e.target.value && datParam('thang', e.target.value)}
              aria-label={t('baoCaoNhanCong.vuot.thang')}
              className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
          {options.length > 0 && (
            <div className="w-full sm:w-64">
              <Select options={options} value={idChiNhanh} onChange={(e) => datParam('cn', e.target.value)} aria-label={t('baoCaoNhanCong.vuot.nhaSoChe')} />
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={ds.length === 0}
          onClick={() => void exportThuongVuotThangToXLSX({ ds, thang, tenNhaSoChe, caiDat })}
        >
          <FileSpreadsheet size={14} className="mr-1.5" />
          {t('baoCaoNhanCong.vuot.xuatExcel')}
        </Button>
      </div>
      <p className="shrink-0 m-0 px-4 pt-2 text-caption text-muted-foreground">
        {t('baoCaoNhanCong.vuot.ghiChuThang', {
          nguongPct: formatNumberVN(caiDat.nguongPct, { maxFractionDigits: 2 }),
          donGia: formatNumberVN(caiDat.donGia),
        })}
      </p>
      <div className="flex-1 min-h-0 overflow-auto p-4">{renderBody()}</div>
    </div>
  );
};

export default ThuongVuotThangTab;
