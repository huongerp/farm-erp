/**
 * Xuất danh sách tài sản ra Excel / PDF (tab Danh sách).
 * Đủ cột theo bảng fp_ts_tai_san, dễ mở rộng thêm trường (Thương hiệu, Model, Xuất xứ, Nhà cung cấp đã có).
 */
import type { TaiSan } from '../core/types';
import { formatDate, formatCurrency } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';

/** Một dòng xuất – đủ trường theo bảng, dạng get dữ liệu để xuất, có thể thêm cột mới. */
export interface TaiSanExportRow {
  ma_tai_san: string;
  ten_tai_san: string;
  ten_nhom: string;
  ten_noi_luu: string;
  ten_chi_nhanh: string;
  ten_trang_thai: string;
  thuong_hieu: string;
  model: string;
  serial: string;
  xuat_xu: string;
  ma_barcode: string;
  ten_nha_cung_cap: string;
  ten_nguoi_tao: string;
  ten_nguoi_dang_giu: string;
  ngay_nhap: string;
  nguyen_gia: string;
  ngay_bat_dau_trich_khau_hao: string;
  gia_tri_con_lai: string;
  khau_hao_luy_ke: string;
  ghi_chu: string;
  trang_thai: string;
}

const t = i18n.t.bind(i18n);

/** Thứ tự cột khi xuất Excel (key → label). Dễ thêm cột mới bằng cách bổ sung vào đây và vào TaiSanExportRow + taiSanToExportRow. */
export const TAI_SAN_EXPORT_COLUMNS: { key: keyof TaiSanExportRow; label: string }[] = [
  { key: 'ma_tai_san', label: t('danhSachTaiSan.store.maCol') },
  { key: 'ten_tai_san', label: t('danhSachTaiSan.store.tenCol') },
  { key: 'ten_nhom', label: t('danhSachTaiSan.store.nhomCol') },
  { key: 'ten_noi_luu', label: t('danhSachTaiSan.store.noiLuuCol') },
  { key: 'ten_chi_nhanh', label: t('danhSachTaiSan.store.chiNhanhCol') },
  { key: 'ten_trang_thai', label: t('danhSachTaiSan.store.trangThaiCol') },
  { key: 'thuong_hieu', label: t('danhSachTaiSan.store.thuongHieuCol') },
  { key: 'model', label: t('danhSachTaiSan.store.modelCol') },
  { key: 'serial', label: t('danhSachTaiSan.store.serialCol') },
  { key: 'xuat_xu', label: t('danhSachTaiSan.store.xuatXuCol') },
  { key: 'ma_barcode', label: t('danhSachTaiSan.store.maBarcodeCol') },
  { key: 'ten_nha_cung_cap', label: t('danhSachTaiSan.store.nhaCungCapCol') },
  { key: 'ten_nguoi_tao', label: t('danhSachTaiSan.store.nguoiTaoCol') },
  { key: 'ten_nguoi_dang_giu', label: t('danhSachTaiSan.store.nguoiGiuCol') },
  { key: 'ngay_nhap', label: t('danhSachTaiSan.store.ngayNhapCol') },
  { key: 'nguyen_gia', label: t('danhSachTaiSan.store.nguyenGiaCol') },
  { key: 'ngay_bat_dau_trich_khau_hao', label: t('danhSachTaiSan.detail.ngayBatDauTrichKhauHao') },
  { key: 'gia_tri_con_lai', label: t('danhSachTaiSan.detail.giaTriConLai') },
  { key: 'khau_hao_luy_ke', label: t('danhSachTaiSan.detail.khauHaoLuyKe') },
  { key: 'ghi_chu', label: t('danhSachTaiSan.form.ghiChu') },
  { key: 'trang_thai', label: t('danhSachTaiSan.form.status') },
];

export function taiSanToExportRow(a: TaiSan): TaiSanExportRow {
  return {
    ma_tai_san: a.ma_tai_san ?? '',
    ten_tai_san: a.ten_tai_san ?? '',
    ten_nhom: a.ten_nhom ?? '',
    ten_noi_luu: a.ten_noi_luu ?? '',
    ten_chi_nhanh: a.ten_chi_nhanh ?? '',
    ten_trang_thai: a.ten_trang_thai ?? '',
    thuong_hieu: a.thuong_hieu ?? '',
    model: a.model ?? '',
    serial: a.serial ?? '',
    xuat_xu: a.xuat_xu ?? '',
    ma_barcode: a.ma_barcode ?? '',
    ten_nha_cung_cap: a.ten_nha_cung_cap ?? '',
    ten_nguoi_tao: a.ten_nguoi_tao ?? '',
    ten_nguoi_dang_giu: a.ten_nhan_vien_dang_giu ?? '',
    ngay_nhap: formatDate(a.ngay_nhap),
    nguyen_gia: a.nguyen_gia != null ? formatCurrency(a.nguyen_gia) : '',
    ngay_bat_dau_trich_khau_hao: a.ngay_bat_dau_trich_khau_hao ? formatDate(a.ngay_bat_dau_trich_khau_hao) : '',
    gia_tri_con_lai: a.gia_tri_con_lai != null ? formatCurrency(a.gia_tri_con_lai) : '',
    khau_hao_luy_ke: a.khau_hao_luy_ke != null ? formatCurrency(a.khau_hao_luy_ke) : '',
    ghi_chu: a.ghi_chu ?? '',
    trang_thai: a.trang_thai === 1 ? t('common.activeStatus') : t('common.inactiveStatus'),
  };
}

export const TAI_SAN_EXPORT_FILENAME = 'danh_sach_tai_san';
