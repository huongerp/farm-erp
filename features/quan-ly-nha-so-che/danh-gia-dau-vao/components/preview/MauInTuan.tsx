/** Mẫu in tổng hợp tuần: chi nhánh × T2–CN, sau đó từng chi nhánh theo tổ trưởng → lô. */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import { KhungPhieu, TD_IN, TH_IN } from '../../../../../components/shared/phieu-in/PhieuInParts';
import { tongHopTuanTheoLo, type DgdvDongNgayDay, type DgdvTuanChiNhanhDong } from '../../core/tong-hop';
import { nhanTiLeKsc } from '../../utils/export-danh-sach';

const th = `${TH_IN} px-1 py-0.5 text-center align-middle`;
const td = `${TD_IN} px-1 py-0.5 align-middle`;
const tdSo = `${td} text-right tabular-nums`;
const fmt = (n: number) => (n === 0 ? '' : formatNumberVN(n));

interface Props {
  tieuDe: string;
  ngays: string[];
  dsDong: DgdvTuanChiNhanhDong[];
  rows: readonly DgdvDongNgayDay[];
  thuTuCn: readonly string[];
  tenCn: (id: string) => string;
}

const MauInTuan: React.FC<Props> = ({ tieuDe, ngays, dsDong, rows, thuTuCn, tenCn }) => {
  const { t } = useTranslation();
  const tong = useMemo(
    () =>
      dsDong.reduce(
        (s, r) => ({ tongThu: s.tongThu + r.tongThu, ksc: s.ksc + r.ksc, theoNgay: s.theoNgay.map((v, i) => v + r.theoNgay[i]) }),
        { tongThu: 0, ksc: 0, theoNgay: ngays.map(() => 0) }
      ),
    [dsDong, ngays]
  );

  return (
    <KhungPhieu title={tieuDe} lapDauTrang>
      {dsDong.length === 0 ? (
        <p className="text-center italic text-gray-500 py-6">{t('danhGiaDauVao.tuan.khongCoDuLieu')}</p>
      ) : (
        <div className="space-y-5">
          <table className="w-full border-collapse text-[0.82em]">
            <thead>
              <tr>
                <th className={cn(th, 'text-left')}>{t('danhGiaDauVao.tuan.colChiNhanh')}</th>
                {ngays.map((ngay, i) => (
                  <th key={ngay} className={th}>{`${t(`danhGiaDauVao.thu.${i}`)} ${formatYmdToDisplay(ngay).slice(0, 5)}`}</th>
                ))}
                <th className={th}>{t('danhGiaDauVao.tuan.colTongTuan')}</th>
                <th className={th}>{t('danhGiaDauVao.store.colKsc')}</th>
                <th className={th}>{t('danhGiaDauVao.store.colTiLeKsc')}</th>
              </tr>
            </thead>
            <tbody>
              {dsDong.map((dong) => (
                <tr key={dong.id_chi_nhanh}>
                  <td className={td}>{tenCn(dong.id_chi_nhanh)}</td>
                  {dong.theoNgay.map((v, i) => <td key={i} className={tdSo}>{fmt(v)}</td>)}
                  <td className={cn(tdSo, 'font-semibold')}>{fmt(dong.tongThu)}</td>
                  <td className={tdSo}>{fmt(dong.ksc)}</td>
                  <td className={tdSo}>{nhanTiLeKsc(dong.ksc, dong.tongThu)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-bold">
                <td className={td}>{t('danhGiaDauVao.luoi.tongCong')}</td>
                {tong.theoNgay.map((v, i) => <td key={i} className={tdSo}>{fmt(v)}</td>)}
                <td className={tdSo}>{fmt(tong.tongThu)}</td>
                <td className={tdSo}>{fmt(tong.ksc)}</td>
                <td className={tdSo}>{nhanTiLeKsc(tong.ksc, tong.tongThu)}</td>
              </tr>
            </tbody>
          </table>

          {dsDong.map((dong) => {
            const tongTheoLo = tongHopTuanTheoLo(rows.filter((r) => r.id_chi_nhanh === dong.id_chi_nhanh), ngays, thuTuCn);
            return (
              <section key={dong.id_chi_nhanh} className="break-inside-avoid space-y-1.5">
                <h2 className="m-0 text-[1em] font-bold uppercase">{tenCn(dong.id_chi_nhanh)}</h2>
                <table className="w-full border-collapse text-[0.82em]">
                  <thead>
                    <tr>
                      <th className={cn(th, 'text-left')}>{t('danhGiaDauVao.tuan.colToTruongLo')}</th>
                      {ngays.map((ngay, i) => <th key={ngay} className={th}>{t(`danhGiaDauVao.thu.${i}`)}</th>)}
                      <th className={th}>{t('danhGiaDauVao.tuan.colTongTuan')}</th>
                      <th className={th}>{t('danhGiaDauVao.store.colKsc')}</th>
                      <th className={th}>{t('danhGiaDauVao.store.colTiLeKsc')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tongTheoLo.toTruong.map((g) => (
                      <React.Fragment key={g.khoa}>
                        <tr className="bg-sky-50 font-semibold">
                          <td className={td}>{g.ten_to_truong ?? t('danhGiaDauVao.luoi.chuaCoToTruong')}</td>
                          {g.theoNgay.map((v, i) => <td key={i} className={tdSo}>{fmt(v)}</td>)}
                          <td className={tdSo}>{fmt(g.tongThu)}</td>
                          <td className={tdSo}>{fmt(g.ksc)}</td>
                          <td className={tdSo}>{nhanTiLeKsc(g.ksc, g.tongThu)}</td>
                        </tr>
                        {g.lo.map((lo) => (
                          <tr key={lo.id_lo}>
                            <td className={cn(td, 'pl-4')}>{lo.ten_lo ?? '—'}</td>
                            {lo.theoNgay.map((v, i) => <td key={i} className={tdSo}>{fmt(v)}</td>)}
                            <td className={tdSo}>{fmt(lo.tongThu)}</td>
                            <td className={tdSo}>{fmt(lo.ksc)}</td>
                            <td className={tdSo}>{nhanTiLeKsc(lo.ksc, lo.tongThu)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className={td}>{t('danhGiaDauVao.luoi.tongCong')}</td>
                      {tongTheoLo.theoNgay.map((v, i) => <td key={i} className={tdSo}>{fmt(v)}</td>)}
                      <td className={tdSo}>{fmt(tongTheoLo.tongThu)}</td>
                      <td className={tdSo}>{fmt(tongTheoLo.ksc)}</td>
                      <td className={tdSo}>{nhanTiLeKsc(tongTheoLo.ksc, tongTheoLo.tongThu)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      )}
    </KhungPhieu>
  );
};

export default MauInTuan;
