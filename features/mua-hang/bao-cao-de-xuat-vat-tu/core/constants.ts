import type { TrangThaiPhieuDeXuatVatTu } from './types';

/** Trạng thái phiếu – value lưu thẳng text trong DB */
export const TRANG_THAI_PHIEU_OPTIONS: { value: TrangThaiPhieuDeXuatVatTu; labelKey: string }[] = [
  { value: 'Chờ duyệt', labelKey: 'baoCaodeXuatVatTu.trangThaiChoDuyet' },
  { value: 'Đã duyệt', labelKey: 'baoCaodeXuatVatTu.trangThaiDaDuyet' },
  { value: 'Không duyệt', labelKey: 'baoCaodeXuatVatTu.trangThaiKhongDuyet' },
];
