import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface KetNoiGoogleFilters {
  /** Tình trạng (TinhTrangKetNoi) — [] = tất cả. */
  tinhTrang: string[];
}

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ho_va_ten', label: i18n.t('ketNoiGoogle.col.employee'), visible: true, minWidth: 200, order: 0 },
  { id: 'ten_phong_ban', label: i18n.t('ketNoiGoogle.col.department'), visible: true, minWidth: 160, order: 1 },
  { id: 'google_email', label: i18n.t('ketNoiGoogle.col.googleEmail'), visible: true, minWidth: 220, order: 2 },
  { id: 'tinh_trang', label: i18n.t('ketNoiGoogle.col.status'), visible: true, minWidth: 140, order: 3 },
  { id: 'so_lich', label: i18n.t('ketNoiGoogle.col.schedules'), visible: true, minWidth: 140, order: 4 },
  { id: 'lan_dong_bo_cuoi', label: i18n.t('ketNoiGoogle.col.lastSync'), visible: true, minWidth: 150, order: 5 },
  { id: 'tg_tao', label: i18n.t('ketNoiGoogle.col.connectedAt'), visible: true, minWidth: 150, order: 6 },
  { id: 'ten_chuc_vu', label: i18n.t('ketNoiGoogle.col.position'), visible: false, minWidth: 150, order: 7 },
];

export const useKetNoiGoogleStore = createGenericStore<KetNoiGoogleFilters>(
  { tinhTrang: [] },
  DEFAULT_COLUMNS,
  'table-ket-noi-google',
);
