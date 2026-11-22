import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronRight, FileSpreadsheet, Lock, LockOpen, Printer } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import EmptyState from '../../../../components/shared/EmptyState';
import ErrorState from '../../../../components/shared/ErrorState';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import { cn, formatDateTime, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { docHeSo, quyVuotNgay, type DongThuongThang } from '../core/thuong-vuot-thung';
import { tongThuongThang } from '../core/chot-thuong-thang';
import { duongDanInThuongThang } from '../core/preview-url';
import {
  useBangThuongThang,
  useChotThangMutation,
  useLuuHeSoLoiThang,
  useMoChotThangMutation,
  useNhaSoCheTrongPhamVi,
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

  const { canUpdate, canAdmin, canChotThuongThang, canMoChotThuongThang } = useBaoCaoNhanCongPermissions();
  const bang = useBangThuongThang(idChiNhanh, thang, scope);
  const { ds, chot, caiDat } = bang;
  const daChot = chot != null;
  const coQuyenKi = (canUpdate || canAdmin) && !daChot;
  const luuKi = useLuuHeSoLoiThang();
  const chotM = useChotThangMutation();
  const moChotM = useMoChotThangMutation();
  const confirm = useConfirmStore((s) => s.confirm);
  const navigate = useNavigate();
  const [moRong, setMoRong] = useState<string | null>(null);

  const tong = useMemo(() => tongThuongThang(ds), [ds]);
  /** Tóm tắt quỹ của một ngày từ KPI Báo cáo sơ chế (tháng đã chốt không tải KPI → «—»). */
  const moTaQuyNgay = (ngay: string) => {
    if (!bang.kpiTheoNgay) return '—';
    const quy = quyVuotNgay(bang.kpiTheoNgay.get(ngay), caiDat);
    if (!quy) return t('baoCaoNhanCong.vuot.quyNgayChuaCo');
    return t(quy.datNs ? 'baoCaoNhanCong.vuot.quyNgayDat' : 'baoCaoNhanCong.vuot.quyNgayKhongDat', {
      vuot: formatNumberVN(quy.thungVuot, { maxFractionDigits: 2 }),
    });
  };
  const isLoading = dangTaiNha || bang.isLoading;
  const thangHienThi = `${thang.slice(5, 7)}/${thang.slice(0, 4)}`;

  const hoiChot = () =>
    confirm({
      title: t('baoCaoNhanCong.vuot.chotTieuDe', { thang: thangHienThi }),
      message: t('baoCaoNhanCong.vuot.chotNoiDung', {
        nhaSoChe: tenNhaSoChe,
        n: ds.length,
        tien: formatNumberVN(tong.tien),
      }),
      variant: 'warning',
      confirmText: t('baoCaoNhanCong.vuot.chotThang'),
      onConfirm: () => chotM.mutateAsync({ idChiNhanh, thang, caiDat, ds }).then(() => undefined),
    });
  const hoiMoChot = () =>
    confirm({
      title: t('baoCaoNhanCong.vuot.moChotTieuDe', { thang: thangHienThi }),
      message: t('baoCaoNhanCong.vuot.moChotNoiDung'),
      variant: 'danger',
      confirmText: t('baoCaoNhanCong.vuot.moChot'),
      onConfirm: () => moChotM.mutateAsync({ idChiNhanh, thang }).then(() => undefined),
    });

  const renderBody = () => {
    if (isLoading) return <LoadingSpinnerWithText text={t('baoCaoNhanCong.loading')} className="py-10" />;
    if (options.length === 0) return <EmptyState title={t('baoCaoNhanCong.vuot.chuaCoNhaSoChe')} />;
    if (bang.isError) return <ErrorState onRetry={bang.refetch} />;
    if (ds.length === 0) return <EmptyState title={t('baoCaoNhanCong.vuot.thangTrong')} />;
    return (
      <div className={cn('overflow-x-auto rounded-lg border border-border transition-opacity', bang.isFetching && 'opacity-60')}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className={cn(th, 'text-left w-10')}>{t('baoCaoNhanCong.vuot.colStt')}</th>
              <th className={cn(th, 'text-left sticky left-0 z-[1] bg-muted min-w-[10rem]')}>{t('baoCaoNhanCong.nsNhom.colHoTen')}</th>
              <th className={cn(th, 'text-left')}>{t('baoCaoNhanCong.vuot.colViTri')}</th>
              <th className={th}>{t('baoCaoNhanCong.vuot.colSoNgay')}</th>
              <th className={th}>{t('baoCaoNhanCong.vuot.colGioTinh')}</th>
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
                              <th className="pr-4 text-left font-medium">{t('baoCaoNhanCong.vuot.colQuyNgay')}</th>
                              <th className="pr-4 text-right font-medium">{t('baoCaoNhanCong.vuot.colGioTinh')}</th>
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
                                <td className="pr-4">{moTaQuyNgay(n.ngay)}</td>
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
        <div className="flex flex-wrap items-center gap-2">
          {!daChot && canChotThuongThang && (
            <Button type="button" size="sm" disabled={ds.length === 0 || isLoading || chotM.isPending} onClick={hoiChot}>
              <Lock size={14} className="mr-1.5" />
              {t('baoCaoNhanCong.vuot.chotThang')}
            </Button>
          )}
          {daChot && canMoChotThuongThang && (
            <Button type="button" variant="outline" size="sm" disabled={moChotM.isPending} onClick={hoiMoChot}>
              <LockOpen size={14} className="mr-1.5" />
              {t('baoCaoNhanCong.vuot.moChot')}
            </Button>
          )}
          {ds.length > 0 && idChiNhanh !== '' && (
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(duongDanInThuongThang(idChiNhanh, thang))}>
              <Printer size={14} className="mr-1.5" />
              {t('baoCaoNhanCong.vuot.inBangThuong')}
            </Button>
          )}
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
      </div>
      {daChot && (
        <p className="shrink-0 m-0 mx-4 mt-3 flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Lock size={14} className="shrink-0" />
          {t('baoCaoNhanCong.vuot.daChotBoi', {
            nguoi: chot.nguoiChot ?? '—',
            luc: formatDateTime(chot.tgChot),
          })}
        </p>
      )}
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
