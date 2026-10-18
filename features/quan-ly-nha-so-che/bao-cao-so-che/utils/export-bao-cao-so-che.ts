/**
 * Xuất báo cáo sơ chế (PDF / DOC / XLSX) — A4 dọc.
 */
import type { FarmBaoCaoSoChe } from '../core/types';
import type { FarmBaoCaoNhanCong } from '../../bao-cao-nhan-cong/core/types';
import type { FarmDuBaoSlDongThung } from '../../du-bao-sl-dong-thung/core/types';
import { findBaoCaoNhanCongByBranchAndDate, findDuBaoSlDongThungByBranchAndDate, extractLaborSnapshotFromBcnc, extractBcncTableGhiChuRows, computeBaoCaoSoCheKpis, buildBaoCaoSoCheKpiThuongPresetSources, enrichBaoCaoSoCheKpiThuongRows } from '../core/bcsc-kpi';
import { SO_LIEU_BUONG_ROW_DEFS, BCSC_SO_LIEU_STT_OFFSET, BCSC_KPI_STT_OFFSET } from '../core/so-lieu-row-meta';
import { enrichPhamCapRowsWithDerived, sumPhamCapDisplayTotals } from '../core/pham-cap-derived';
import { sumTienThuongKpiThuong } from '../core/types';
import { computeKpiPhanTram } from '../../shared/kpi-thuong/types';
import { bcscTrangThaiLabel, getBcscPreviewSignLabels } from '../core/bcsc-preview-layout';
import { formatYmdToDisplay, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';
import { tenFileAnToan } from '../../../../lib/phieu-in/ten-file';

const EMPTY = '—';

function safe(v: string | number | null | undefined): string {
  if (v == null || v === '') return EMPTY;
  return String(v);
}

export function fileName(data: FarmBaoCaoSoChe): string {
  const branch = tenFileAnToan(data.ten_chi_nhanh ?? 'chi_nhanh');
  return `Bao_cao_so_che_${data.ngay}_${branch}_${getTodayISODate()}`;
}

export async function exportBaoCaoSoCheToXLSX(
  data: FarmBaoCaoSoChe,
  bcncList: FarmBaoCaoNhanCong[],
  dbdtList: FarmDuBaoSlDongThung[] = []
): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const status = bcscTrangThaiLabel(data, t);
  const dvtThung = t('baoCaoSoChe.preview.dvtThung');
  const slipU = data.don_vi_tinh?.trim() || dvtThung;

  const bcnc = findBaoCaoNhanCongByBranchAndDate(bcncList, data.ngay, data.id_chi_nhanh);
  const dbsdtRecord = findDuBaoSlDongThungByBranchAndDate(dbdtList, data.ngay, data.id_chi_nhanh);
  const labor = bcnc ? extractLaborSnapshotFromBcnc(bcnc) : null;
  const [g1, g2, g3, g4] = extractBcncTableGhiChuRows(bcnc);
  const hdrChiSo = [
    t('common.phieuIn.stt'),
    t('baoCaoSoChe.preview.colChiSo'),
    t('common.phieuIn.dvt'),
    t('baoCaoSoChe.preview.colGiaTri'),
    t('baoCaoSoChe.preview.colGhiChu'),
  ];
  const phamCapEnriched = enrichPhamCapRowsWithDerived(data.pham_cap ?? []);
  const phamCapTotals = sumPhamCapDisplayTotals(data.pham_cap ?? []);
  const tongThungQD = phamCapTotals.so_thung_quy_doi;
  const kpis = computeBaoCaoSoCheKpis(tongThungQD, bcnc, phamCapTotals.tong_kg, data.tong_luong);
  const kpiThuong = enrichBaoCaoSoCheKpiThuongRows(
    [...(data.kpi_thuong ?? [])].sort((a, b) => a.thu_tu - b.thu_tu),
    buildBaoCaoSoCheKpiThuongPresetSources(
      kpis,
      Number.isFinite(Number(data.danh_gia_loi_qc_pct)) ? Number(data.danh_gia_loi_qc_pct) : null,
      dbsdtRecord,
      phamCapTotals.so_thung
    )
  );
  const tongThuong = sumTienThuongKpiThuong(kpiThuong);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    [],
    [t('baoCaoSoChe.preview.title')],
    [t('baoCaoSoChe.form.ngay'), formatYmdToDisplay(data.ngay?.slice(0, 10))],
    [t('baoCaoSoChe.form.branch'), safe(data.ten_chi_nhanh)],
    [t('baoCaoSoChe.store.colTrangThai'), status],
    [t('baoCaoSoChe.form.donViTinh'), safe(data.don_vi_tinh)],
    [t('baoCaoSoChe.store.colSoChe'), data.tong_buong_so_che],
    [t('baoCaoSoChe.store.colTonDau'), data.sl_buong_ton_dau_ngay],
    [t('baoCaoSoChe.store.colThuHoach'), data.tong_buong_thu_hoach],
    [t('baoCaoSoChe.store.colTonCuoi'), data.sl_buong_ton_cuoi_ngay],
    [t('baoCaoSoChe.store.colNguoiTao'), safe(data.ten_nguoi_tao)],
    ...(data.ghi_chu?.trim() ? [[t('baoCaoSoChe.form.ghiChuPhieu'), data.ghi_chu]] : []),
    [],
    // I. BCNC
    [`I. ${t('baoCaoSoChe.form.sectionBcncTitle')}`],
    hdrChiSo,
    ...(labor
      ? [
          [1, t('baoCaoSoChe.bcnc.tongCongNhanLamViec'), t('baoCaoSoChe.bcnc.dvt.nguoi'), labor.tongCongQuyDoiPhieu, g1],
          [2, t('baoCaoSoChe.bcnc.tongGioCnNgay'),        t('baoCaoSoChe.bcnc.dvt.gio'),     labor.tongGioCnNgay,        g2 === g1 ? '' : g2],
          [3, t('baoCaoSoChe.bcnc.congQdRowIV'),    t('baoCaoSoChe.bcnc.dvt.tongCong'), labor.congQdRowIV,    g3],
          [4, t('baoCaoSoChe.bcnc.tongGioTcRowIV'), t('baoCaoSoChe.bcnc.dvt.gio'),     labor.tongGioTcRowIV, g4],
          [5, t('baoCaoSoChe.bcnc.congQdTongNgay'), t('baoCaoSoChe.bcnc.dvt.tongCong'), labor.congQdTongNgay, '—'],
        ]
      : [['—', t('baoCaoSoChe.bcnc.needNgayChiNhanh')]]),
    [],
    // II. Số liệu buồng
    [`II. ${t('baoCaoSoChe.form.sectionSoCheTitle')}`],
    hdrChiSo,
    ...SO_LIEU_BUONG_ROW_DEFS.map((def, idx) => {
      const val = (data as unknown as Record<string, unknown>)[def.key] as number;
      const meta = data.so_lieu_row_meta?.[def.key];
      const dvt = meta?.don_vi_tinh_phu?.trim() || (def.key === 'danh_gia_loi_qc_pct' ? '%' : slipU);
      return [BCSC_SO_LIEU_STT_OFFSET + idx + 1, t(def.labelKey), dvt, val, meta?.ghi_chu?.trim() || ''];
    }),
    [],
    // III. Phẩm cấp
    [`III. ${t('baoCaoSoChe.form.sectionPhamCapTitle')}`],
    [t('common.phieuIn.stt'), t('baoCaoSoChe.phamCap.colPhamCap'), t('baoCaoSoChe.phamCap.colSoKg'), t('baoCaoSoChe.phamCap.colSoThung'), t('baoCaoSoChe.phamCap.colTongKg'), t('baoCaoSoChe.phamCap.colTyLe'), t('baoCaoSoChe.phamCap.colSoThungQD'), t('baoCaoSoChe.phamCap.colGhiChu')],
    ...phamCapEnriched.map((r, i) => [i + 1, r.ten_pham_cap || '', r.so_tham_chieu, r.so_thung, r.tong_kg, r.ty_le_pct, r.so_thung_quy_doi, r.ghi_chu || '']),
    [
      t('baoCaoSoChe.phamCap.totalRow'), '',
      '',
      phamCapEnriched.reduce((s, r) => s + (r.so_thung ?? 0), 0),
      phamCapEnriched.reduce((s, r) => s + r.tong_kg, 0),
      100,
      phamCapEnriched.reduce((s, r) => s + (r.so_thung_quy_doi ?? 0), 0),
      '',
    ],
    [],
    // IV. KPI tính toán
    [`IV. ${t('baoCaoSoChe.form.sectionNsLuongTitle')}`],
    hdrChiSo,
    [BCSC_KPI_STT_OFFSET + 1, t('baoCaoSoChe.kpi.nsThungCongNgay'),     t('baoCaoSoChe.kpi.dvt.perCong', { dvt: dvtThung }),     kpis.nsThungCongNgay ?? '—'],
    [BCSC_KPI_STT_OFFSET + 2, t('baoCaoSoChe.kpi.nsThungGioCong'),       t('baoCaoSoChe.kpi.dvt.perGio', { dvt: dvtThung }),      kpis.nsThungGioCong ?? '—'],
    [BCSC_KPI_STT_OFFSET + 3, t('baoCaoSoChe.kpi.nsBinhQuanNguoiGio'),   t('baoCaoSoChe.kpi.dvt.perGio', { dvt: t('baoCaoSoChe.preview.dvtKg') }), kpis.nsBinhQuanNguoiGio ?? '—'],
    [BCSC_KPI_STT_OFFSET + 4, t('baoCaoSoChe.kpi.soThungTp'),             dvtThung,                                              kpis.thungThanhPham ?? '—'],
    [BCSC_KPI_STT_OFFSET + 5, t('baoCaoSoChe.kpi.tongLuong'),             t('baoCaoSoChe.kpi.dvt.tongLuong'),                  kpis.tongLuong ?? '—'],
    [BCSC_KPI_STT_OFFSET + 6, t('baoCaoSoChe.kpi.chiPhiNcPerKg'),         t('baoCaoSoChe.kpi.dvt.chiPhiPerKg'),                kpis.chiPhiNhanCongPerKg ?? '—'],
    [],
    // V. KPI/Thưởng
    [`V. ${t('baoCaoSoChe.kpiThuong.sectionTitle')}`],
    [t('common.phieuIn.stt'), t('baoCaoSoChe.kpiThuong.colHangMuc'), t('baoCaoSoChe.kpiThuong.colDvt'), t('baoCaoSoChe.kpiThuong.colMucTieu'), t('baoCaoSoChe.kpiThuong.colThucTe'), '%', t('baoCaoSoChe.kpiThuong.colDanhGia'), t('baoCaoSoChe.kpiThuong.colTienThuong'), t('baoCaoSoChe.kpiThuong.colGhiChu')],
    ...kpiThuong.map((r, i) => {
      const pct =
        r.phan_tram != null && Number.isFinite(Number(r.phan_tram))
          ? Number(r.phan_tram)
          : computeKpiPhanTram(r.muc_tieu, r.thuc_te);
      return [i + 1, r.ten_hang_muc || '', r.don_vi_tinh || '', r.muc_tieu || '', r.thuc_te || '', pct ?? '', r.danh_gia || '', r.tien_thuong, r.ghi_chu || ''];
    }),
    [t('baoCaoSoChe.kpiThuong.rowTongThuong'), '', '', '', '', '', '', tongThuong, ''],
    [],
    // Chữ ký
    getBcscPreviewSignLabels(t),
    [t('baoCaoSoChe.preview.signHint'), t('baoCaoSoChe.preview.signHint'), t('baoCaoSoChe.preview.signHint'), t('baoCaoSoChe.preview.signHint')],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 6 }, { wch: 36 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 22 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo sơ chế');
  XLSX.writeFile(wb, `${fileName(data)}.xlsx`);
}
