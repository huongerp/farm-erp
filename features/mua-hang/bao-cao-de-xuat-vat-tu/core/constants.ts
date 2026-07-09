import type { TrangThaiPhieuDeXuatVatTu } from './types';
import { TRANG_THAI_PHIEU_DE_XUAT_VAT_TU } from './trang-thai-utils';

/** Trạng thái phiếu – value lưu thẳng text trong DB */
export const TRANG_THAI_PHIEU_OPTIONS: { value: TrangThaiPhieuDeXuatVatTu; labelKey: string }[] =
  TRANG_THAI_PHIEU_DE_XUAT_VAT_TU.map((value) => ({
    value,
    labelKey:
      value === 'Chờ duyệt'
        ? 'baoCaodeXuatVatTu.trangThaiChoDuyet'
        : value === 'Đợi duyệt'
          ? 'baoCaodeXuatVatTu.trangThaiDoiDuyet'
          : value === 'Đã duyệt'
            ? 'baoCaodeXuatVatTu.trangThaiDaDuyet'
            : 'baoCaodeXuatVatTu.trangThaiKhongDuyet',
  }));
