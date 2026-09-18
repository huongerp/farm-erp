import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

/** Tab Tra cứu chỉ lọc bằng toolbar riêng (farm + khoảng ngày) nên filters để rỗng. */
export interface TraCuuQuyFilters {
  _: string[];
}

/** Đọc sổ theo thứ tự tăng dần như sổ giấy: Ngày → Số phiếu → … → Tồn quỹ. */
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ngay', label: i18n.t('thuChiQuy.store.ngayCol'), visible: true, minWidth: 110, order: 0 },
  { id: 'so_phieu', label: i18n.t('thuChiQuy.store.soPhieuCol'), visible: true, minWidth: 110, order: 1 },
  { id: 'dien_giai', label: i18n.t('thuChiQuy.store.dienGiaiCol'), visible: true, minWidth: 280, order: 2 },
  { id: 'hang_muc', label: i18n.t('thuChiQuy.store.hangMucCol'), visible: true, minWidth: 140, order: 3 },
  { id: 'thu', label: i18n.t('thuChiQuy.store.thuCol'), visible: true, minWidth: 120, order: 4 },
  { id: 'chi', label: i18n.t('thuChiQuy.store.chiCol'), visible: true, minWidth: 120, order: 5 },
  { id: 'ton_quy', label: i18n.t('thuChiQuy.store.tonQuyCol'), visible: true, minWidth: 130, order: 6 },
  { id: 'so_chung_tu', label: i18n.t('thuChiQuy.store.soChungTuCol'), visible: false, minWidth: 130, order: 7 },
  { id: 'ghi_chu', label: i18n.t('thuChiQuy.store.ghiChuCol'), visible: false, minWidth: 200, order: 8 },
  { id: 'chi_nhanh', label: i18n.t('thuChiQuy.store.chiNhanhCol'), visible: false, minWidth: 140, order: 9 },
];

export const useTraCuuQuyStore = createGenericStore<TraCuuQuyFilters>({ _: [] }, DEFAULT_COLUMNS, 'table-thong-ke-quy-tra-cuu-quy');
