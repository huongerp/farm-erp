/**
 * Tab «Tổng hợp tuần» — CHỈ XEM. Chọn tuần farm (‹ › lùi / tiến, mặc định tuần hiện tại) + chi nhánh.
 * Đọc view `v_fp_farm_dgdv_tong_ngay_day` cho 7 ngày T2→CN (đã cộng mọi chuyến), mọi phép gom ở
 * core/tong-hop: bảng tổ trưởng → lô × ngày, bảng theo dây / tuần thu hoạch, và (khi xem tất cả chi nhánh)
 * bảng chi nhánh × ngày. Xuất Excel bảng tổ trưởng → lô dạng phẳng.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from '../../../../components/shared/EmptyState';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import Button from '../../../../components/ui/Button';
import { cn, formatNumberVN, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { nhanCotDay } from '../core/bang-tinh';
import { cacNgayCuaTuanFarm, nhanTuanFarm, soSanhTuan, tuanFarmCuaNgay, tuanKeTiep } from '../core/tuan';
import { tongHopTuanTheoChiNhanh, tongHopTuanTheoDay, tongHopTuanTheoLo, type DgdvTuanDay } from '../core/tong-hop';
import { useDgdvTongNgayDay } from '../hooks/use-dgdv-tong-ngay';
import { useDgdvChiNhanhXem } from '../hooks/use-dgdv-chi-nhanh-xem';
import { useMauDay } from '../hooks/use-danh-muc-dgdv';
import { nhanTiLeKsc } from '../utils/export-danh-sach';
import { cotXuatTuan, dongXuatTuan } from '../utils/export-tong-hop';
import { styleTieuDeCot } from '../utils/mau-day';
import TongHopToolbar from './tong-hop/TongHopToolbar';
import { BangTongHop, TieuDeBang } from './tong-hop/BangTongHop';
import { TD, TH, W_COT_DAU, fmtO } from './tong-hop/bang-tong-hop';

const TongHopTuanTab: React.FC = () => {
  const { t } = useTranslation();
  const homNay = getTodayISO();
  const tuanNay = useMemo(() => tuanFarmCuaNgay(homNay), [homNay]);
  const [tuan, setTuan] = useState(tuanNay);
  const [idCn, setIdCn] = useState('');
  const [moXuat, setMoXuat] = useState(false);

  const { dsChiNhanh, tenCn, phamVi, thuTuCn, dangTaiPhamVi } = useDgdvChiNhanhXem(idCn || null);
  const { mauTheoId } = useMauDay();
  const ngays = useMemo(() => cacNgayCuaTuanFarm(tuan.nam, tuan.tuan), [tuan]);
  const q = useDgdvTongNgayDay(ngays[0], ngays[6], phamVi, !dangTaiPhamVi);

  const rows = useMemo(() => q.data ?? [], [q.data]);
  const theoLo = useMemo(() => tongHopTuanTheoLo(rows, ngays, thuTuCn), [rows, ngays, thuTuCn]);
  const theoDay = useMemo(() => tongHopTuanTheoDay(rows), [rows]);
  const xemTatCa = !idCn && thuTuCn.length > 1;
  const theoCn = useMemo(
    () => (xemTatCa ? tongHopTuanTheoChiNhanh(rows, ngays, thuTuCn) : []),
    [xemTatCa, rows, ngays, thuTuCn]
  );
  const coSo = theoLo.toTruong.length > 0;
  const nhieuCn = new Set(theoLo.toTruong.map((g) => g.id_chi_nhanh)).size > 1;

  const exportColumns = useMemo(() => cotXuatTuan(ngays, t), [ngays, t]);
  const exportData = useMemo(() => (moXuat ? dongXuatTuan(theoLo, tenCn, t) : []), [moXuat, theoLo, tenCn, t]);

  const nhanXeDoi = t('danhGiaDauVao.luoi.xeDoi');
  const nhanDay = useCallback(
    (d: DgdvTuanDay) =>
      d.id_mau_1 == null
        ? t('danhGiaDauVao.luoi.dutDay')
        : nhanCotDay({ id_mau_1: d.id_mau_1, id_mau_2: d.id_mau_2, xe_doi: d.xe_doi }, mauTheoId, nhanXeDoi),
    [t, mauTheoId, nhanXeDoi]
  );

  const chonKy = (inline: boolean) => (
    <div className={cn('inline-flex items-center gap-1', inline ? 'w-full' : 'shrink-0')}>
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0 shrink-0"
        onClick={() => setTuan((x) => tuanKeTiep(x, -1))}
        aria-label={t('danhGiaDauVao.tuan.tuanTruoc')}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <button
        type="button"
        className={cn(
          'h-9 rounded-md border border-border px-2.5 text-sm font-medium tabular-nums whitespace-nowrap hover:bg-muted/50',
          inline && 'flex-1'
        )}
        title={t('danhGiaDauVao.tuan.veTuanNay')}
        onClick={() => setTuan(tuanNay)}
      >
        {nhanTuanFarm(tuan)}
        {soSanhTuan(tuan, tuanNay) === 0 && <span className="ml-1 text-caption text-primary">· {t('danhGiaDauVao.bang.tuanNay')}</span>}
      </button>
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-9 p-0 shrink-0"
        onClick={() => setTuan((x) => tuanKeTiep(x, 1))}
        aria-label={t('danhGiaDauVao.tuan.tuanSau')}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const tieuDeNgay = ngays.map((n, i) => (
    <th key={n} className={cn(TH, 'min-w-[4.5rem]')}>
      <div>{t(`danhGiaDauVao.thu.${i}`)}</div>
      <div className="font-normal text-muted-foreground">{formatYmdToDisplay(n).slice(0, 5)}</div>
    </th>
  ));
  const oTong = (tongThu: number, ksc: number, dam = false) => (
    <>
      <td className={cn(TD, 'text-right tabular-nums', dam ? 'font-bold text-primary' : 'font-semibold')}>{formatNumberVN(tongThu)}</td>
      <td className={cn(TD, 'text-right tabular-nums text-rose-600')}>{fmtO(ksc)}</td>
      <td className={cn(TD, 'text-right tabular-nums')}>{nhanTiLeKsc(ksc, tongThu)}</td>
    </>
  );
  const tieuDeTong = (
    <>
      <th className={cn(TH, 'min-w-[5.5rem]')}>{t('danhGiaDauVao.tuan.colTongTuan')}</th>
      <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.store.colKsc')}</th>
      <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.store.colTiLeKsc')}</th>
    </>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <TongHopToolbar
        chonKy={chonKy}
        nhanKy={t('danhGiaDauVao.tuan.chonTuan')}
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
          <EmptyState title={t('danhGiaDauVao.tuan.khongCoDuLieu')} description={t('danhGiaDauVao.bang.khongCoDuLieuHint')} />
        ) : (
          <>
            <p className="m-0 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold">
              <span>{nhanTuanFarm(tuan)}</span>
              <span>·</span>
              <span>
                {t('danhGiaDauVao.luoi.tongThu')} <span className="text-primary tabular-nums">{formatNumberVN(theoLo.tongThu)}</span>
              </span>
              <span>·</span>
              <span>
                {t('danhGiaDauVao.luoi.ksc')} <span className="text-rose-600 tabular-nums">{formatNumberVN(theoLo.ksc)}</span>
              </span>
              <span>·</span>
              <span className="tabular-nums">{t('danhGiaDauVao.bang.tiLeKsc', { tiLe: nhanTiLeKsc(theoLo.ksc, theoLo.tongThu) })}</span>
            </p>

            <section className="space-y-1.5">
              <TieuDeBang>{t('danhGiaDauVao.tuan.bangLo')}</TieuDeBang>
              <BangTongHop>
                <thead>
                  <tr>
                    <th className={cn(TH, W_COT_DAU, 'sticky left-0 z-20 bg-muted text-left')}>{t('danhGiaDauVao.tuan.colToTruongLo')}</th>
                    {tieuDeNgay}
                    {tieuDeTong}
                  </tr>
                </thead>
                <tbody>
                  {theoLo.toTruong.map((g) => (
                    <React.Fragment key={g.khoa}>
                      <tr className="bg-sky-100 dark:bg-sky-950 font-semibold">
                        <td className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-sky-100 dark:bg-sky-950')}>
                          {g.ten_to_truong ?? t('danhGiaDauVao.luoi.chuaCoToTruong')}
                          {nhieuCn && <span className="ml-1 font-normal text-caption text-muted-foreground">· {tenCn(g.id_chi_nhanh)}</span>}
                        </td>
                        {g.theoNgay.map((v, i) => (
                          <td key={i} className={cn(TD, 'text-right tabular-nums')}>{fmtO(v)}</td>
                        ))}
                        {oTong(g.tongThu, g.ksc)}
                      </tr>
                      {g.lo.map((lo) => (
                        <tr key={`${lo.id_chi_nhanh}-${lo.id_lo}`}>
                          <td className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-card pl-4')}>{lo.ten_lo ?? '—'}</td>
                          {lo.theoNgay.map((v, i) => (
                            <td key={i} className={cn(TD, 'text-right tabular-nums')}>{fmtO(v)}</td>
                          ))}
                          {oTong(lo.tongThu, lo.ksc)}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  <tr className="bg-muted font-bold">
                    <td className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-muted')}>{t('danhGiaDauVao.luoi.tongCong')}</td>
                    {theoLo.theoNgay.map((v, i) => (
                      <td key={i} className={cn(TD, 'text-right tabular-nums')}>{formatNumberVN(v)}</td>
                    ))}
                    {oTong(theoLo.tongThu, theoLo.ksc, true)}
                  </tr>
                </tbody>
              </BangTongHop>
            </section>

            <section className="space-y-1.5">
              <TieuDeBang>{t('danhGiaDauVao.tuan.bangDay')}</TieuDeBang>
              <BangTongHop>
                <thead>
                  <tr>
                    <th className={cn(TH, W_COT_DAU, 'sticky left-0 z-20 bg-muted text-left')}>{t('danhGiaDauVao.tuan.colDay')}</th>
                    <th className={cn(TH, 'min-w-[11rem] text-left')}>{t('danhGiaDauVao.tuan.colTuanThuHoach')}</th>
                    <th className={cn(TH, 'min-w-[5.5rem]')}>{t('danhGiaDauVao.store.colTongThu')}</th>
                    <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.store.colKsc')}</th>
                    <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.store.colTiLeKsc')}</th>
                  </tr>
                </thead>
                <tbody>
                  {theoDay.map((d) => (
                    <tr key={d.khoa}>
                      <td
                        className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-card font-medium')}
                        style={d.id_mau_1 ? styleTieuDeCot(mauTheoId.get(d.id_mau_1)?.ma_mau ?? null, d.id_mau_2 ? (mauTheoId.get(d.id_mau_2)?.ma_mau ?? null) : null) : undefined}
                      >
                        {nhanDay(d)}
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap')}>
                        {d.tuanThuHoach && d.tuanChichBap
                          ? t('danhGiaDauVao.tuan.thCb', { th: d.tuanThuHoach.tuan, cb: d.tuanChichBap.tuan })
                          : d.id_mau_1
                            ? t('danhGiaDauVao.luoi.chuaCoTuan')
                            : ''}
                      </td>
                      {oTong(d.tongThu, d.ksc)}
                    </tr>
                  ))}
                  <tr className="bg-muted font-bold">
                    <td className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-muted')} colSpan={2}>
                      {t('danhGiaDauVao.luoi.tongCong')}
                    </td>
                    {oTong(theoLo.tongThu, theoLo.ksc, true)}
                  </tr>
                </tbody>
              </BangTongHop>
            </section>

            {theoCn.length > 0 && (
              <section className="space-y-1.5">
                <TieuDeBang>{t('danhGiaDauVao.tuan.bangChiNhanh')}</TieuDeBang>
                <BangTongHop>
                  <thead>
                    <tr>
                      <th className={cn(TH, W_COT_DAU, 'sticky left-0 z-20 bg-muted text-left')}>{t('danhGiaDauVao.tuan.colChiNhanh')}</th>
                      {tieuDeNgay}
                      {tieuDeTong}
                    </tr>
                  </thead>
                  <tbody>
                    {theoCn.map((c) => (
                      <tr key={c.id_chi_nhanh}>
                        <td className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-card font-medium')}>{tenCn(c.id_chi_nhanh)}</td>
                        {c.theoNgay.map((v, i) => (
                          <td key={i} className={cn(TD, 'text-right tabular-nums')}>{fmtO(v)}</td>
                        ))}
                        {oTong(c.tongThu, c.ksc)}
                      </tr>
                    ))}
                    <tr className="bg-muted font-bold">
                      <td className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-muted')}>{t('danhGiaDauVao.luoi.tongCong')}</td>
                      {theoLo.theoNgay.map((v, i) => (
                        <td key={i} className={cn(TD, 'text-right tabular-nums')}>{formatNumberVN(v)}</td>
                      ))}
                      {oTong(theoLo.tongThu, theoLo.ksc, true)}
                    </tr>
                  </tbody>
                </BangTongHop>
              </section>
            )}
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
            fileName={`danh-gia-dau-vao-tuan-${tuan.nam}-${String(tuan.tuan).padStart(2, '0')}`}
            sheetName={t('danhGiaDauVao.tabs.tongHopTuan')}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TongHopTuanTab;
