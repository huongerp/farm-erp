/**
 * Xuất báo cáo thống kê đề xuất tuyển dụng (tab Thống kê).
 * Số liệu đã tuyển / đã nghỉ / còn lại lấy từ DeXuatTuyenDungWithCounts (tính từ ứng viên + trạng thái).
 */
import type { DeXuatTuyenDung, DeXuatTuyenDungWithCounts } from '../core/types';
import { formatDateTimeShort } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';

const STATUS_KEYS: Record<number, string> = {
  0: 'deXuatTuyenDung.status.nhap',
  1: 'deXuatTuyenDung.status.choDuyet',
  2: 'deXuatTuyenDung.status.daDuyet',
  3: 'deXuatTuyenDung.status.tuChoi',
};

const t = i18n.t.bind(i18n);

export interface DeXuatTuyenDungExportRow {
  ma_de_xuat: string;
  tieu_de: string;
  chuc_vu: string;
  trang_thai: string;
  so_luong: number;
  so_luong_onboard: number;
  so_luong_da_nghi: number;
  so_luong_con_lai: number;
  han_nop: string;
  tg_tao: string;
}

export function deXuatTuyenDungToExportRow(item: DeXuatTuyenDungWithCounts | DeXuatTuyenDung): DeXuatTuyenDungExportRow {
  const withCounts = item as DeXuatTuyenDungWithCounts;
  const onboard = withCounts.so_luong_onboard ?? item.so_luong_da_tuyen ?? 0;
  const nghi = withCounts.so_luong_da_nghi ?? 0;
  const conLai = withCounts.so_luong_con_lai ?? Math.max(0, (item.so_luong ?? 0) - onboard);
  return {
    ma_de_xuat: item.ma_de_xuat ?? '',
    tieu_de: item.tieu_de ?? '',
    chuc_vu: item.ten_chuc_vu ?? '',
    trang_thai: t(STATUS_KEYS[item.trang_thai] ?? STATUS_KEYS[0]),
    so_luong: item.so_luong ?? 0,
    so_luong_onboard: onboard,
    so_luong_da_nghi: nghi,
    so_luong_con_lai: conLai,
    han_nop: item.han_nop ? formatDateTimeShort(item.han_nop) : '',
    tg_tao: formatDateTimeShort(item.tg_tao),
  };
}

export const DE_XUAT_TUYEN_DUNG_EXPORT_FILENAME = 'thong_ke_de_xuat_tuyen_dung';
