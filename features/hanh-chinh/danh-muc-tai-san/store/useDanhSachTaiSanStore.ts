import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DanhSachTaiSanFilters {
  status: string[];
  id_nhom: string[];
  id_noi_luu: string[];
  id_trang_thai: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'hinh_anh', label: i18n.t('danhSachTaiSan.store.imageCol'), visible: true, minWidth: 72, order: 0 },
  { id: 'ma_tai_san', label: i18n.t('danhSachTaiSan.store.maCol'), visible: true, minWidth: 140, order: 1 },
  { id: 'ten_tai_san', label: i18n.t('danhSachTaiSan.store.tenCol'), visible: true, minWidth: 220, order: 2 },
  { id: 'ten_nhom', label: i18n.t('danhSachTaiSan.store.nhomCol'), visible: true, minWidth: 180, order: 3 },
  { id: 'ten_noi_luu', label: i18n.t('danhSachTaiSan.store.noiLuuCol'), visible: true, minWidth: 180, order: 4 },
  { id: 'ten_chi_nhanh', label: i18n.t('danhSachTaiSan.store.chiNhanhCol'), visible: true, minWidth: 160, order: 5 },
  { id: 'ten_trang_thai', label: i18n.t('danhSachTaiSan.store.trangThaiCol'), visible: true, minWidth: 140, order: 6 },
  { id: 'thuong_hieu', label: i18n.t('danhSachTaiSan.store.thuongHieuCol'), visible: true, minWidth: 120, order: 7 },
  { id: 'model', label: i18n.t('danhSachTaiSan.store.modelCol'), visible: true, minWidth: 120, order: 8 },
  { id: 'serial', label: i18n.t('danhSachTaiSan.store.serialCol'), visible: true, minWidth: 140, order: 9 },
  { id: 'xuat_xu', label: i18n.t('danhSachTaiSan.store.xuatXuCol'), visible: false, minWidth: 100, order: 10 },
  { id: 'ma_barcode', label: i18n.t('danhSachTaiSan.store.maBarcodeCol'), visible: false, minWidth: 120, order: 11 },
  { id: 'ten_nha_cung_cap', label: i18n.t('danhSachTaiSan.store.nhaCungCapCol'), visible: true, minWidth: 160, order: 12 },
  { id: 'ten_nguoi_tao', label: i18n.t('danhSachTaiSan.store.nguoiTaoCol'), visible: true, minWidth: 140, order: 13 },
  { id: 'ten_nhan_vien_dang_giu', label: i18n.t('danhSachTaiSan.store.nguoiGiuCol'), visible: true, minWidth: 160, order: 14 },
  { id: 'ngay_nhap', label: i18n.t('danhSachTaiSan.store.ngayNhapCol'), visible: true, minWidth: 120, order: 15 },
  { id: 'nguyen_gia', label: i18n.t('danhSachTaiSan.store.nguyenGiaCol'), visible: true, minWidth: 120, order: 16 },
  { id: 'tg_cap_nhat', label: i18n.t('danhSachTaiSan.store.updatedCol'), visible: true, minWidth: 140, order: 17 },
];

const initialFilters: DanhSachTaiSanFilters = {
  status: [],
  id_nhom: [],
  id_noi_luu: [],
  id_trang_thai: [],
};

export const useDanhSachTaiSanStore = createGenericStore<DanhSachTaiSanFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
