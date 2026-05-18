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
import type { ExportColumn } from '../../../../components/shared/ExportDialog';
import { formatDateShort, formatDateTimeShort, formatNumberVN } from '../../../../lib/utils';

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
    ngay: formatDateShort(item.ngay),
    id_chi_nhanh: item.id_chi_nhanh ?? '',
    ten_chi_nhanh: item.ten_chi_nhanh ?? '',
    trang_thai: locked ? t('baoCaoNhanCong.trangThai.khoa') : t('baoCaoNhanCong.trangThai.mo'),
    so_anh: urls.length,
    hinh_anh_urls: urls.join('\n'),
    tong_cong_ngay: formatNumberVN(sumSlCongNgay(item)),
    tong_cong_nua: formatNumberVN(sumSlCongNua(item)),
    tong_cong_quy_doi: formatNumberVN(sumTongCongQuyDoiPhieu(item)),
    tong_tang_ca: formatNumberVN(sumSlTangCa(item)),
    tong_gio_tc: formatNumberVN(sumSoGioTc(item)),
    tong_gio_tang_ca_tich: formatNumberVN(sumTongGioTangCaTichPhieu(item)),
    ghi_chu: item.ghi_chu ?? '',
    id_nguoi_tao: item.id_nguoi_tao ?? '',
    ten_nguoi_tao: item.ten_nguoi_tao ?? '',
    tg_tao: item.tg_tao ? formatDateTimeShort(item.tg_tao) : '',
    tg_cap_nhat: item.tg_cap_nhat ? formatDateTimeShort(item.tg_cap_nhat) : '',
  };
}

export function getExportColumnsBaoCaoNhanCongList(t: TFunction): ExportColumn[] {
  return BAO_CAO_NHAN_CONG_LIST_EXPORT_KEYS.map((key) => ({
    key,
    label: t(`baoCaoNhanCong.export.list.${key}`),
  }));
}

export function exportFileNameBaoCaoNhanCongDanhSach(): string {
  return 'Bao_cao_nhan_cong';
}
