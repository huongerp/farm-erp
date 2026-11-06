/**
 * Export danh sách phiếu kho phân thuốc + tab chi tiết: map + cột ExportDialog.
 */
import type { TFunction } from 'i18next';
import type { PhieuKhoPT, ChiTietPhieuKhoPTFlat } from '../core/types';
import type { ExportColumn, KieuCotXuat } from '../../../../lib/export/dinh-dang-o';

/** Kiểu cột để Excel nhận số/ngày thật — xem `lib/export/dinh-dang-o.ts`. Cột không có ở đây là chữ. */
const KIEU_COT: Record<string, KieuCotXuat> = {
  id: 'text',
  id_phieu_kho: 'text',
  ngay: 'date',
  tg_tao: 'datetime',
  tg_cap_nhat: 'datetime',
  phieu_tg_tao: 'datetime',
  phieu_tg_cap_nhat: 'datetime',
  tong_so_dong: 'number',
  tong_so_luong: 'number',
  tong_tien: 'money',
  so_luong: 'number',
  don_gia: 'money',
  thanh_tien: 'money',
};

export const PHIEU_KHO_PT_LIST_EXPORT_KEYS = [
  'id',
  'so_phieu',
  'ngay',
  'loai',
  'trang_thai',
  'kho_id',
  'ten_kho',
  'kho_den_id',
  'ten_kho_den',
  'mo_ta',
  'trao_doi',
  'nguoi_tao_id',
  'ten_nguoi_tao',
  'id_nguoi_duyet',
  'ten_nguoi_duyet',
  'tg_tao',
  'tg_cap_nhat',
  'tong_so_dong',
  'tong_so_luong',
  'tong_tien',
] as const;

/** Cột giá của danh sách phiếu — chỉ người xem được giá nhập mới có trong file xuất. */
const COT_GIA_LIST: ReadonlySet<string> = new Set(['tong_tien']);
/** Cột giá của tab chi tiết. */
const COT_GIA_CHI_TIET: ReadonlySet<string> = new Set(['don_gia', 'thanh_tien']);

/** Bỏ các khoá giá khỏi một dòng đã map khi người xem không được thấy giá. */
function boCotGia(row: Record<string, unknown>, cotGia: ReadonlySet<string>, xemGia: boolean): Record<string, unknown> {
  if (xemGia) return row;
  const out = { ...row };
  for (const k of cotGia) delete out[k];
  return out;
}

export function mapPhieuKhoPTListRow(p: PhieuKhoPT, xemGia: boolean): Record<string, unknown> {
  return boCotGia({
    id: p.id,
    so_phieu: p.so_phieu ?? '',
    ngay: p.ngay ?? '',
    loai: p.loai ?? '',
    trang_thai: p.trang_thai ?? '',
    kho_id: p.kho_id ?? '',
    ten_kho: p.ten_kho ?? '',
    kho_den_id: p.kho_den_id ?? '',
    ten_kho_den: p.ten_kho_den ?? '',
    mo_ta: p.mo_ta ?? '',
    trao_doi: p.trao_doi ?? '',
    nguoi_tao_id: p.nguoi_tao_id ?? '',
    ten_nguoi_tao: p.ten_nguoi_tao ?? '',
    id_nguoi_duyet: p.id_nguoi_duyet ?? '',
    ten_nguoi_duyet: p.ten_nguoi_duyet ?? '',
    tg_tao: p.tg_tao ?? '',
    tg_cap_nhat: p.tg_cap_nhat ?? '',
    tong_so_dong: p.tong_so_dong ?? 0,
    tong_so_luong: p.tong_so_luong ?? 0,
    tong_tien: p.tong_tien ?? 0,
  }, COT_GIA_LIST, xemGia);
}

export function getExportColumnsPhieuKhoPTList(t: TFunction, xemGia: boolean): ExportColumn[] {
  return PHIEU_KHO_PT_LIST_EXPORT_KEYS.filter((key) => xemGia || !COT_GIA_LIST.has(key)).map((key) => ({
    key,
    label: t(`phieuKhoPhanThuoc.export.list.${key}`),
    type: KIEU_COT[key],
  }));
}

export function exportFileNamePhieuKhoPTDanhSach(): string {
  return 'Phieu_kho_danh_sach';
}

export const CHI_TIET_PHIEU_KHO_PT_EXPORT_KEYS = [
  'id',
  'id_phieu_kho',
  'so_phieu',
  'ngay',
  'loai',
  'kho_id',
  'ten_kho',
  'kho_den_id',
  'ten_kho_den',
  'trang_thai',
  'mo_ta',
  'phieu_tg_tao',
  'phieu_tg_cap_nhat',
  'nguoi_tao_id',
  'ten_nguoi_tao',
  'id_nguoi_duyet',
  'ten_nguoi_duyet',
  'id_hang_hoa',
  'ma_hang',
  'ten_hang',
  'pham_cap',
  'so_luong',
  'don_gia',
  'thanh_tien',
  'don_vi_tinh',
  'so_lot',
  'ghi_chu',
] as const;

export function mapChiTietPhieuKhoPTFlatRow(row: ChiTietPhieuKhoPTFlat, xemGia: boolean): Record<string, unknown> {
  return boCotGia({
    id: row.id,
    id_phieu_kho: row.id_phieu_kho,
    so_phieu: row.so_phieu ?? '',
    ngay: row.ngay ?? '',
    loai: row.loai ?? '',
    kho_id: row.kho_id ?? '',
    ten_kho: row.ten_kho ?? '',
    kho_den_id: row.kho_den_id ?? '',
    ten_kho_den: row.ten_kho_den ?? '',
    trang_thai: row.trang_thai ?? '',
    mo_ta: row.mo_ta ?? '',
    phieu_tg_tao: row.phieu_tg_tao ?? '',
    phieu_tg_cap_nhat: row.phieu_tg_cap_nhat ?? '',
    nguoi_tao_id: row.nguoi_tao_id ?? '',
    ten_nguoi_tao: row.ten_nguoi_tao ?? '',
    id_nguoi_duyet: row.id_nguoi_duyet ?? '',
    ten_nguoi_duyet: row.ten_nguoi_duyet ?? '',
    id_hang_hoa: row.id_hang_hoa ?? '',
    ma_hang: row.ma_hang ?? '',
    ten_hang: row.ten_hang ?? row.ten_hang_hoa ?? '',
    pham_cap: row.pham_cap ?? '',
    so_luong: row.so_luong ?? 0,
    don_gia: row.don_gia ?? '',
    thanh_tien: row.thanh_tien ?? '',
    don_vi_tinh: row.don_vi_tinh ?? '',
    so_lot: row.so_lot ?? '',
    ghi_chu: row.ghi_chu ?? '',
  }, COT_GIA_CHI_TIET, xemGia);
}

export function getExportColumnsChiTietPhieuKhoPT(t: TFunction, xemGia: boolean): ExportColumn[] {
  return CHI_TIET_PHIEU_KHO_PT_EXPORT_KEYS.filter((key) => xemGia || !COT_GIA_CHI_TIET.has(key)).map((key) => ({
    key,
    label: t(`phieuKhoPhanThuoc.export.chiTiet.${key}`),
    type: KIEU_COT[key],
  }));
}

export function exportFileNamePhieuKhoPTChiTiet(): string {
  return 'Phieu_kho_chi_tiet';
}
