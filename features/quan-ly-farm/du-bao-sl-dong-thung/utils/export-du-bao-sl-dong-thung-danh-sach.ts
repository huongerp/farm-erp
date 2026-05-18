/**
 * Export danh sách dự báo SL đóng thùng: map phẳng + cột ExportDialog.
 */
import type { TFunction } from 'i18next';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { TRANG_THAI_DU_BAO_SL_DONG_THUNG } from '../core/types';
import { computeDuBaoSlDongThungKpiFromFarm } from '../core/kpi';
import type { ExportColumn } from '../../../../components/shared/ExportDialog';
import { formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';

export const DU_BAO_SL_DONG_THUNG_LIST_EXPORT_KEYS = [
  'id',
  'ngay',
  'id_chi_nhanh',
  'ten_chi_nhanh',
  'trang_thai',
  'so_buong_can_mau',
  'tong_can_nang_mau',
  'can_nang_bq_buong',
  'tong_buong_nhap_ke_hoach',
  'ty_le_thu_hoi_ke_hoach',
  'quy_cach_dong_thung_ke_hoach',
  'tong_so_thung_ke_hoach',
  'tong_buong_nhap_thuc_te',
  'ty_le_thu_hoi_thuc_te',
  'quy_cach_dong_thung_thuc_te',
  'tong_so_thung_thuc_te',
  'ghi_chu',
  'id_nguoi_tao',
  'ten_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
] as const;

export function mapFarmDuBaoSlDongThungListRow(
  item: FarmDuBaoSlDongThung,
  t: TFunction
): Record<string, unknown> {
  const locked = item.trang_thai === TRANG_THAI_DU_BAO_SL_DONG_THUNG.KHOA;
  const kpi = computeDuBaoSlDongThungKpiFromFarm(item);
  return {
    id: item.id,
    ngay: formatDateShort(item.ngay),
    id_chi_nhanh: item.id_chi_nhanh ?? '',
    ten_chi_nhanh: item.ten_chi_nhanh ?? '',
    trang_thai: locked ? t('duBaoSlDongThung.trangThai.khoa') : t('duBaoSlDongThung.trangThai.mo'),
    so_buong_can_mau: formatNumberVN(item.so_buong_can_mau),
    tong_can_nang_mau: formatNumberVN(item.tong_can_nang_mau),
    can_nang_bq_buong: kpi.can_nang_binh_quan_buong != null ? formatNumberVN(kpi.can_nang_binh_quan_buong) : '',
    tong_buong_nhap_ke_hoach: formatNumberVN(item.tong_buong_nhap_ke_hoach),
    ty_le_thu_hoi_ke_hoach: formatNumberVN(Math.round(item.ty_le_thu_hoi_ke_hoach * 10000) / 100),
    quy_cach_dong_thung_ke_hoach: formatNumberVN(item.quy_cach_dong_thung_ke_hoach),
    tong_so_thung_ke_hoach: formatNumberVN(kpi.tong_so_thung_ke_hoach),
    tong_buong_nhap_thuc_te: formatNumberVN(item.tong_buong_nhap_thuc_te),
    ty_le_thu_hoi_thuc_te: formatNumberVN(Math.round(item.ty_le_thu_hoi_thuc_te * 10000) / 100),
    quy_cach_dong_thung_thuc_te: formatNumberVN(item.quy_cach_dong_thung_thuc_te),
    tong_so_thung_thuc_te: formatNumberVN(kpi.tong_so_thung_thuc_te),
    ghi_chu: item.ghi_chu ?? '',
    id_nguoi_tao: item.id_nguoi_tao ?? '',
    ten_nguoi_tao: item.ten_nguoi_tao ?? '',
    tg_tao: item.tg_tao ? formatDateTimeShort(item.tg_tao) : '',
    tg_cap_nhat: item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '',
  };
}

export function getExportColumnsDuBaoSlDongThungList(t: TFunction): ExportColumn[] {
  return DU_BAO_SL_DONG_THUNG_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`duBaoSlDongThung.export.list.${key}`),
  }));
}

export function exportFileNameDuBaoSlDongThungDanhSach(): string {
  return 'Du_bao_SL_dong_thung';
}
