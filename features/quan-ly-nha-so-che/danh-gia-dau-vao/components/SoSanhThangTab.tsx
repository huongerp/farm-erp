/**
 * Tab «So sánh tháng» — CHỈ XEM. Chọn 3 / 6 / 12 tháng (kết thúc tháng hiện tại) + chi nhánh. Đọc view
 * `v_fp_farm_dgdv_tong_chuyen` (1 dòng / chuyến, gồm cả tháng liền trước để tính chênh), gom ở
 * core/tong-hop `tongHopThang`. Biểu đồ cột chồng tổng thu theo chi nhánh, nhãn % KSC trên đỉnh cột
 * (một trục — không vẽ trục % thứ hai). Bảng tháng × chi nhánh + Xuất Excel dạng phẳng.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '../../../../components/shared/EmptyState';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import { cn, formatNumberVN, getTodayISO } from '../../../../lib/utils';
import { cacThangKetThuc, khoangTaiThang, tongHopThang, type DgdvThangChiNhanh } from '../core/tong-hop';
import { useDgdvTongChuyen } from '../hooks/use-dgdv-tong-ngay';
import { useDgdvChiNhanhXem } from '../hooks/use-dgdv-chi-nhanh-xem';
import { nhanTiLeKsc } from '../utils/export-danh-sach';
import { cotXuatThang, dongXuatThang, nhanThang } from '../utils/export-tong-hop';
import TongHopToolbar from './tong-hop/TongHopToolbar';
import { BangTongHop, TieuDeBang } from './tong-hop/BangTongHop';
import { TD, TH, fmtO } from './tong-hop/bang-tong-hop';

const SO_THANG = [3, 6, 12] as const;
type SoThang = (typeof SO_THANG)[number];

/** Màu theo chi nhánh — thứ tự cố định theo danh sách chi nhánh trong phạm vi (màu đi theo chi nhánh, không theo hạng). */
const MAU_SERIES = ['#6366f1', '#f59e0b', '#06b6d4', '#ec4899', '#10b981', '#8b5cf6'];
/** Quá số màu → các chi nhánh sau gộp thành «Khác». */
const SO_SERIES_TOI_DA = MAU_SERIES.length;
const KHOA_KHAC = '__khac';
const CHART_HEIGHT = 240;
const axisStyle = { fontSize: 11, fill: 'var(--color-muted-foreground)' };

const soChenh = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumberVN(Math.abs(n))}`;
const ptChenh = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatNumberVN(Math.abs(n), { maxFractionDigits: 1 })}%`;

