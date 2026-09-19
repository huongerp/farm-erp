/**
 * Cột + mapper cho ExportDialog ở tab Đợt kiểm kê.
 * Dữ liệu vào là TOÀN BỘ đợt khớp bộ lọc (fetchAllDotKiemKePTForListQuery), không
 * phải trang đang xem.
 */
import type { TFunction } from 'i18next';
import { formatDate, formatDateTimeShort, getTodayISODate } from '../../../../lib/utils';
import { getTrangThaiDotLabelPT } from '../core/constants';
import type { DotKiemKePT } from '../core/types';

export function exportColumnsDotKiemKePT(t: TFunction): { key: string; label: string }[] {
  return [
    { key: 'ma_dot', label: t('kiemKeKhoPT.store.maDotCol') },
    { key: 'ten_dot', label: t('kiemKeKhoPT.store.tenDotCol') },
    { key: 'ngay_bat_dau', label: t('kiemKeKhoPT.store.ngayBatDauCol') },
    { key: 'ngay_ket_thuc', label: t('kiemKeKhoPT.store.ngayKetThucCol') },
    { key: 'trang_thai', label: t('kiemKeKhoPT.store.trangThaiCol') },
    { key: 'so_kho', label: t('kiemKeKhoPT.store.soKhoCol') },
    { key: 'so_hang_hoa', label: t('kiemKeKhoPT.store.soHangHoaCol') },
    { key: 'so_lech', label: t('kiemKeKhoPT.store.soLechCol') },
    { key: 'ten_nguoi_tao', label: t('kiemKeKhoPT.store.nguoiTaoCol') },
    { key: 'ten_nguoi_phu_trach', label: t('kiemKeKhoPT.store.nguoiPhuTrachCol') },
    { key: 'ghi_chu', label: t('kiemKeKhoPT.store.ghiChuCol') },
    { key: 'tg_tao', label: t('kiemKeKhoPT.store.createdAtCol') },
    { key: 'tg_cap_nhat', label: t('kiemKeKhoPT.store.updatedCol') },
  ];
}

export function exportMapDotKiemKePT(t: TFunction) {
  return (item: DotKiemKePT): Record<string, string | number> => ({
    ma_dot: item.ma_dot,
    ten_dot: item.ten_dot,
    ngay_bat_dau: formatDate(item.ngay_bat_dau),
    ngay_ket_thuc: formatDate(item.ngay_ket_thuc),
    trang_thai: getTrangThaiDotLabelPT(item.trang_thai, t),
    so_kho: item.so_kho ?? item.id_kho.length,
    so_hang_hoa: item.so_hang_hoa ?? 0,
    so_lech: item.so_lech ?? 0,
    ten_nguoi_tao: item.ten_nguoi_tao ?? '',
    ten_nguoi_phu_trach: item.ten_nguoi_phu_trach ?? '',
    ghi_chu: item.ghi_chu ?? '',
    tg_tao: formatDateTimeShort(item.tg_tao),
    tg_cap_nhat: formatDateTimeShort(item.tg_cap_nhat),
  });
}

export function exportFileNameDotKiemKePT(): string {
  return `Kiem_ke_kho_phan_thuoc_${getTodayISODate()}`;
}
