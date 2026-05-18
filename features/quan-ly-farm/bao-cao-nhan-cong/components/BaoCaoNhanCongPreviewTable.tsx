/**
 * Bảng chuyền cho in — luôn hiển thị dòng con khi có chi tiết.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoNhanCong, FarmBaoCaoNhanCongCt } from '../core/types';
import {
  chuyenTtLabelByThuTu,
  normalizeChiTietForDisplay,
  sumTongCongQuyDoiPhieu,
  sumTongCongQuyDoiTuChiTiet,
  sumTongGioTangCaTichPhieu,
  sumTongGioTangCaTichTuChiTiet,
  tongCongQuyDoiNgayVaNua,
  tongGioTangCaTichMotDong,
} from '../core/types';
import {
  combinedRowGhiChuAtIndex,
  displayLoaiTotalsOnCt,
  formatGioTbVN,
  hasSubLinesOnCt,
  isSubFormRowEmpty,
  subAlignedRowCount,
  subByLoaiForCtDisplay,
  sumDisplayLoaiTotalsOnRows,
  tongGioCongNgayVaNua,
} from '../core/ct-sub';
import { formatNumberVN } from '../../../../lib/utils';

const thBase = 'border border-gray-300 px-0.5 py-0.5 text-[6pt] font-semibold text-gray-700 bg-gray-50';
const tdBase = 'border border-gray-300 px-0.5 py-0.5 text-[6pt] tabular-nums';
const tdText = `${tdBase} text-left`;
const tdNum = `${tdBase} text-right`;
const tdSub = `${tdBase} text-right text-gray-600 bg-gray-50/80`;
const tdSubLabel = `${tdBase} text-left text-gray-600 bg-gray-50/80`;
const EMPTY = '—';

interface Props {
  data: FarmBaoCaoNhanCong;
}

function LoaiPairCells({ row, loai }: { row: FarmBaoCaoNhanCongCt; loai: 'CN_NGAY' | 'CN_NUA' | 'TANG_CA' }) {
  const { nhanSu, tongGio } = displayLoaiTotalsOnCt(row, loai);
  return (
    <>
      <td className={tdNum}>{formatNumberVN(nhanSu)}</td>
      <td className={tdNum}>{formatGioTbVN(nhanSu, tongGio)}</td>
    </>
  );
}

function pairCellsSub(line: { sl_cong: number; so_gio: number } | undefined) {
  const filled = line != null && !isSubFormRowEmpty(line);
  const sl = Number(line?.sl_cong ?? 0);
  const gio = Number(line?.so_gio ?? 0);
  return (
    <>
      <td className={tdSub}>{filled ? formatNumberVN(sl) : EMPTY}</td>
      <td className={tdSub}>{filled ? formatNumberVN(gio) : EMPTY}</td>
    </>
  );
}

function ChuyenMainRow({
  row,
  tt,
  idx,
}: {
  row: FarmBaoCaoNhanCongCt;
  tt?: string;
  idx?: number;
}) {
  const { t } = useTranslation();
  const labelKey = `baoCaoNhanCong.chuyen.${row.loai_chuyen}` as const;
  const displayTt =
    tt ?? chuyenTtLabelByThuTu(row.thu_tu && row.thu_tu > 0 ? row.thu_tu : (idx ?? 0) + 1);
  const cnNgay = displayLoaiTotalsOnCt(row, 'CN_NGAY');
  const cnNua = displayLoaiTotalsOnCt(row, 'CN_NUA');

  return (
    <tr className="font-semibold bg-white">
      <td className={`${tdNum} text-center text-gray-600`}>{displayTt}</td>
      <td className={tdText}>{t(labelKey)}</td>
      <LoaiPairCells row={row} loai="CN_NGAY" />
      <LoaiPairCells row={row} loai="CN_NUA" />
      <td className={`${tdNum} font-semibold`}>{formatNumberVN(tongCongQuyDoiNgayVaNua(row))}</td>
      <td className={`${tdNum} font-semibold`}>{formatNumberVN(tongGioCongNgayVaNua(cnNgay, cnNua))}</td>
      <LoaiPairCells row={row} loai="TANG_CA" />
      <td className={`${tdNum} font-semibold`}>{formatNumberVN(tongGioTangCaTichMotDong(row))}</td>
      <td className={`${tdText} font-normal`}>{row.ghi_chu?.trim() || EMPTY}</td>
    </tr>
  );
}

function ChuyenSubRows({ row }: { row: FarmBaoCaoNhanCongCt }) {
  const { t } = useTranslation();
  if (!hasSubLinesOnCt(row)) return null;
  const sub = subByLoaiForCtDisplay(row);
  const rowCount = subAlignedRowCount(sub);

  return (
    <>
      {Array.from({ length: rowCount }, (_, i) => {
        const ghiChu = combinedRowGhiChuAtIndex(sub, i);
        return (
          <tr key={`sub-${i}`}>
            <td className={`${tdSub} text-center`}>·</td>
            <td className={tdSubLabel}>{t('baoCaoNhanCong.sub.detailRow', { index: i + 1 })}</td>
            {pairCellsSub(sub.CN_NGAY[i])}
            {pairCellsSub(sub.CN_NUA[i])}
            <td className={tdSub}>{EMPTY}</td>
            <td className={tdSub}>{EMPTY}</td>
            {pairCellsSub(sub.TANG_CA[i])}
            <td className={tdSub}>{EMPTY}</td>
            <td className={`${tdText} text-gray-600`}>{ghiChu || EMPTY}</td>
          </tr>
        );
      })}
    </>
  );
}

function ChuyenBlock({ row, tt, idx }: { row: FarmBaoCaoNhanCongCt; tt?: string; idx?: number }) {
  return (
    <>
      <ChuyenMainRow row={row} tt={tt} idx={idx} />
      <ChuyenSubRows row={row} />
    </>
  );
}

const BaoCaoNhanCongPreviewTable: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const { production, vRow } = normalizeChiTietForDisplay(data.chi_tiet ?? []);
  const ivQuyDoi = sumTongCongQuyDoiTuChiTiet(production);
  const tongQuyDoiPhieu = sumTongCongQuyDoiPhieu(data);
  const ivCnNgay = sumDisplayLoaiTotalsOnRows(production, 'CN_NGAY');
  const ivCnNua = sumDisplayLoaiTotalsOnRows(production, 'CN_NUA');
  const ivTangCa = sumDisplayLoaiTotalsOnRows(production, 'TANG_CA');
  const ivTongGioNgayNua = tongGioCongNgayVaNua(ivCnNgay, ivCnNua);
  const ivTongGioTc = sumTongGioTangCaTichTuChiTiet(production);
  const tongCnNgay = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NGAY');
  const tongCnNua = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'CN_NUA');
  const tongTangCa = sumDisplayLoaiTotalsOnRows(data.chi_tiet ?? [], 'TANG_CA');
  const tongTongGioNgayNua = tongGioCongNgayVaNua(tongCnNgay, tongCnNua);
  const tongTongGioTc = sumTongGioTangCaTichPhieu(data);

  return (
    <table className="w-full border-collapse border border-gray-300 text-gray-900 table-fixed text-[6pt]">
      <thead>
        <tr>
          <th rowSpan={2} className={`${thBase} text-center w-8`}>
            {t('baoCaoNhanCong.form.colTt')}
          </th>
          <th rowSpan={2} className={`${thBase} text-left min-w-[7rem]`}>
            {t('baoCaoNhanCong.form.colChuyen')}
          </th>
          <th colSpan={2} className={`${thBase} text-center`}>
            {t('baoCaoNhanCong.form.colSlNgay')}
          </th>
          <th colSpan={2} className={`${thBase} text-center`}>
            {t('baoCaoNhanCong.form.colSlNua')}
          </th>
          <th rowSpan={2} className={`${thBase} text-right`}>
            {t('baoCaoNhanCong.form.colTongCongQuyDoi')}
          </th>
          <th rowSpan={2} className={`${thBase} text-right`}>
            {t('baoCaoNhanCong.form.colTongGio')}
          </th>
          <th colSpan={2} className={`${thBase} text-center`}>
            {t('baoCaoNhanCong.form.colSlTangCa')}
          </th>
          <th rowSpan={2} className={`${thBase} text-right`}>
            {t('baoCaoNhanCong.form.colTongGioTc')}
          </th>
          <th rowSpan={2} className={`${thBase} text-left`}>
            {t('baoCaoNhanCong.form.colGhiChu')}
          </th>
        </tr>
        <tr>
          <th className={`${thBase} text-right text-[6.5pt] font-medium`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
          <th className={`${thBase} text-right text-[6.5pt] font-medium`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
          <th className={`${thBase} text-right text-[6.5pt] font-medium`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
          <th className={`${thBase} text-right text-[6.5pt] font-medium`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
          <th className={`${thBase} text-right text-[6.5pt] font-medium`}>{t('baoCaoNhanCong.detail.colNhanSu')}</th>
          <th className={`${thBase} text-right text-[6.5pt] font-medium`}>{t('baoCaoNhanCong.form.colGioTb')}</th>
        </tr>
      </thead>
      <tbody>
        {production.map((row, idx) => (
          <ChuyenBlock key={row.id || row.loai_chuyen} row={row} idx={idx} />
        ))}
        <tr className="font-semibold bg-gray-100">
          <td className={`${tdNum} text-center`}>IV</td>
          <td className={tdText}>{t('baoCaoNhanCong.form.rowCongNhanDinhBien')}</td>
          <td className={tdNum}>{formatNumberVN(ivCnNgay.nhanSu)}</td>
          <td className={tdNum}>{formatGioTbVN(ivCnNgay.nhanSu, ivCnNgay.tongGio)}</td>
          <td className={tdNum}>{formatNumberVN(ivCnNua.nhanSu)}</td>
          <td className={tdNum}>{formatGioTbVN(ivCnNua.nhanSu, ivCnNua.tongGio)}</td>
          <td className={tdNum}>{formatNumberVN(ivQuyDoi)}</td>
          <td className={tdNum}>{formatNumberVN(ivTongGioNgayNua)}</td>
          <td className={tdNum}>{formatNumberVN(ivTangCa.nhanSu)}</td>
          <td className={tdNum}>{formatGioTbVN(ivTangCa.nhanSu, ivTangCa.tongGio)}</td>
          <td className={tdNum}>{formatNumberVN(ivTongGioTc)}</td>
          <td className={tdText}>{EMPTY}</td>
        </tr>
        <ChuyenBlock row={vRow} tt="V" />
        <tr className="font-bold bg-gray-200">
          <td className={`${tdText} font-bold`} colSpan={2}>
            {t('baoCaoNhanCong.form.rowTongNgay')}
          </td>
          <td className={tdNum}>{formatNumberVN(tongCnNgay.nhanSu)}</td>
          <td className={tdNum}>{formatGioTbVN(tongCnNgay.nhanSu, tongCnNgay.tongGio)}</td>
          <td className={tdNum}>{formatNumberVN(tongCnNua.nhanSu)}</td>
          <td className={tdNum}>{formatGioTbVN(tongCnNua.nhanSu, tongCnNua.tongGio)}</td>
          <td className={tdNum}>{formatNumberVN(tongQuyDoiPhieu)}</td>
          <td className={tdNum}>{formatNumberVN(tongTongGioNgayNua)}</td>
          <td className={tdNum}>{formatNumberVN(tongTangCa.nhanSu)}</td>
          <td className={tdNum}>{formatGioTbVN(tongTangCa.nhanSu, tongTangCa.tongGio)}</td>
          <td className={tdNum}>{formatNumberVN(tongTongGioTc)}</td>
          <td className={tdText}>{EMPTY}</td>
        </tr>
      </tbody>
    </table>
  );
};

export default BaoCaoNhanCongPreviewTable;
