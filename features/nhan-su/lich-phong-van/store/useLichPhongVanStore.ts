import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface LichPhongVanFilters {
  id_ung_vien: string[];
  ngay_tu: string;
  ngay_den: string;
  hinh_thuc: string[];
  trang_thai: number[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_ung_vien', label: i18n.t('lichPhongVan.store.ungVienCol'), visible: true, minWidth: 140, maxWidth: 240, order: 0 },
  { id: 'so_vong', label: i18n.t('lichPhongVan.store.soVongCol'), visible: true, minWidth: 72, order: 1 },
  { id: 'ngay', label: i18n.t('lichPhongVan.store.ngayCol'), visible: true, minWidth: 118, order: 2 },
  { id: 'gio', label: i18n.t('lichPhongVan.store.gioCol'), visible: true, minWidth: 64, order: 3 },
  { id: 'hinh_thuc', label: i18n.t('lichPhongVan.store.hinhThucCol'), visible: true, minWidth: 100, order: 4 },
  { id: 'dia_diem', label: i18n.t('lichPhongVan.store.diaDiemCol'), visible: true, minWidth: 160, maxWidth: 280, order: 5 },
  { id: 'trang_thai', label: i18n.t('lichPhongVan.store.trangThaiCol'), visible: true, minWidth: 116, order: 6 },
  { id: 'trang_thai_danh_gia', label: i18n.t('lichPhongVan.store.trangThaiDanhGiaCol'), visible: true, minWidth: 132, order: 7 },
  { id: 'ket_qua', label: i18n.t('lichPhongVan.store.ketQuaCol'), visible: true, minWidth: 100, maxWidth: 180, order: 8 },
  { id: 'tg_cap_nhat', label: i18n.t('lichPhongVan.store.updatedCol'), visible: true, minWidth: 128, order: 9 },
];

const initialFilters: LichPhongVanFilters = {
  id_ung_vien: [],
  ngay_tu: '',
  ngay_den: '',
  hinh_thuc: [],
  trang_thai: [],
};

export const useLichPhongVanStore = createGenericStore<LichPhongVanFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
