/**
 * Export danh sách báo cáo nhân công: map phẳng + cột ExportDialog.
 */
import type { TFunction } from 'i18next';
import type { FarmBaoCaoNhanCong } from '../core/types';
import {
  sumSlCongNgay,
  sumSlCongNua,
  sumSlTangCa,
  sumSoGioTc,
  sumTongCongQuyDoiPhieu,
  sumTongGioTangCaTichPhieu,
} from '../core/types';
import { TRANG_THAI_BAO_CAO_NHAN_CONG } from '../core/types';
import type { ExportColumn, KieuCotXuat } from '../../../../lib/export/dinh-dang-o';

/** Kiểu cột để Excel nhận số/ngày thật — xem `lib/export/dinh-dang-o.ts`. Cột không có ở đây là chữ. */
const KIEU_COT: Partial<Record<(typeof BAO_CAO_NHAN_CONG_LIST_EXPORT_KEYS)[number], KieuCotXuat>> = {
  id: 'text',
  id_chi_nhanh: 'text',
  id_nguoi_tao: 'text',
  ngay: 'date',
  so_anh: 'number',
  tong_cong_ngay: 'number',
  tong_cong_nua: 'number',
  tong_cong_quy_doi: 'number',
  tong_tang_ca: 'number',
  tong_gio_tc: 'number',
  tong_gio_tang_ca_tich: 'number',
  tg_tao: 'datetime',
  tg_cap_nhat: 'datetime',
};

export const BAO_CAO_NHAN_CONG_LIST_EXPORT_KEYS = [
  'id',
  'ngay',
  'id_chi_nhanh',
  'ten_chi_nhanh',
  'trang_thai',
  'so_anh',
  'hinh_anh_urls',
  'tong_cong_ngay',
  'tong_cong_nua',
  'tong_cong_quy_doi',
  'tong_tang_ca',
  'tong_gio_tc',
  'tong_gio_tang_ca_tich',
  'ghi_chu',
  'id_nguoi_tao',
  'ten_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
] as const;

export function mapFarmBaoCaoNhanCongListRow(
  item: FarmBaoCaoNhanCong,
  t: TFunction
): Record<string, unknown> {
  const urls = item.hinh_anh_urls ?? [];
  const locked = item.trang_thai === TRANG_THAI_BAO_CAO_NHAN_CONG.KHOA;
  return {
    id: item.id,
    ngay: item.ngay,
    id_chi_nhanh: item.id_chi_nhanh ?? '',
    ten_chi_nhanh: item.ten_chi_nhanh ?? '',
    trang_thai: locked ? t('baoCaoNhanCong.trangThai.khoa') : t('baoCaoNhanCong.trangThai.mo'),
    so_anh: urls.length,
    hinh_anh_urls: urls.join('\n'),
    tong_cong_ngay: sumSlCongNgay(item),
    tong_cong_nua: sumSlCongNua(item),
    tong_cong_quy_doi: sumTongCongQuyDoiPhieu(item),
    tong_tang_ca: sumSlTangCa(item),
    tong_gio_tc: sumSoGioTc(item),
    tong_gio_tang_ca_tich: sumTongGioTangCaTichPhieu(item),
    ghi_chu: item.ghi_chu ?? '',
    id_nguoi_tao: item.id_nguoi_tao ?? '',
    ten_nguoi_tao: item.ten_nguoi_tao ?? '',
    tg_tao: item.tg_tao ?? '',
    tg_cap_nhat: item.tg_cap_nhat ?? '',
  };
}

export function getExportColumnsBaoCaoNhanCongList(t: TFunction): ExportColumn[] {
  return BAO_CAO_NHAN_CONG_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`baoCaoNhanCong.export.list.${key}`),
    type: KIEU_COT[key],
  }));
}

export function exportFileNameBaoCaoNhanCongDanhSach(): string {
  return 'Bao_cao_nhan_cong';
}
