import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ThuChiQuyFilters {
  loai: string[];
  hangMucIds: string[];
  nguonChungTu: string[];
  nguoiTaoIds: string[];
  /** Khoảng ngày (DateRangePicker) — 'all' = không lọc */
  datePreset: string;
  customDateFrom: string;
  customDateEnd: string;
}

/** Cột theo đúng thứ tự sổ quỹ Excel; cột chi nhánh chỉ hữu ích khi xem nhiều farm. */
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('thuChiQuy.store.ngayCol'), visible: true, minWidth: 110, order: 0 },
  { id: 'so_phieu', label: i18n.t('thuChiQuy.store.soPhieuCol'), visible: true, minWidth: 110, order: 1 },
  { id: 'dien_giai', label: i18n.t('thuChiQuy.store.dienGiaiCol'), visible: true, minWidth: 260, order: 2 },
  { id: 'hang_muc', label: i18n.t('thuChiQuy.store.hangMucCol'), visible: true, minWidth: 130, order: 3 },
  { id: 'thu', label: i18n.t('thuChiQuy.store.thuCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'chi', label: i18n.t('thuChiQuy.store.chiCol'), visible: true, minWidth: 120, order: 5 },
  { id: 'ton_quy', label: i18n.t('thuChiQuy.store.tonQuyCol'), visible: true, minWidth: 140, order: 6 },
  { id: 'chi_nhanh', label: i18n.t('thuChiQuy.store.chiNhanhCol'), visible: true, minWidth: 140, order: 7 },
  { id: 'so_chung_tu', label: i18n.t('thuChiQuy.store.soChungTuCol'), visible: true, minWidth: 130, order: 8 },
  { id: 'nguon', label: i18n.t('thuChiQuy.store.nguonCol'), visible: false, minWidth: 140, order: 9 },
  { id: 'ghi_chu', label: i18n.t('thuChiQuy.store.ghiChuCol'), visible: true, minWidth: 200, order: 10 },
  { id: 'nguoi_tao', label: i18n.t('thuChiQuy.store.nguoiTaoCol'), visible: false, minWidth: 140, order: 11 },
  { id: 'tg_cap_nhat', label: i18n.t('thuChiQuy.store.updatedCol'), visible: false, minWidth: 140, order: 12 },
];

export const useThuChiQuyStore = createGenericStore<ThuChiQuyFilters>(
  {
    loai: [],
    hangMucIds: [],
    nguonChungTu: [],
    nguoiTaoIds: [],
    datePreset: 'all',
    customDateFrom: '',
    customDateEnd: '',
  },
  DEFAULT_COLUMNS,
  'table-thu-chi-quy'
);
