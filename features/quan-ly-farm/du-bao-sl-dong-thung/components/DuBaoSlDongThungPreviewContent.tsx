/**
 * Nội dung in phiếu dự báo SL đóng thùng — A4 dọc: header + tổng quan + bảng 15 dòng + ký tên.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { dbsdtTrangThaiLabel } from '../core/dbsdt-preview-layout';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import { formatDateShort, formatDateTime, formatNumberVN } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import DuBaoSlDongThungPreviewOverview from './DuBaoSlDongThungPreviewOverview';
import DuBaoSlDongThungPreviewSignFooter from './DuBaoSlDongThungPreviewSignFooter';

interface Props {
  data: FarmDuBaoSlDongThung;
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return formatNumberVN(n);
}

function fmtPct(r: number): string {
  return `${formatNumberVN(Math.round(r * 10000) / 100)}%`;
}

const DuBaoSlDongThungPreviewContent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const trangThaiLabel = dbsdtTrangThaiLabel(data, t);
  const kpi = useMemo(() => computeDuBaoSlDongThungKpiFromFarm(data), [data]);

  const th = 'border border-gray-300 px-1.5 py-1 text-[7.5pt] font-semibold bg-gray-100 text-gray-700';
  const td = 'border border-gray-300 px-1.5 py-1 text-[7.5pt]';
  const tdNote = `${td} text-gray-500 text-[6.5pt]`;
  const tdR = `${td} text-right tabular-nums`;

  type Row = {
    stt: number;
    label: string;
    value: string;
    unit: string;
    note: string;
    highlight?: boolean;
  };

  const rows: Row[] = [
    { stt: 1, label: t('duBaoSlDongThung.form.row1'), value: fmtNum(data.so_buong_can_mau), unit: t('duBaoSlDongThung.form.unitBuong'), note: t('duBaoSlDongThung.form.row1Note') },
    { stt: 2, label: t('duBaoSlDongThung.form.row2'), value: fmtNum(data.tong_can_nang_mau), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row2Note') },
    { stt: 3, label: t('duBaoSlDongThung.form.row3'), value: fmtNum(kpi.can_nang_binh_quan_buong), unit: t('duBaoSlDongThung.form.unitKgPerBuong'), note: t('duBaoSlDongThung.form.row3Note') },
    { stt: 4, label: t('duBaoSlDongThung.form.row4'), value: fmtNum(data.tong_buong_nhap_ke_hoach), unit: t('duBaoSlDongThung.form.unitBuong'), note: t('duBaoSlDongThung.form.row4Note') },
    { stt: 5, label: t('duBaoSlDongThung.form.row5'), value: fmtNum(kpi.tong_khoi_luong_ke_hoach), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row5Note') },
    { stt: 6, label: t('duBaoSlDongThung.form.row6'), value: fmtPct(data.ty_le_thu_hoi_ke_hoach), unit: t('duBaoSlDongThung.form.unitPercent'), note: t('duBaoSlDongThung.form.row6Note') },
    { stt: 7, label: t('duBaoSlDongThung.form.row7'), value: fmtNum(kpi.khoi_luong_dong_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row7Note') },
    { stt: 8, label: t('duBaoSlDongThung.form.row8'), value: fmtNum(data.quy_cach_dong_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitKgPerThung'), note: t('duBaoSlDongThung.form.row8Note') },
    { stt: 9, label: t('duBaoSlDongThung.form.row9'), value: fmtNum(kpi.tong_so_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitThung'), note: t('duBaoSlDongThung.form.row9Note'), highlight: true },
    { stt: 10, label: t('duBaoSlDongThung.form.row10'), value: fmtNum(data.tong_buong_nhap_thuc_te), unit: t('duBaoSlDongThung.form.unitBuong'), note: t('duBaoSlDongThung.form.row10Note') },
    { stt: 11, label: t('duBaoSlDongThung.form.row11'), value: fmtNum(kpi.tong_khoi_luong_thuc_te), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row11Note') },
    { stt: 12, label: t('duBaoSlDongThung.form.row12'), value: fmtPct(data.ty_le_thu_hoi_thuc_te), unit: t('duBaoSlDongThung.form.unitPercent'), note: t('duBaoSlDongThung.form.row12Note') },
    { stt: 13, label: t('duBaoSlDongThung.form.row13'), value: fmtNum(kpi.khoi_luong_dong_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row13Note') },
    { stt: 14, label: t('duBaoSlDongThung.form.row14'), value: fmtNum(data.quy_cach_dong_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitKgPerThung'), note: t('duBaoSlDongThung.form.row14Note') },
    { stt: 15, label: t('duBaoSlDongThung.form.row15'), value: fmtNum(kpi.tong_so_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitThung'), note: t('duBaoSlDongThung.form.row15Note'), highlight: true },
  ];

  return (
    <div
      className="du-bao-sl-dong-thung-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 box-border"
      style={{ minHeight: '297mm' }}
    >
      {/* === Header công ty === */}
      <div className="flex items-start gap-3 pb-3 mb-3 border-b-2 border-gray-300">
        {companyInfo.appLogo && (
          <img src={companyInfo.appLogo} alt="Logo" className="w-14 h-14 object-contain shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[13pt] font-bold text-gray-900 uppercase tracking-tight">
            {companyInfo.companyName}
          </h2>
          {companyInfo.address && (
            <p className="text-[8pt] text-gray-600 mt-0.5">
              {t('company.address')}: {companyInfo.address}
            </p>
          )}
        </div>
      </div>

      {/* === Tiêu đề === */}
      <h1 className="text-center text-[14pt] font-bold mb-1 uppercase">{t('duBaoSlDongThung.preview.title')}</h1>
      <p className="text-center text-[9pt] text-gray-500 mb-3">
        {formatDateShort(data.ngay)}
        {data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''} · {trangThaiLabel}
      </p>

      {/* === Tổng quan === */}
      <DuBaoSlDongThungPreviewOverview data={data} />

      {/* === Bảng tính 15 dòng === */}
      <div className="mb-3">
        <h2 className="text-[9pt] font-semibold text-gray-800 mb-1">{t('duBaoSlDongThung.form.sectionBangTinh')}</h2>
        <table className="w-full border-collapse table-fixed text-left">
          <thead>
            <tr>
              <th className={`${th} w-7 text-center`}>{t('duBaoSlDongThung.form.colStt')}</th>
              <th className={th} style={{ width: '36%' }}>{t('duBaoSlDongThung.form.colHangMuc')}</th>
              <th className={`${th} w-20 text-right`}>{t('duBaoSlDongThung.form.colGiaTri')}</th>
              <th className={`${th} w-20`}>{t('duBaoSlDongThung.form.colDonVi')}</th>
              <th className={th}>{t('duBaoSlDongThung.form.colGhiChu')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.stt}
                className={r.highlight ? 'bg-blue-50' : r.stt % 2 === 0 ? 'bg-gray-50' : ''}
              >
                <td className={`${td} text-center ${r.highlight ? 'font-bold text-blue-700' : 'text-gray-500'}`}>
                  {r.stt}
                </td>
                <td className={`${td} ${r.highlight ? 'font-bold text-blue-700' : ''}`}>{r.label}</td>
                <td className={`${tdR} ${r.highlight ? 'font-bold text-blue-700' : 'font-medium'}`}>{r.value}</td>
                <td className={`${td} ${r.highlight ? 'font-medium text-blue-700' : 'text-gray-500'}`}>{r.unit}</td>
                <td className={tdNote}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === Footer ký tên === */}
      <DuBaoSlDongThungPreviewSignFooter />

      {/* === Thời gian in === */}
      <footer className="mt-auto pt-3 border-t border-gray-200">
        <p className="text-[7pt] text-gray-500 m-0">
          {t('duBaoSlDongThung.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default DuBaoSlDongThungPreviewContent;
