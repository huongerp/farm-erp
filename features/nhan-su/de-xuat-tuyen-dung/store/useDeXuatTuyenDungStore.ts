import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface DeXuatTuyenDungFilters {
  status: number[];
  id_chuc_vu: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_de_xuat', label: i18n.t('deXuatTuyenDung.store.maDeXuatCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten_chuc_vu', label: i18n.t('deXuatTuyenDung.store.chucVuCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'tieu_de', label: i18n.t('deXuatTuyenDung.store.tieuDeCol'), visible: true, minWidth: 180, maxWidth: 280, order: 2 },
  { id: 'mo_ta', label: i18n.t('deXuatTuyenDung.store.moTaCol'), visible: true, minWidth: 180, maxWidth: 280, order: 3 },
  { id: 'so_luong', label: i18n.t('deXuatTuyenDung.store.soLuongCol'), visible: true, minWidth: 90, order: 4 },
  { id: 'so_luong_onboard', label: i18n.t('deXuatTuyenDung.store.soLuongOnboardCol'), visible: true, minWidth: 100, order: 5 },
  { id: 'so_luong_da_nghi', label: i18n.t('deXuatTuyenDung.store.soLuongDaNghiCol'), visible: true, minWidth: 100, order: 6 },
  { id: 'so_luong_con_lai', label: i18n.t('deXuatTuyenDung.store.soLuongConLaiCol'), visible: true, minWidth: 100, order: 7 },
  { id: 'link_tuyen', label: i18n.t('deXuatTuyenDung.store.linkCol'), visible: true, minWidth: 90, maxWidth: 100, order: 8 },
  { id: 'trang_thai', label: i18n.t('deXuatTuyenDung.store.statusCol'), visible: true, minWidth: 110, order: 9 },
  { id: 'tg_tao', label: i18n.t('deXuatTuyenDung.store.createdCol'), visible: true, minWidth: 120, order: 10 },
];

const initialFilters: DeXuatTuyenDungFilters = {
  status: [],
  id_chuc_vu: [],
};

export const useDeXuatTuyenDungStore = createGenericStore<DeXuatTuyenDungFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
