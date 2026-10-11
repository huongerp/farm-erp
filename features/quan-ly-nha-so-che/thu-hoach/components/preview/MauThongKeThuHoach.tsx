/**
 * Mẫu in báo cáo thống kê thu hoạch: hàng = farm (3 dòng KH / TT / CL), cột = thứ / tuần / tháng.
 * Khổ / lề / cỡ chữ / bề rộng cột do khung PhieuInPage lo.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatNumberVN } from '../../../../../lib/utils';
import { KhungPhieu } from '../../../../../components/shared/phieu-in/PhieuInParts';
import type { CheDoThongKe, FarmDayAgg, PivotThongKe } from '../../core/stats-pivot';

interface Props {
  tieuDe: string;
  moTaLoc: string;
  cheDo: CheDoThongKe;
  pivot: PivotThongKe;
  nhanCot: string[];
  tenFarm: (fk: string) => string;
}

const RONG: FarmDayAgg = { keHoach: 0, thucTe: 0 };
const th = 'border border-gray-400 bg-gray-100 px-1.5 py-1 font-semibold align-middle';
const td = 'border border-gray-300 px-1.5 py-0.5 tabular-nums text-right';

function BaDong({
  nhan,
  o,
  tong,
  cot,
  dam,
}: {
  nhan: React.ReactNode;
  o: (key: string) => FarmDayAgg;
  tong: FarmDayAgg;
  cot: string[];
  dam?: boolean;
}) {
  const { t } = useTranslation();
  const chiTieu: [string, (a: FarmDayAgg) => number][] = [
    [t('thuHoach.stats.abbrKH'), (a) => a.keHoach],
    [t('thuHoach.stats.abbrTT'), (a) => a.thucTe],
    [t('thuHoach.stats.abbrCL'), (a) => a.thucTe - a.keHoach],
  ];
  return (
    <>
      {chiTieu.map(([ten, gia], i) => (
        <tr key={ten} className={cn('break-inside-avoid', dam && 'font-semibold bg-gray-50', i === 2 && 'border-b-2 border-gray-400')}>
          {i === 0 && (
            <td rowSpan={3} className="border border-gray-300 px-1.5 py-0.5 align-top font-semibold">
              {nhan}
            </td>
          )}
          <td className="border border-gray-300 px-1.5 py-0.5 text-gray-600">{ten}</td>
          {cot.map((k) => {
            const v = gia(o(k));
            return (
              <td key={k} className={cn(td, i === 2 && v < 0 && 'text-red-600', i === 2 && v > 0 && 'text-emerald-700')}>
                {formatNumberVN(v)}
              </td>
            );
          })}
          <td className={cn(td, 'font-semibold bg-gray-50')}>{formatNumberVN(gia(tong))}</td>
        </tr>
      ))}
    </>
  );
}

const MauThongKeThuHoach: React.FC<Props> = ({ tieuDe, moTaLoc, cheDo, pivot, nhanCot, tenFarm }) => {
  const { t } = useTranslation();
  const keys = pivot.cot.map((c) => c.key);
  return (
    <KhungPhieu title={tieuDe} subtitle={moTaLoc}>
      {pivot.farmKeys.length === 0 ? (
        <p className="text-center italic text-gray-500 py-6">{t('thuHoach.inThongKe.trong')}</p>
      ) : (
        <table className="w-full border-collapse text-[0.9em]">
          <thead>
            <tr>
              <th className={cn(th, 'text-left')}>{t('thuHoach.stats.colFarm')}</th>
              <th className={cn(th, 'text-left')}>{t('thuHoach.stats.colChiTieu')}</th>
              {nhanCot.map((n, i) => (
                <th key={keys[i]} className={cn(th, 'text-right whitespace-nowrap')}>
                  {n}
                </th>
              ))}
              <th className={cn(th, 'text-right whitespace-nowrap')}>{t('thuHoach.stats.colTotalKy')}</th>
            </tr>
          </thead>
          <tbody>
            {pivot.farmKeys.map((fk) => {
              const line = pivot.matrix.get(fk)!;
              return (
                <BaDong
                  key={fk}
                  nhan={tenFarm(fk)}
                  o={(k) => line.get(k) ?? RONG}
                  tong={pivot.rowTotals.get(fk)!}
                  cot={keys}
                />
              );
            })}
            <BaDong
              nhan={t(`thuHoach.stats.rowTotal.${cheDo}`)}
              o={(k) => pivot.colTotals.get(k) ?? RONG}
              tong={pivot.grandTotal}
              cot={keys}
              dam
            />
          </tbody>
        </table>
      )}
    </KhungPhieu>
  );
};

export default MauThongKeThuHoach;
