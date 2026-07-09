import {
  getTrangThaiPhieuBadgeClass,
  TRANG_THAI_PHIEU_DE_XUAT_VAT_TU,
  type TrangThaiPhieuDeXuatVatTu,
} from '../../../kho-van/phieu-de-xuat-vat-tu/core/constants';

export type { TrangThaiPhieuDeXuatVatTu };

const LABEL_KEYS: Record<TrangThaiPhieuDeXuatVatTu, string> = {
  'Chờ duyệt': 'baoCaodeXuatVatTu.trangThaiChoDuyet',
  'Đợi duyệt': 'baoCaodeXuatVatTu.trangThaiDoiDuyet',
  'Đã duyệt': 'baoCaodeXuatVatTu.trangThaiDaDuyet',
  'Không duyệt': 'baoCaodeXuatVatTu.trangThaiKhongDuyet',
};

export function getBaoCaoTrangThaiLabel(trangThai: string, t: (key: string) => string): string {
  const key = LABEL_KEYS[trangThai as TrangThaiPhieuDeXuatVatTu];
  return key ? t(key) : trangThai;
}

export function getBaoCaoTrangThaiBadgeClass(trangThai: string): string {
  return getTrangThaiPhieuBadgeClass(trangThai);
}

export { TRANG_THAI_PHIEU_DE_XUAT_VAT_TU };
