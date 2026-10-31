/**
 * Nội dung in phiếu dự báo SL đóng thùng — A4 dọc, khung chuẩn hệ thống (PhieuInParts):
 * tổng quan + bảng 15 dòng + ký tên. Dòng kết quả in đậm (không tô màu — in trắng đen vẫn rõ).
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { getDbsdtPreviewSignLabels } from '../core/dbsdt-preview-layout';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { HangKyTen, KhungPhieu, TD_IN, TH_IN } from '../../../../components/shared/phieu-in/PhieuInParts';
import DuBaoSlDongThungPreviewOverview from './DuBaoSlDongThungPreviewOverview';

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
  const kpi = useMemo(() => computeDuBaoSlDongThungKpiFromFarm(data), [data]);

  const th = `${TH_IN} px-1.5 py-1 text-[8pt]`;
  const td = `${TD_IN} px-1.5 py-1 text-[8pt]`;
  const tdNote = `${td} text-gray-600 text-[7.5pt]`;
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
    { stt: 6, label: t('duBaoSlDongThung.form.row6'), value: fmtPct(data.ty_le_thu_hoi_ke_hoach), unit: '', note: t('duBaoSlDongThung.form.row6Note') },
    { stt: 7, label: t('duBaoSlDongThung.form.row7'), value: fmtNum(kpi.khoi_luong_dong_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row7Note') },
    { stt: 8, label: t('duBaoSlDongThung.form.row8'), value: fmtNum(data.quy_cach_dong_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitKgPerThung'), note: t('duBaoSlDongThung.form.row8Note') },
    { stt: 9, label: t('duBaoSlDongThung.form.row9'), value: fmtNum(kpi.tong_so_thung_ke_hoach), unit: t('duBaoSlDongThung.form.unitThung'), note: t('duBaoSlDongThung.form.row9Note'), highlight: true },
    { stt: 10, label: t('duBaoSlDongThung.form.row10'), value: fmtNum(data.tong_buong_nhap_thuc_te), unit: t('duBaoSlDongThung.form.unitBuong'), note: t('duBaoSlDongThung.form.row10NoteLuu', { tonDau: fmtNum(data.sl_buong_ton_dau_ngay), tonCuoi: fmtNum(data.sl_buong_ton_cuoi_ngay) }) },
    { stt: 11, label: t('duBaoSlDongThung.form.row11'), value: fmtNum(kpi.tong_khoi_luong_thuc_te), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row11Note') },
    { stt: 12, label: t('duBaoSlDongThung.form.row12'), value: fmtPct(data.ty_le_thu_hoi_thuc_te), unit: '', note: t('duBaoSlDongThung.form.row12Note') },
    { stt: 13, label: t('duBaoSlDongThung.form.row13'), value: fmtNum(kpi.khoi_luong_dong_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitKg'), note: t('duBaoSlDongThung.form.row13Note') },
    { stt: 14, label: t('duBaoSlDongThung.form.row14'), value: fmtNum(data.quy_cach_dong_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitKgPerThung'), note: t('duBaoSlDongThung.form.row14Note') },
    { stt: 15, label: t('duBaoSlDongThung.form.row15'), value: fmtNum(kpi.tong_so_thung_thuc_te), unit: t('duBaoSlDongThung.form.unitThung'), note: t('duBaoSlDongThung.form.row15Note'), highlight: true },
  ];

  return (
    <KhungPhieu title={t('duBaoSlDongThung.preview.title')} ngay={formatYmdToDisplay(data.ngay?.slice(0, 10))}>
      {/* === Tổng quan === */}
      <DuBaoSlDongThungPreviewOverview data={data} />

      {/* === Bảng tính 15 dòng === */}
      <div className="mb-3">
        <h2 className="text-[9pt] font-bold uppercase text-gray-900 mb-1">{t('duBaoSlDongThung.form.sectionBangTinh')}</h2>
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
              <tr key={r.stt} className={r.highlight ? 'bg-gray-100 font-bold' : ''}>
                <td className={`${td} text-center`}>{r.stt}</td>
                <td className={td}>{r.label}</td>
                <td className={`${tdR} ${r.highlight ? '' : 'font-medium'}`}>{r.value}</td>
                <td className={td}>{r.unit}</td>
                <td className={tdNote}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <HangKyTen
        className="mt-4"
        labels={getDbsdtPreviewSignLabels(t).map((label, i) => (i === 0 ? { label, ten: data.ten_nguoi_tao } : label))}
      />
    </KhungPhieu>
  );
};

export default DuBaoSlDongThungPreviewContent;
