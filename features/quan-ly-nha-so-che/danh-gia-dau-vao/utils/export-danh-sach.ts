/** Xuất danh sách phiếu Đánh giá đầu vào (1 dòng / chuyến): map phẳng + cột ExportDialog. */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatDateTimeShort, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import type { DgdvListRow } from '../services/danh-gia-dau-vao-db.service';
import { congNgay, ngayDauTuanFarm } from '../core/tuan';

export const DGDV_LIST_EXPORT_KEYS = [
  'id',
  'ngay',
  'chuyen',
  'nam',
  'tuan',
  'ten_chi_nhanh',
  'tong_so_luong',
  'tong_dut_day',
  'tong_thu',
  'ksc',
  'ti_le_ksc',
  'trang_thai',
  'ghi_chu',
  'ten_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
] as const;

/** % KSC = KSC / Tổng thu, 1 chữ số thập phân («12,5%»); tổng thu 0 → «–». */
export function nhanTiLeKsc(ksc: number, tongThu: number): string {
  if (!(tongThu > 0)) return '–';
  return `${formatNumberVN((ksc / tongThu) * 100, { minFractionDigits: 1, maxFractionDigits: 1 })}%`;
}

/** «19/10/2026 – 25/10/2026» của tuần farm. */
export function khoangNgayTuan(nam: number, tuan: number): string {
  const dau = ngayDauTuanFarm(nam, tuan);
  return `${formatYmdToDisplay(dau)} – ${formatYmdToDisplay(congNgay(dau, 6))}`;
}

export function mapDgdvListRow(item: DgdvListRow, t: TFunction): Record<string, unknown> {
  return {
    id: item.id,
    ngay: formatYmdToDisplay(item.ngay),
    chuyen: item.chuyen,
    nam: item.nam,
    tuan: item.tuan,
    ten_chi_nhanh: item.ten_chi_nhanh ?? '',
    tong_so_luong: formatNumberVN(item.tong_so_luong),
    tong_dut_day: formatNumberVN(item.tong_dut_day),
    tong_thu: formatNumberVN(item.tong_thu),
    ksc: formatNumberVN(item.ksc),
    ti_le_ksc: nhanTiLeKsc(item.ksc, item.tong_thu),
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
