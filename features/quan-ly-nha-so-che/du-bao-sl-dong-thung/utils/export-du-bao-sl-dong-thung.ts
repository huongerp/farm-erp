/**
 * Xuất phiếu dự báo SL đóng thùng (PDF / DOC / XLSX) — A4 dọc.
 */
import type { FarmDuBaoSlDongThung } from '../core/types';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import { dbsdtTrangThaiLabel, getDbsdtPreviewSignLabels } from '../core/dbsdt-preview-layout';
import { formatDateShort, getTodayISODate } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import { useUIStore } from '../../../../store/useStore';

export function fileName(data: FarmDuBaoSlDongThung): string {
  const branch = (data.ten_chi_nhanh ?? 'chi_nhanh')
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\-_]/gi, '');
  return `Du_bao_dong_thung_${data.ngay}_${branch}_${getTodayISODate()}`;
}

export async function exportDuBaoSlDongThungToXLSX(data: FarmDuBaoSlDongThung): Promise<void> {
  const XLSX = await import('xlsx');
  const t = i18n.t.bind(i18n);
  const info = useUIStore.getState().companyInfo;
  const status = dbsdtTrangThaiLabel(data, t);
  const kpi = computeDuBaoSlDongThungKpiFromFarm(data);

  const rows: (string | number)[][] = [
    [info.companyName],
    ...(info.address ? [[t('company.address'), info.address]] : []),
    [],
    [t('duBaoSlDongThung.preview.title')],
    [t('duBaoSlDongThung.form.ngay'), formatDateShort(data.ngay)],
    [t('duBaoSlDongThung.form.branch'), data.ten_chi_nhanh ?? ''],
    [t('duBaoSlDongThung.store.colTrangThai'), status],
    [t('duBaoSlDongThung.store.colNguoiTao'), data.ten_nguoi_tao ?? ''],
    ...(data.ghi_chu?.trim() ? [[t('duBaoSlDongThung.form.ghiChuPhieu'), data.ghi_chu]] : []),
    [],
    [t('duBaoSlDongThung.form.sectionBangTinh')],
    [t('duBaoSlDongThung.form.colStt'), t('duBaoSlDongThung.form.colHangMuc'), t('duBaoSlDongThung.form.colGiaTri'), t('duBaoSlDongThung.form.colDonVi'), t('duBaoSlDongThung.form.colGhiChu')],
    [1, t('duBaoSlDongThung.form.row1'), data.so_buong_can_mau, t('duBaoSlDongThung.form.unitBuong'), t('duBaoSlDongThung.form.row1Note')],
    [2, t('duBaoSlDongThung.form.row2'), data.tong_can_nang_mau, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row2Note')],
    [3, t('duBaoSlDongThung.form.row3'), kpi.can_nang_binh_quan_buong ?? '', t('duBaoSlDongThung.form.unitKgPerBuong'), t('duBaoSlDongThung.form.row3Note')],
    [4, t('duBaoSlDongThung.form.row4'), data.tong_buong_nhap_ke_hoach, t('duBaoSlDongThung.form.unitBuong'), t('duBaoSlDongThung.form.row4Note')],
    [5, t('duBaoSlDongThung.form.row5'), kpi.tong_khoi_luong_ke_hoach, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row5Note')],
    [6, t('duBaoSlDongThung.form.row6'), data.ty_le_thu_hoi_ke_hoach * 100, t('duBaoSlDongThung.form.unitPercent'), t('duBaoSlDongThung.form.row6Note')],
    [7, t('duBaoSlDongThung.form.row7'), kpi.khoi_luong_dong_thung_ke_hoach, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row7Note')],
    [8, t('duBaoSlDongThung.form.row8'), data.quy_cach_dong_thung_ke_hoach, t('duBaoSlDongThung.form.unitKgPerThung'), t('duBaoSlDongThung.form.row8Note')],
    [9, t('duBaoSlDongThung.form.row9'), kpi.tong_so_thung_ke_hoach, t('duBaoSlDongThung.form.unitThung'), t('duBaoSlDongThung.form.row9Note')],
    [10, t('duBaoSlDongThung.form.row10'), data.tong_buong_nhap_thuc_te, t('duBaoSlDongThung.form.unitBuong'), t('duBaoSlDongThung.form.row10Note')],
    [11, t('duBaoSlDongThung.form.row11'), kpi.tong_khoi_luong_thuc_te, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row11Note')],
    [12, t('duBaoSlDongThung.form.row12'), data.ty_le_thu_hoi_thuc_te * 100, t('duBaoSlDongThung.form.unitPercent'), t('duBaoSlDongThung.form.row12Note')],
    [13, t('duBaoSlDongThung.form.row13'), kpi.khoi_luong_dong_thung_thuc_te, t('duBaoSlDongThung.form.unitKg'), t('duBaoSlDongThung.form.row13Note')],
    [14, t('duBaoSlDongThung.form.row14'), data.quy_cach_dong_thung_thuc_te, t('duBaoSlDongThung.form.unitKgPerThung'), t('duBaoSlDongThung.form.row14Note')],
    [15, t('duBaoSlDongThung.form.row15'), kpi.tong_so_thung_thuc_te, t('duBaoSlDongThung.form.unitThung'), t('duBaoSlDongThung.form.row15Note')],
    [],
    getDbsdtPreviewSignLabels(t),
    [t('duBaoSlDongThung.preview.signHint'), t('duBaoSlDongThung.preview.signHint'), t('duBaoSlDongThung.preview.signHint'), t('duBaoSlDongThung.preview.signHint')],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 14 }, { wch: 14 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dự báo đóng thùng');
  XLSX.writeFile(wb, `${fileName(data)}.xlsx`);
}
