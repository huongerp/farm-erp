import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export type DinhMucTonFilters = {
  /** Lọc theo kho (kho_id). Rỗng = tất cả. */
  warehouseIds: string[];
};

const initialFilters: DinhMucTonFilters = {
  warehouseIds: [],
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'kho', label: i18n.t('hangHoa.dinhMuc.kho'), visible: true, minWidth: 160, maxWidth: 280, order: 0 },
  { id: 'hang_hoa', label: i18n.t('hangHoa.dinhMuc.hangHoa'), visible: true, minWidth: 180, maxWidth: 320, order: 1 },
  { id: 'ton_toi_thieu', label: i18n.t('hangHoa.dinhMuc.tonToiThieu'), visible: true, minWidth: 110, maxWidth: 140, order: 2 },
];

export const useDinhMucTonStore = createGenericStore<DinhMucTonFilters>(initialFilters, DEFAULT_COLUMNS);
