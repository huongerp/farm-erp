import { createGenericStore, ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ThuGuiUngVienFilters {
  id_ung_vien: string[];
  loai_thu: string[];
}

/** Cột data; cột "Thao tác" do GenericTable tự thêm (sticky right) và gọi renderCell('actions', item). */
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_ung_vien', label: i18n.t('thuGuiUngVien.table.ungVien'), visible: true, minWidth: 140, maxWidth: 240, order: 0 },
  { id: 'loai_thu', label: i18n.t('thuGuiUngVien.table.loaiPhieu'), visible: true, minWidth: 140, order: 1 },
  { id: 'tg_tao', label: i18n.t('thuGuiUngVien.table.ngayTao'), visible: true, minWidth: 128, order: 2 },
];

const initialFilters: ThuGuiUngVienFilters = {
  id_ung_vien: [],
  loai_thu: [],
};

export const useThuGuiUngVienStore = createGenericStore<ThuGuiUngVienFilters>(
  initialFilters,
  DEFAULT_COLUMNS
);
