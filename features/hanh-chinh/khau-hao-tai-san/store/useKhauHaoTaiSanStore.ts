import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface KhauHaoTaiSanFilters {
  nam: string;
  thang: string[];
  trang_thai_ky: string[];
  id_nhom: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_ky', label: i18n.t('khauHaoTaiSan.store.maKyCol'), visible: true, minWidth: 100, order: 0 },
  { id: 'thang', label: i18n.t('khauHaoTaiSan.store.thangCol'), visible: true, minWidth: 70, order: 1 },
  { id: 'nam', label: i18n.t('khauHaoTaiSan.store.namCol'), visible: true, minWidth: 70, order: 2 },
  { id: 'trang_thai', label: i18n.t('khauHaoTaiSan.store.trangThaiCol'), visible: true, minWidth: 100, order: 3 },
  { id: 'tong_nguyen_gia', label: i18n.t('khauHaoTaiSan.store.tongNguyenGiaCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'tong_khau_hao_ky', label: i18n.t('khauHaoTaiSan.store.tongKhauHaoKyCol'), visible: true, minWidth: 120, order: 5 },
  { id: 'tg_cap_nhat', label: i18n.t('khauHaoTaiSan.store.updatedCol'), visible: true, minWidth: 130, order: 6 },
];

const initialFilters: KhauHaoTaiSanFilters = {
  nam: '',
  thang: [],
  trang_thai_ky: [],
  id_nhom: [],
};

export const useKhauHaoTaiSanStore = createGenericStore<KhauHaoTaiSanFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
