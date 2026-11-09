/**
 * Nội dung "Lịch bảo dưỡng thiết bị" — A4 ngang, nhóm theo khu vực → thiết bị.
 * Cột "Ký xác nhận" để trống cho người làm ký tay sau khi thực hiện.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { KhungPhieu } from '../../../../../components/shared/phieu-in/PhieuInParts';
import { cn, formatYmdToDisplay, getTodayISO } from '../../../../../lib/utils';
import { soSanhTheoHan } from '../../core/han';
import type { LichBaoDuongRow } from '../../core/list-types';
import { tinhTrangHanLabel } from '../Badges';

interface Props {
  rows: LichBaoDuongRow[];
  subtitle?: string;
}

interface NhomThietBi {
  idThietBi: string;
  ten: string;
  maTs: string | null;
  rows: LichBaoDuongRow[];
}

interface NhomKhuVuc {
  khuVuc: string | null;
  thietBi: NhomThietBi[];
}

const TH = 'border border-gray-400 px-1.5 py-0.5 font-semibold text-center align-middle';
const TD = 'border border-gray-300 px-1.5 py-0.5 align-top';
const NEN_DAU = { background: '#3B6939', color: '#fff' } as const;

const LichBaoDuongLichIn: React.FC<Props> = ({ rows, subtitle }) => {
  const { t } = useTranslation();
  const homNay = getTodayISO();

  const nhom = useMemo<NhomKhuVuc[]>(() => {
    const theoTb = new Map<string, NhomThietBi>();
    for (const r of rows) {
      const cur = theoTb.get(r.id_thiet_bi);
      if (cur) cur.rows.push(r);
      else
        theoTb.set(r.id_thiet_bi, {
          idThietBi: r.id_thiet_bi,
          ten: r.thiet_bi_ten,
          maTs: r.thiet_bi_ma_ts,
          rows: [r],
        });
    }
    const theoTbArr = [...theoTb.values()].map((tb) => ({
      ...tb,
      rows: [...tb.rows].sort(soSanhTheoHan),
    }));
    theoTbArr.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));

    const theoTen = new Map<string | null, NhomKhuVuc>();
    for (const r of rows) {
      const khuVuc = r.thiet_bi_khu_vuc?.trim() || null;
      const cur = theoTen.get(khuVuc);
      if (cur) {
        if (!cur.thietBi.some((tb) => tb.idThietBi === r.id_thiet_bi)) {
          const tb = theoTbArr.find((x) => x.idThietBi === r.id_thiet_bi)!;
          cur.thietBi.push(tb);
        }
      } else {
        const tb = theoTbArr.find((x) => x.idThietBi === r.id_thiet_bi)!;
        theoTen.set(khuVuc, { khuVuc, thietBi: [tb] });
      }
    }

    return [...theoTen.values()].sort((a, b) => {
      if (a.khuVuc === b.khuVuc) return 0;
      if (!a.khuVuc) return 1;
      if (!b.khuVuc) return -1;
      return a.khuVuc.localeCompare(b.khuVuc, 'vi');
    });
  }, [rows]);

  return (
    <KhungPhieu title={t('baoDuongThietBi.inLich.title').toUpperCase()} subtitle={subtitle}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(TH, 'w-[19%]')} style={NEN_DAU}>{t('baoDuongThietBi.inLich.thietBi')}</th>
            <th className={cn(TH, 'w-[24%]')} style={NEN_DAU}>{t('baoDuongThietBi.col.viec')}</th>
            <th className={cn(TH, 'w-[11%]')} style={NEN_DAU}>{t('baoDuongThietBi.col.chuKy')}</th>
            <th className={cn(TH, 'w-[10%]')} style={NEN_DAU}>{t('baoDuongThietBi.col.lanGanNhat')}</th>
            <th className={cn(TH, 'w-[10%]')} style={NEN_DAU}>{t('baoDuongThietBi.col.hanKeTiep')}</th>
            <th className={cn(TH, 'w-[12%]')} style={NEN_DAU}>{t('baoDuongThietBi.col.tinhTrang')}</th>
            <th className={cn(TH, 'w-[9%]')} style={NEN_DAU}>{t('baoDuongThietBi.inLich.kyXacNhan')}</th>
          </tr>
        </thead>
        <tbody>
          {nhom.length === 0 ? (
            <tr>
              <td colSpan={7} className={cn(TD, 'text-center italic text-gray-500 py-3')}>
                {t('baoDuongThietBi.lich.emptyHint')}
              </td>
            </tr>
          ) : (
            nhom.map((kv) => (
              <React.Fragment key={kv.khuVuc ?? '__khong_khu_vuc'}>
                <tr>
                  <td colSpan={7} className={cn(TD, 'font-semibold')} style={{ background: '#D5E8CE', color: '#1f3d1e' }}>
                    {t('baoDuongThietBi.col.khuVuc')}: {kv.khuVuc ?? t('baoDuongThietBi.inLich.chuaXacDinhKhuVuc')}
                  </td>
                </tr>
                {kv.thietBi.map((tb) =>
                  tb.rows.map((r, i) => (
                    <tr key={r.id}>
                      {i === 0 && (
                        <td rowSpan={tb.rows.length} className={TD}>
                          <div className="font-medium">{tb.ten}</div>
                          {tb.maTs && <div className="text-gray-600 text-[0.9em]">{tb.maTs}</div>}
                        </td>
                      )}
                      <td className={TD}>{r.noi_dung}</td>
                      <td className={cn(TD, 'text-center')}>
                        {r.chu_ky_ngay != null
                          ? t('baoDuongThietBi.chuKy.ngay', { n: r.chu_ky_ngay })
                          : t('baoDuongThietBi.chuKy.khongTheoLich')}
                      </td>
                      <td className={cn(TD, 'text-center tabular-nums')}>{formatYmdToDisplay(r.lan_gan_nhat) || '—'}</td>
                      <td className={cn(TD, 'text-center tabular-nums')}>{formatYmdToDisplay(r.han_ke_tiep) || '—'}</td>
                      <td className={cn(TD, 'text-center')}>{tinhTrangHanLabel(r.han_ke_tiep, homNay, t)}</td>
                      <td className={cn(TD, 'h-9')}>{' '}</td>
                    </tr>
                  ))
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </KhungPhieu>
  );
};

export default LichBaoDuongLichIn;
