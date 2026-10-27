/** Xuất danh sách phiếu Đánh giá đầu vào: map phẳng + cột ExportDialog. */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { DgdvListRow } from '../services/danh-gia-dau-vao-db.service';
import { congNgay, ngayDauTuanIso } from '../core/tuan';

export const DGDV_LIST_EXPORT_KEYS = [
  'id',
  'nam',
  'tuan',
  'khoang_ngay',
  'ten_chi_nhanh',
  'tong_thu_tuan',
  'ksc_tuan',
  'trang_thai',
  'ghi_chu',
  'ten_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
] as const;

/** «19/10/2026 – 25/10/2026» của tuần ISO. */
export function khoangNgayTuan(nam: number, tuan: number): string {
  const dau = ngayDauTuanIso(nam, tuan);
  return `${formatYmdToDisplay(dau)} – ${formatYmdToDisplay(congNgay(dau, 6))}`;
}

export function mapDgdvListRow(item: DgdvListRow, t: TFunction): Record<string, unknown> {
  return {
    id: item.id,
    nam: item.nam,
    tuan: item.tuan,
    khoang_ngay: khoangNgayTuan(item.nam, item.tuan),
    ten_chi_nhanh: item.ten_chi_nhanh ?? '',
    tong_thu_tuan: formatNumberVN(item.tong_thu_tuan),
    ksc_tuan: formatNumberVN(item.ksc_tuan),
    trang_thai: t(`danhGiaDauVao.trangThai.${item.trang_thai}`),
    ghi_chu: item.ghi_chu ?? '',
    ten_nguoi_tao: item.ten_nguoi_tao ?? '',
    tg_tao: item.tg_tao ? formatDateTimeShort(item.tg_tao) : '',
    tg_cap_nhat: item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '',
  };
}

export function getExportColumnsDgdvList(t: TFunction): ExportColumn[] {
  return DGDV_LIST_EXPORT_KEYS.map((key) => ({ key, label: t(`danhGiaDauVao.export.list.${key}`) }));
}

export const exportFileNameDgdvDanhSach = () => 'Danh_gia_dau_vao';
