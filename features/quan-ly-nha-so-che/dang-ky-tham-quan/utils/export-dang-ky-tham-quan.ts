/** Xuất danh sách đăng ký tham quan: map phẳng + định nghĩa cột. */
import type { TFunction } from 'i18next';
import type { ExportColumn } from '../../../../components/shared/LazyExportDialog';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import i18n from '../../../../lib/i18n';
import type { DangKyThamQuan } from '../core/types';
import { donViCuaPhieu, mucDichCuaPhieu, quocTichCuaPhieu } from './hien-thi';

export function mapDangKyThamQuanRow(p: DangKyThamQuan): Record<string, unknown> {
  return {
    id: p.id,
    ngay_dang_ky: formatYmdToDisplay(p.ngay_dang_ky),
    tg_bat_dau: formatDateTimeShort(p.tg_bat_dau),
    tg_ket_thuc: p.tg_ket_thuc ? formatDateTimeShort(p.tg_ket_thuc) : '',
    trang_thai: i18n.t(`dangKyThamQuan.trangThai.${p.trang_thai}`),
    ten_chi_nhanh: p.ten_chi_nhanh ?? '',
    nguoi_dai_dien: p.nguoi_dai_dien ?? '',
    so_khach: p.khach.length,
    danh_sach_khach: p.khach.map((k) => k.ho_ten).join(', '),
    don_vi: donViCuaPhieu(p),
    quoc_tich: quocTichCuaPhieu(p),
    so_dien_thoai: p.khach.map((k) => k.so_dien_thoai).filter(Boolean).join(', '),
    muc_dich: mucDichCuaPhieu(p),
    phuong_tien: p.phuong_tien ? i18n.t(`dangKyThamQuan.phuongTien.${p.phuong_tien}`) : '',
    ten_nguoi_tiep_don: p.ten_nguoi_tiep_don ?? '',
    tg_vao_thuc_te: p.tg_vao_thuc_te ? formatDateTimeShort(p.tg_vao_thuc_te) : '',
    tg_ra_thuc_te: p.tg_ra_thuc_te ? formatDateTimeShort(p.tg_ra_thuc_te) : '',
    so_anh: p.hinh_anh_urls.length,
    ghi_chu: p.ghi_chu ?? '',
    ten_nguoi_tao: p.ten_nguoi_tao ?? '',
  };
}

const EXPORT_KEYS = [
  'id',
  'ngay_dang_ky',
  'tg_bat_dau',
  'tg_ket_thuc',
  'trang_thai',
  'ten_chi_nhanh',
  'nguoi_dai_dien',
  'so_khach',
  'danh_sach_khach',
  'don_vi',
  'quoc_tich',
  'so_dien_thoai',
  'muc_dich',
  'phuong_tien',
  'ten_nguoi_tiep_don',
  'tg_vao_thuc_te',
  'tg_ra_thuc_te',
  'so_anh',
  'ghi_chu',
  'ten_nguoi_tao',
] as const;

export function getExportColumnsDangKyThamQuan(t: TFunction): ExportColumn[] {
  return EXPORT_KEYS.map((key) => ({ key, label: t(`dangKyThamQuan.export.${key}`) }));
}

export const exportFileNameDangKyThamQuan = () => `dang-ky-tham-quan-${new Date().toISOString().slice(0, 10)}`;
