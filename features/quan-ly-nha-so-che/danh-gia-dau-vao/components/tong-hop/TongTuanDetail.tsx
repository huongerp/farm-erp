/**
 * Detail tổng tuần (một tuần farm × một chi nhánh, 60rem) của tab «Tổng hợp tuần»: tổng thu / KSC / % KSC +
 * hai bảng — tổ trưởng → lô × ngày (`tongHopTuanTheoLo`) và theo dây / tuần thu hoạch (`tongHopTuanTheoDay`).
 * Đang lọc tổ trưởng → chỉ tính lô của các tổ trưởng đó (ghi trên tiêu đề).
 */
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarRange } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../../components/shared/DetailSection';
import DetailField from '../../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../../components/shared/DetailFieldGrid';
import DetailDrawerFooter from '../../../../../components/shared/DetailDrawerFooter';
import { DRAWER_WIDTH_BAO_CAO_SO_CHE } from '../../../../../lib/dialog-sizes';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import type { TuanFarm } from '../../core/types';
import { nhanCotDay } from '../../core/bang-tinh';
import { nhanTuanFarm } from '../../core/tuan';
import { tongHopTuanTheoDay, tongHopTuanTheoLo, type DgdvDongNgayDay, type DgdvTuanChiNhanhDong, type DgdvTuanDay } from '../../core/tong-hop';
import { useMauDay } from '../../hooks/use-danh-muc-dgdv';
import { nhanTiLeKsc } from '../../utils/export-danh-sach';
import { styleTieuDeCot } from '../../utils/mau-day';
import { BangTongHop, TieuDeBang } from './BangTongHop';
import { TD, TH, W_COT_DAU, fmtO } from './bang-tong-hop';

interface Props {
  tuan: TuanFarm;
  ngays: string[];
  dong: DgdvTuanChiNhanhDong;
  tenChiNhanh: string;
  /** Dòng view tổng ngày × dây của chi nhánh trong tuần (đã lọc tổ trưởng nếu có). */
  rows: readonly DgdvDongNgayDay[];
  tenToTruongLoc: string[];
  onClose: () => void;
}

const TongTuanDetail: React.FC<Props> = ({ tuan, ngays, dong, tenChiNhanh, rows, tenToTruongLoc, onClose }) => {
  const { t } = useTranslation();
  const { mauTheoId } = useMauDay();
  const theoLo = useMemo(() => tongHopTuanTheoLo(rows, ngays, [dong.id_chi_nhanh]), [rows, ngays, dong.id_chi_nhanh]);
  const theoDay = useMemo(() => tongHopTuanTheoDay(rows), [rows]);

  const nhanXeDoi = t('danhGiaDauVao.luoi.xeDoi');
  const nhanDay = useCallback(
    (d: DgdvTuanDay) =>
      d.id_mau_1 == null
        ? t('danhGiaDauVao.luoi.dutDay')
        : nhanCotDay({ id_mau_1: d.id_mau_1, id_mau_2: d.id_mau_2, xe_doi: d.xe_doi }, mauTheoId, nhanXeDoi),
    [t, mauTheoId, nhanXeDoi]
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
    <GenericDrawer
      title={`${nhanTuanFarm(tuan)} · ${tenChiNhanh}`}
      subtitle={
        tenToTruongLoc.length > 0
          ? t('danhGiaDauVao.tongHop.tuanTheoToTruong', { ten: tenToTruongLoc.join(', ') })
          : t('danhGiaDauVao.tongHop.tuanTitle')
      }
      icon={<CalendarRange className="text-primary" size={22} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_SO_CHE}
      footer={<DetailDrawerFooter onClose={onClose} canUpdate={false} canDelete={false} />}
    >
      <div className="space-y-4 pb-2">
        <DetailSection title={t('danhGiaDauVao.tongHop.sectionTongTuan')} icon={<CalendarRange size={14} />} variant="primary">
          <DetailFieldGrid cols={3}>
            <DetailField
              label={t('danhGiaDauVao.store.colTongThu')}
              value={<span className="font-bold tabular-nums text-primary">{formatNumberVN(theoLo.tongThu)}</span>}
            />
            <DetailField
              label={t('danhGiaDauVao.store.colKsc')}
              value={
                <span className="tabular-nums">
                  <span className="font-bold text-rose-600">{formatNumberVN(theoLo.ksc)}</span>
                  <span className="text-muted-foreground"> · {nhanTiLeKsc(theoLo.ksc, theoLo.tongThu)}</span>
                </span>
              }
            />
            <DetailField
              label={t('danhGiaDauVao.tongHop.ngayChuyen')}
              value={t('danhGiaDauVao.tongHop.ngayChuyenGiaTri', { ngay: dong.soNgayCoSo, chuyen: dong.soChuyen })}
            />
          </DetailFieldGrid>
        </DetailSection>

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
                    </td>
                    {g.theoNgay.map((v, i) => (
                      <td key={i} className={cn(TD, 'text-right tabular-nums')}>
                        {fmtO(v)}
                      </td>
                    ))}
                    {oTong(g.tongThu, g.ksc)}
                  </tr>
                  {g.lo.map((lo) => (
                    <tr key={`${lo.id_chi_nhanh}-${lo.id_lo}`}>
                      <td className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-card pl-4')}>{lo.ten_lo ?? '—'}</td>
                      {lo.theoNgay.map((v, i) => (
                        <td key={i} className={cn(TD, 'text-right tabular-nums')}>
                          {fmtO(v)}
                        </td>
                      ))}
                      {oTong(lo.tongThu, lo.ksc)}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr className="bg-muted font-bold">
                <td className={cn(TD, W_COT_DAU, 'sticky left-0 z-10 bg-muted')}>{t('danhGiaDauVao.luoi.tongCong')}</td>
                {theoLo.theoNgay.map((v, i) => (
                  <td key={i} className={cn(TD, 'text-right tabular-nums')}>
                    {formatNumberVN(v)}
                  </td>
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
                    style={
                      d.id_mau_1
                        ? styleTieuDeCot(mauTheoId.get(d.id_mau_1)?.ma_mau ?? null, d.id_mau_2 ? (mauTheoId.get(d.id_mau_2)?.ma_mau ?? null) : null)
                        : undefined
                    }
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
      </div>
    </GenericDrawer>
  );
};

export default TongTuanDetail;