const SoSanhThangTab: React.FC = () => {
  const { t } = useTranslation();
  const thangNay = getTodayISO().slice(0, 7);
  const [soThang, setSoThang] = useState<SoThang>(6);
  const [idCn, setIdCn] = useState('');
  const [moXuat, setMoXuat] = useState(false);

  const { dsChiNhanh, tenCn, phamVi, thuTuCn, dangTaiPhamVi } = useDgdvChiNhanhXem(idCn || null);
  const dsThang = useMemo(() => cacThangKetThuc(thangNay, soThang), [thangNay, soThang]);
  const khoang = useMemo(() => khoangTaiThang(dsThang), [dsThang]);
  const q = useDgdvTongChuyen(khoang.tu, khoang.den, phamVi, !dangTaiPhamVi);

  const kq = useMemo(() => tongHopThang(q.data ?? [], dsThang, thuTuCn), [q.data, dsThang, thuTuCn]);
  const coSo = kq.tongThang.some((d) => d.soChuyen > 0);
  const nhieuCn = kq.dsChiNhanh.length > 1;

  // ---- Biểu đồ: màu theo vị trí chi nhánh trong phạm vi xem (ổn định khi lọc một chi nhánh) ----
  const viTriMau = useMemo(() => new Map(dsChiNhanh.map((b, i) => [String(b.id), i])), [dsChiNhanh]);
  const series = useMemo(() => {
    const ds = kq.dsChiNhanh.map((id) => ({ khoa: id, ten: tenCn(id), mau: viTriMau.get(id) ?? Infinity }));
    ds.sort((a, b) => a.mau - b.mau);
    if (ds.length <= SO_SERIES_TOI_DA) return ds.map((s, i) => ({ ...s, fill: MAU_SERIES[Number.isFinite(s.mau) ? s.mau % MAU_SERIES.length : i] }));
    return [
      ...ds.slice(0, SO_SERIES_TOI_DA - 1).map((s, i) => ({ ...s, fill: MAU_SERIES[i] })),
      { khoa: KHOA_KHAC, ten: t('danhGiaDauVao.thang.khac'), mau: Infinity, fill: MAU_SERIES[SO_SERIES_TOI_DA - 1] },
    ];
  }, [kq.dsChiNhanh, tenCn, viTriMau, t]);
  const chartData = useMemo(() => {
    const coRieng = new Set(series.map((s) => s.khoa));
    return kq.tongThang.map((tong) => {
      const d: Record<string, string | number> = {
        name: nhanThang(tong.thang, t),
        nhanKsc: tong.tongThu > 0 ? `${t('danhGiaDauVao.luoi.ksc')} ${nhanTiLeKsc(tong.ksc, tong.tongThu)}` : '',
      };
      for (const r of kq.theoChiNhanh) {
        if (r.thang !== tong.thang || r.id_chi_nhanh == null) continue;
        const k = coRieng.has(r.id_chi_nhanh) ? r.id_chi_nhanh : KHOA_KHAC;
        d[k] = Number(d[k] ?? 0) + r.tongThu;
      }
      return d;
    });
  }, [kq, series, t]);

  const exportColumns = useMemo(() => cotXuatThang(t), [t]);
  const exportData = useMemo(() => (moXuat ? dongXuatThang(kq, tenCn, t) : []), [moXuat, kq, tenCn, t]);

  const chonKy = (inline: boolean) => (
    <div role="group" aria-label={t('danhGiaDauVao.thang.soThang')} className={cn('inline-flex rounded-md border border-border p-0.5', inline ? 'w-full' : 'shrink-0')}>
      {SO_THANG.map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={soThang === n}
          onClick={() => setSoThang(n)}
          className={cn(
            'h-8 px-3 rounded text-sm font-medium whitespace-nowrap',
            inline && 'flex-1',
            soThang === n ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'
          )}
        >
          {t('danhGiaDauVao.thang.nThang', { n })}
        </button>
      ))}
    </div>
  );

  const dongBang = (d: DgdvThangChiNhanh, tong: boolean) => (
    <>
      <td className={cn(TD, 'whitespace-nowrap', tong && 'font-semibold')}>
        {d.id_chi_nhanh == null ? t('danhGiaDauVao.thang.tatCaChiNhanh') : tenCn(d.id_chi_nhanh)}
      </td>
      <td className={cn(TD, 'text-right tabular-nums font-semibold', tong && 'text-primary')}>{formatNumberVN(d.tongThu)}</td>
      <td className={cn(TD, 'text-right tabular-nums text-rose-600')}>{fmtO(d.ksc)}</td>
      <td className={cn(TD, 'text-right tabular-nums')}>{nhanTiLeKsc(d.ksc, d.tongThu)}</td>
      <td className={cn(TD, 'text-right tabular-nums')}>{fmtO(d.soChuyen)}</td>
      <td className={cn(TD, 'text-right tabular-nums')}>
        {d.tbThuNgay == null ? '–' : formatNumberVN(d.tbThuNgay, { maxFractionDigits: 0 })}
        {d.soNgayCoNhap > 0 && <span className="ml-1 text-caption text-muted-foreground">{t('danhGiaDauVao.thang.nNgay', { n: d.soNgayCoNhap })}</span>}
      </td>
      <td
        className={cn(
          TD,
          'text-right tabular-nums whitespace-nowrap',
          d.chenh != null && d.chenh > 0 && 'text-emerald-600 dark:text-emerald-400',
          d.chenh != null && d.chenh < 0 && 'text-rose-600'
        )}
      >
        {d.chenh == null || d.chenhPt == null ? '–' : `${soChenh(d.chenh)} (${ptChenh(d.chenhPt)})`}
      </td>
    </>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <TongHopToolbar
        chonKy={chonKy}
        nhanKy={t('danhGiaDauVao.thang.soThang')}
        dsChiNhanh={dsChiNhanh}
        idChiNhanh={idCn}
        onDoiChiNhanh={setIdCn}
        coSo={coSo}
        onXuat={() => setMoXuat(true)}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {q.isPending || dangTaiPhamVi ? (
          <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.loading')}</p>
        ) : q.isError ? (
          <p className="text-sm text-rose-600">{(q.error as Error)?.message}</p>
        ) : !coSo ? (
          <EmptyState title={t('danhGiaDauVao.thang.khongCoDuLieu')} description={t('danhGiaDauVao.bang.khongCoDuLieuHint')} />
        ) : (
          <>
            <section className="space-y-1.5">
              <TieuDeBang>{t('danhGiaDauVao.thang.bieuDo')}</TieuDeBang>
              <div className="rounded-lg border border-border p-2">
                <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                  <BarChart data={chartData} margin={{ top: 20, right: 8, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(v: number) => formatNumberVN(v)} width={56} />
                    <Tooltip content={<ChartTooltip formatValue={(v) => formatNumberVN(v)} />} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
                    {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
                    {series.map((s, i) => (
                      <Bar
                        key={s.khoa}
                        dataKey={s.khoa}
                        name={series.length > 1 ? s.ten : t('danhGiaDauVao.store.colTongThu')}
                        stackId="thu"
                        fill={s.fill}
                        stroke="var(--color-card)"
                        strokeWidth={series.length > 1 ? 2 : 0}
                        maxBarSize={40}
                        radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
                      >
                        {i === series.length - 1 && (
                          <LabelList dataKey="nhanKsc" position="top" style={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} />
                        )}
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="space-y-1.5">
              <TieuDeBang>{t('danhGiaDauVao.thang.bang')}</TieuDeBang>
              <BangTongHop>
                <thead>
                  <tr>
                    <th className={cn(TH, 'sticky left-0 z-20 min-w-[6.5rem] text-left')}>{t('danhGiaDauVao.thang.colThang')}</th>
                    <th className={cn(TH, 'min-w-[9rem] text-left')}>{t('danhGiaDauVao.tuan.colChiNhanh')}</th>
                    <th className={cn(TH, 'min-w-[5.5rem]')}>{t('danhGiaDauVao.store.colTongThu')}</th>
                    <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.store.colKsc')}</th>
                    <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.store.colTiLeKsc')}</th>
                    <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.thang.colSoChuyen')}</th>
                    <th className={cn(TH, 'min-w-[6.5rem]')} title={t('danhGiaDauVao.thang.colTbNgayHint')}>
                      {t('danhGiaDauVao.thang.colTbNgay')}
                    </th>
                    <th className={cn(TH, 'min-w-[9rem]')}>{t('danhGiaDauVao.thang.colChenhGop')}</th>
                  </tr>
                </thead>
                <tbody>
                  {kq.tongThang.map((tong) => {
                    const dsCn = kq.theoChiNhanh.filter((d) => d.thang === tong.thang);
                    const soDong = dsCn.length + (nhieuCn ? 1 : 0);
                    return (
                      <React.Fragment key={tong.thang}>
                        {dsCn.map((d, i) => (
                          <tr key={`${d.thang}-${d.id_chi_nhanh}`}>
                            {i === 0 && (
                              <td rowSpan={soDong} className={cn(TD, 'sticky left-0 z-10 bg-card font-medium align-top whitespace-nowrap')}>
                                {nhanThang(tong.thang, t)}
                              </td>
                            )}
                            {dongBang(d, false)}
                          </tr>
                        ))}
                        {nhieuCn && <tr className="bg-muted/60 border-b-2 border-border">{dongBang(tong, true)}</tr>}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </BangTongHop>
              <p className="m-0 text-caption text-muted-foreground">
                {t('danhGiaDauVao.thang.chuThich', {
                  tiLe: nhanTiLeKsc(
                    kq.tongThang.reduce((s, d) => s + d.ksc, 0),
                    kq.tongThang.reduce((s, d) => s + d.tongThu, 0)
                  ),
                })}
              </p>
            </section>
          </>
        )}
      </div>

      <AnimatePresence>
        {moXuat && (
          <ExportDialog
            open={moXuat}
            onClose={() => setMoXuat(false)}
            columns={exportColumns}
            data={exportData}
            fileName={`danh-gia-dau-vao-thang-${dsThang[0]}_${dsThang[dsThang.length - 1]}`}
            sheetName={t('danhGiaDauVao.tabs.soSanhThang')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SoSanhThangTab;
