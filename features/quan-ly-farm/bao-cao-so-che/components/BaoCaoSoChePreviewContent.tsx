/**
 * Nội dung in báo cáo sơ chế A4 dọc — header công ty + tổng quan + các section + chữ ký.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmBaoCaoSoChe } from '../core/types';
import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import { bcscTrangThaiLabel } from '../core/bcsc-preview-layout';
import {
  findBaoCaoNhanCongByBranchAndDate,
  extractLaborSnapshotFromBcnc,
  extractBcncTableGhiChuRows,
  computeBaoCaoSoCheKpis,
} from '../core/bcsc-kpi';
import {
  SO_LIEU_BUONG_ROW_DEFS,
  BCSC_SO_LIEU_STT_OFFSET,
  BCSC_KPI_STT_OFFSET,
} from '../core/so-lieu-row-meta';
import { enrichPhamCapRowsWithDerived, sumPhamCapDisplayTotals } from '../core/pham-cap-derived';
import { sumTienThuongKpiThuong } from '../core/types';
import { computeKpiPhanTram } from '../../shared/kpi-thuong/types';
import { formatDateShort, formatDateTime, formatNumberVN } from '../../../../lib/utils';
import { useUIStore } from '../../../../store/useStore';
import BaoCaoSoChePreviewOverview from './BaoCaoSoChePreviewOverview';
import BaoCaoSoChePreviewSignFooter from './BaoCaoSoChePreviewSignFooter';

interface Props {
  data: FarmBaoCaoSoChe;
  bcncList: FarmBaoCaoNhanCong[];
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return formatNumberVN(n);
}

/** Bảng chỉ số dạng in (5 cột: TT / Chỉ số / ĐVT / Giá trị / Ghi chú). */
function MetricTablePrint({
  sectionTitle,
  rows,
}: {
  sectionTitle: string;
  rows: { stt: number; chiSo: string; dvt: string; giaTri: string; ghiChu: string }[];
}) {
  const thStyle = 'border border-gray-300 px-1.5 py-1 text-[7.5pt] font-semibold bg-gray-100 text-gray-700';
  const tdStyle = 'border border-gray-300 px-1.5 py-1 text-[7.5pt]';
  return (
    <div className="bcsc-section mb-3">
      <h2 className="text-[9pt] font-semibold text-gray-800 mb-1">{sectionTitle}</h2>
      <table className="w-full border-collapse table-fixed text-left">
        <thead>
          <tr>
            <th className={`${thStyle} w-8 text-center`}>TT</th>
            <th className={`${thStyle}`} style={{ width: '35%' }}>Chỉ số</th>
            <th className={`${thStyle} w-20`}>ĐVT</th>
            <th className={`${thStyle} w-20 text-right`}>Giá trị</th>
            <th className={thStyle}>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.stt} className="even:bg-gray-50">
              <td className={`${tdStyle} text-center text-gray-500`}>{r.stt}</td>
              <td className={tdStyle}>{r.chiSo}</td>
              <td className={`${tdStyle} text-gray-500`}>{r.dvt}</td>
              <td className={`${tdStyle} text-right font-medium tabular-nums`}>{r.giaTri}</td>
              <td className={`${tdStyle} text-gray-500 whitespace-pre-wrap`}>{r.ghiChu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const BaoCaoSoChePreviewContent: React.FC<Props> = ({ data, bcncList }) => {
  const { t } = useTranslation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const printedAt = formatDateTime(new Date());
  const trangThaiLabel = bcscTrangThaiLabel(data, t);
  const slipU = data.don_vi_tinh?.trim() || 'thùng';

  const bcnc = useMemo(
    () => findBaoCaoNhanCongByBranchAndDate(bcncList, data.ngay, data.id_chi_nhanh),
    [bcncList, data.ngay, data.id_chi_nhanh]
  );
  const labor = useMemo(() => (bcnc ? extractLaborSnapshotFromBcnc(bcnc) : null), [bcnc]);
  const bcncGhiChu = useMemo(() => extractBcncTableGhiChuRows(bcnc), [bcnc]);
  const phamCapEnriched = useMemo(() => enrichPhamCapRowsWithDerived(data.pham_cap ?? []), [data.pham_cap]);
  const tongThungQD = useMemo(
    () => sumPhamCapDisplayTotals(data.pham_cap ?? []).so_thung_quy_doi,
    [data.pham_cap]
  );
  const kpis = useMemo(
    () => computeBaoCaoSoCheKpis(tongThungQD, bcnc),
    [tongThungQD, bcnc]
  );
  const kpiThuongSorted = useMemo(
    () => [...(data.kpi_thuong ?? [])].sort((a, b) => a.thu_tu - b.thu_tu),
    [data.kpi_thuong]
  );
  const tongThuong = sumTienThuongKpiThuong(kpiThuongSorted);

  // ---- Rows BCNC ----
  const [g1, g2, g3, g4] = bcncGhiChu;
  const bcncRows = labor
    ? [
        { stt: 1, chiSo: t('baoCaoSoChe.bcnc.tongCongNhanLamViec'), dvt: t('baoCaoSoChe.bcnc.dvt.nguoi'), giaTri: fmtNum(labor.tongCongQuyDoiPhieu), ghiChu: g1 },
        { stt: 2, chiSo: t('baoCaoSoChe.bcnc.tongGioCnNgay'),        dvt: t('baoCaoSoChe.bcnc.dvt.gio'),     giaTri: fmtNum(labor.tongGioCnNgay),        ghiChu: g2 },
        { stt: 3, chiSo: t('baoCaoSoChe.bcnc.congQdRowIV'),    dvt: t('baoCaoSoChe.bcnc.dvt.tongCong'), giaTri: fmtNum(labor.congQdRowIV),    ghiChu: g3 },
        { stt: 4, chiSo: t('baoCaoSoChe.bcnc.tongGioTcRowIV'), dvt: t('baoCaoSoChe.bcnc.dvt.gio'),     giaTri: fmtNum(labor.tongGioTcRowIV), ghiChu: g4 },
      ]
    : [];

  // ---- Rows số liệu buồng ----
  const soLieuRows = SO_LIEU_BUONG_ROW_DEFS.map((def, idx) => {
    const val = (data as Record<string, unknown>)[def.key] as number;
    const meta = data.so_lieu_row_meta?.[def.key];
    const dvt = meta?.don_vi_tinh_phu?.trim() || (def.key === 'danh_gia_loi_qc_pct' ? '%' : slipU);
    return {
      stt: BCSC_SO_LIEU_STT_OFFSET + idx + 1,
      chiSo: t(def.labelKey),
      dvt,
      giaTri: fmtNum(val),
      ghiChu: meta?.ghi_chu?.trim() || '—',
    };
  });

  // ---- Rows KPI tính toán ----
  const o = BCSC_KPI_STT_OFFSET;
  const kpiCalcRows = [
    { stt: o + 1, chiSo: t('baoCaoSoChe.kpi.nsThungCongNgay'),     dvt: t('baoCaoSoChe.kpi.dvt.perCong', { dvt: 'Thùng' }),     giaTri: fmtNum(kpis.nsThungCongNgay),     ghiChu: '—' },
    { stt: o + 2, chiSo: t('baoCaoSoChe.kpi.nsThungGioCong'),       dvt: t('baoCaoSoChe.kpi.dvt.perGio', { dvt: 'Thùng' }),      giaTri: fmtNum(kpis.nsThungGioCong),      ghiChu: '—' },
    { stt: o + 3, chiSo: t('baoCaoSoChe.kpi.nsBinhQuanNguoiGio'),   dvt: t('baoCaoSoChe.kpi.dvt.perCongGio', { dvt: 'Thùng' }), giaTri: fmtNum(kpis.nsBinhQuanNguoiGio), ghiChu: '—' },
    { stt: o + 4, chiSo: t('baoCaoSoChe.kpi.soThungTp'),             dvt: 'Thùng',                                                giaTri: fmtNum(kpis.thungThanhPham),      ghiChu: '—' },
    { stt: o + 5, chiSo: t('baoCaoSoChe.kpi.tongLuong'),             dvt: t('baoCaoSoChe.kpi.dvt.tongLuong'),                   giaTri: fmtNum(kpis.tongLuong),           ghiChu: '—' },
    { stt: o + 6, chiSo: t('baoCaoSoChe.kpi.chiPhiNcPerKg'),         dvt: t('baoCaoSoChe.kpi.dvt.chiPhiPerKg'),                giaTri: fmtNum(kpis.chiPhiNhanCongPerKg), ghiChu: '—' },
  ];

  const tdPrint = 'border border-gray-300 px-1.5 py-1 text-[7.5pt]';
  const thPrint = `${tdPrint} font-semibold bg-gray-100 text-gray-700`;

  return (
    <div className="bao-cao-so-che-preview-content bg-white text-gray-900 font-sans text-[10pt] p-5 box-border"
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
      <h1 className="text-center text-[14pt] font-bold mb-1 uppercase">{t('baoCaoSoChe.preview.title')}</h1>
      <p className="text-center text-[9pt] text-gray-500 mb-3">
        {formatDateShort(data.ngay)}
        {data.ten_chi_nhanh ? ` · ${data.ten_chi_nhanh}` : ''} · {trangThaiLabel}
      </p>

      {/* === Tổng quan === */}
      <BaoCaoSoChePreviewOverview data={data} />

      {/* === I. Báo cáo nhân công === */}
      {bcncRows.length > 0 ? (
        <MetricTablePrint
          sectionTitle={`I. ${t('baoCaoSoChe.form.sectionBcncTitle')}`}
          rows={bcncRows}
        />
      ) : (
        <div className="bcsc-section mb-3">
          <h2 className="text-[9pt] font-semibold text-gray-800 mb-1">{`I. ${t('baoCaoSoChe.form.sectionBcncTitle')}`}</h2>
          <p className="text-[8pt] text-gray-500">{t('baoCaoSoChe.bcnc.needNgayChiNhanh')}</p>
        </div>
      )}

      {/* === II. Số liệu buồng === */}
      <MetricTablePrint
        sectionTitle={`II. ${t('baoCaoSoChe.form.sectionSoCheTitle')}`}
        rows={soLieuRows}
      />

      {/* === III. Phẩm cấp / loại thùng === */}
      <div className="bcsc-section mb-3">
        <h2 className="text-[9pt] font-semibold text-gray-800 mb-1">{`III. ${t('baoCaoSoChe.form.sectionPhamCapTitle')}`}</h2>
        {phamCapEnriched.length === 0 ? (
          <p className="text-[8pt] text-gray-500">{t('baoCaoSoChe.phamCap.detailEmpty')}</p>
        ) : (
          <table className="w-full border-collapse table-fixed text-left">
            <thead>
              <tr>
                <th className={`${thPrint} w-7 text-center`}>TT</th>
                <th className={thPrint} style={{ width: '28%' }}>{t('baoCaoSoChe.phamCap.colPhamCap')}</th>
                <th className={`${thPrint} text-right`}>{t('baoCaoSoChe.phamCap.colSoKg')}</th>
                <th className={`${thPrint} text-right`}>{t('baoCaoSoChe.phamCap.colSoThung')}</th>
                <th className={`${thPrint} text-right`}>{t('baoCaoSoChe.phamCap.colTongKg')}</th>
                <th className={`${thPrint} text-right`}>{t('baoCaoSoChe.phamCap.colTyLe')}</th>
                <th className={`${thPrint} text-right`}>{t('baoCaoSoChe.phamCap.colSoThungQD')}</th>
              </tr>
            </thead>
            <tbody>
              {phamCapEnriched.map((r, i) => (
                <tr key={i} className="even:bg-gray-50">
                  <td className={`${tdPrint} text-center text-gray-500`}>{i + 1}</td>
                  <td className={tdPrint}>{r.ten_pham_cap?.trim() || '—'}</td>
                  <td className={`${tdPrint} text-right tabular-nums`}>{fmtNum(r.so_tham_chieu)}</td>
                  <td className={`${tdPrint} text-right tabular-nums`}>{fmtNum(r.so_thung)}</td>
                  <td className={`${tdPrint} text-right tabular-nums font-medium`}>{fmtNum(r.tong_kg)}</td>
                  <td className={`${tdPrint} text-right tabular-nums`}>
                    {r.ty_le_pct > 0 ? `${fmtNum(r.ty_le_pct)}%` : '—'}
                  </td>
                  <td className={`${tdPrint} text-right tabular-nums`}>{fmtNum(r.so_thung_quy_doi)}</td>
                </tr>
              ))}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={2} className={`${tdPrint} text-right`}>{t('baoCaoSoChe.phamCap.totalRow')}</td>
                <td className={`${tdPrint} text-right tabular-nums`}></td>
                <td className={`${tdPrint} text-right tabular-nums`}>{fmtNum(phamCapEnriched.reduce((s, r) => s + (r.so_thung ?? 0), 0))}</td>
                <td className={`${tdPrint} text-right tabular-nums`}>{fmtNum(phamCapEnriched.reduce((s, r) => s + r.tong_kg, 0))}</td>
                <td className={`${tdPrint} text-right tabular-nums`}>100%</td>
                <td className={`${tdPrint} text-right tabular-nums`}>{fmtNum(phamCapEnriched.reduce((s, r) => s + (r.so_thung_quy_doi ?? 0), 0))}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* === IV. Năng suất & lương === */}
      <MetricTablePrint
        sectionTitle={`IV. ${t('baoCaoSoChe.form.sectionNsLuongTitle')}`}
        rows={kpiCalcRows}
      />

      {/* === V. Đánh giá KPI / Thưởng === */}
      <div className="bcsc-section mb-3">
        <h2 className="text-[9pt] font-semibold text-gray-800 mb-1">{`V. ${t('baoCaoSoChe.kpiThuong.sectionTitle')}`}</h2>
        {kpiThuongSorted.length === 0 ? (
          <p className="text-[8pt] text-gray-500">{t('baoCaoSoChe.kpiThuong.emptyDetail')}</p>
        ) : (
          <table className="w-full border-collapse table-fixed text-left">
            <thead>
              <tr>
                <th className={`${thPrint} w-7 text-center`}>TT</th>
                <th className={thPrint} style={{ width: '28%' }}>{t('baoCaoSoChe.kpiThuong.colHangMuc')}</th>
                <th className={`${thPrint} w-14`}>{t('baoCaoSoChe.kpiThuong.colDvt')}</th>
                <th className={`${thPrint} w-16 text-right`}>{t('baoCaoSoChe.kpiThuong.colMucTieu')}</th>
                <th className={`${thPrint} w-16 text-right`}>{t('baoCaoSoChe.kpiThuong.colThucTe')}</th>
                <th className={`${thPrint} w-14 text-right`}>{t('baoCaoSoChe.kpiThuong.colPhanTram')}</th>
                <th className={`${thPrint} w-16`}>{t('baoCaoSoChe.kpiThuong.colDanhGia')}</th>
                <th className={`${thPrint} w-20 text-right`}>{t('baoCaoSoChe.kpiThuong.colTienThuong')}</th>
                <th className={thPrint}>{t('baoCaoSoChe.kpiThuong.colGhiChu')}</th>
              </tr>
            </thead>
            <tbody>
              {kpiThuongSorted.map((r, i) => {
                const pct = computeKpiPhanTram(r.muc_tieu, r.thuc_te);
                const tienCls = r.tien_thuong > 0 ? 'color:#16a34a' : r.tien_thuong < 0 ? 'color:#dc2626' : '';
                return (
                  <tr key={r.id || i} className="even:bg-gray-50">
                    <td className={`${tdPrint} text-center text-gray-500`}>{i + 1}</td>
                    <td className={tdPrint}>{r.ten_hang_muc?.trim() || '—'}</td>
                    <td className={`${tdPrint} text-gray-500`}>{r.don_vi_tinh?.trim() || '—'}</td>
                    <td className={`${tdPrint} text-right tabular-nums`}>{r.muc_tieu?.trim() || '—'}</td>
                    <td className={`${tdPrint} text-right tabular-nums`}>{r.thuc_te?.trim() || '—'}</td>
                    <td className={`${tdPrint} text-right tabular-nums`}>
                      {pct != null ? `${fmtNum(pct)}%` : '—'}
                    </td>
                    <td className={tdPrint} style={{
                      color: r.danh_gia?.trim() === 'Đạt' ? '#16a34a'
                           : r.danh_gia?.trim() === 'Không đạt' ? '#dc2626'
                           : undefined,
                      fontWeight: r.danh_gia?.trim() === 'Đạt' || r.danh_gia?.trim() === 'Không đạt' ? 600 : undefined,
                    }}>
                      {r.danh_gia?.trim() || '—'}
                    </td>
                    <td className={`${tdPrint} text-right tabular-nums font-medium`} style={{ ...(tienCls ? { color: r.tien_thuong > 0 ? '#16a34a' : '#dc2626' } : {}) }}>
                      {formatNumberVN(r.tien_thuong)}
                    </td>
                    <td className={`${tdPrint} text-gray-500 whitespace-pre-wrap`}>{r.ghi_chu?.trim() || '—'}</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-semibold">
                <td colSpan={7} className={`${tdPrint} text-right`}>{t('baoCaoSoChe.kpiThuong.rowTongThuong')}</td>
                <td className={`${tdPrint} text-right tabular-nums`}>{formatNumberVN(tongThuong)}</td>
                <td className={tdPrint} />
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* === Footer ký tên === */}
      <BaoCaoSoChePreviewSignFooter />

      {/* === Thời gian in === */}
      <footer className="mt-auto pt-3 border-t border-gray-200">
        <p className="text-[7pt] text-gray-500 m-0">
          {t('baoCaoSoChe.preview.printedAt')} {printedAt}
        </p>
      </footer>
    </div>
  );
};

export default BaoCaoSoChePreviewContent;
