/**
 * Xuất danh sách tài sản ra Excel / PDF (tab Danh sách).
 */
import type { TaiSan } from '../core/types';
import { formatDate, formatCurrency } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';

export interface TaiSanExportRow {
  ma_tai_san: string;
  ten_tai_san: string;
  ten_nhom: string;
  ten_noi_luu: string;
  ten_trang_thai: string;
  ten_nguoi_dang_giu: string;
  ngay_nhap: string;
  nguyen_gia: string;
  trang_thai: string;
  ghi_chu: string;
}

const t = i18n.t.bind(i18n);

export function taiSanToExportRow(a: TaiSan): TaiSanExportRow {
  return {
    ma_tai_san: a.ma_tai_san ?? '',
    ten_tai_san: a.ten_tai_san ?? '',
    ten_nhom: a.ten_nhom ?? '',
    ten_noi_luu: a.ten_noi_luu ?? '',
    ten_trang_thai: a.ten_trang_thai ?? '',
    ten_nguoi_dang_giu: a.ten_nhan_vien_dang_giu ?? '',
    ngay_nhap: formatDate(a.ngay_nhap),
    nguyen_gia: a.nguyen_gia != null ? formatCurrency(a.nguyen_gia) : '',
    trang_thai: a.trang_thai === 1 ? t('common.activeStatus') : t('common.inactiveStatus'),
    ghi_chu: a.ghi_chu ?? '',
  };
}

export const TAI_SAN_EXPORT_FILENAME = 'danh_sach_tai_san';
