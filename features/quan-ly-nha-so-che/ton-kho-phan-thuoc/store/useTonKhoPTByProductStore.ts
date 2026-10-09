import { storeTheoBienThe } from '../../kho-bien-the/KhoBienTheProvider';
import { khoStorageKey } from '../../kho-bien-the/bien-the';
import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import { getDateRangeFromPreset } from '../../../../lib/date-presets';

export type TonKhoPTFilters = {
  /** Kỳ xem tồn (YYYY-MM-DD). Mặc định tháng này → Tồn cuối kỳ = tồn hiện tại. */
  tu: string;
  den: string;
  /** ['Yes'] = chỉ tính phiếu đã duyệt. */
  chiDaDuyet: string[];
  belowMinStock: string[];
  categoryIds: string[];
  warehouseIds: string[];
};

export function initialTonKhoPTFilters(): TonKhoPTFilters {
  const { dateFrom, dateTo } = getDateRangeFromPreset('thisMonth');
  return { tu: dateFrom, den: dateTo, chiDaDuyet: [], belowMinStock: [], categoryIds: [], warehouseIds: [] };
}

const SO = { minWidth: 96, maxWidth: 130 };

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_hang', label: i18n.t('tonKhoPhanThuoc.table.maHang'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ten_hang', label: i18n.t('tonKhoPhanThuoc.table.tenHang'), visible: true, minWidth: 160, maxWidth: 280, order: 1 },
  { id: 'ten_danh_muc', label: i18n.t('tonKhoPhanThuoc.table.danhMuc'), visible: true, minWidth: 110, maxWidth: 200, order: 2 },
  { id: 'don_vi_tinh', label: i18n.t('tonKhoPhanThuoc.table.dvt'), visible: true, minWidth: 70, maxWidth: 100, order: 3 },
  { id: 'dinh_muc', label: i18n.t('tonKhoPhanThuoc.table.dinhMuc'), visible: true, minWidth: 80, maxWidth: 110, order: 4 },
  { id: 'so_kho_co_ton', label: i18n.t('tonKhoPhanThuoc.table.soKhoCoTon'), visible: false, minWidth: 88, maxWidth: 120, order: 5 },
  { id: 'ton_dau', label: i18n.t('tonKhoPhanThuoc.table.tonDau'), visible: true, ...SO, order: 6 },
  { id: 'nhap', label: i18n.t('tonKhoPhanThuoc.table.nhap'), visible: true, ...SO, order: 7 },
  { id: 'xuat', label: i18n.t('tonKhoPhanThuoc.table.xuat'), visible: true, ...SO, order: 8 },
  { id: 'chuyen', label: i18n.t('tonKhoPhanThuoc.table.chuyen'), visible: true, ...SO, order: 9 },
  { id: 'ton_cuoi', label: i18n.t('tonKhoPhanThuoc.table.tonCuoi'), visible: true, ...SO, order: 10 },
  // Cột kho_<id> (tồn cuối kỳ từng kho) được thêm động sau cột cuối — mergeWarehouseColumns.
];

/** Khoá mới (bảng có thêm cột kỳ) — bỏ cấu hình cột của bảng tồn tức thời cũ. */
export const useTonKhoPTByProductStore = storeTheoBienThe((bt) =>
  createGenericStore<TonKhoPTFilters>(
    initialTonKhoPTFilters(),
    DEFAULT_COLUMNS,
    khoStorageKey(bt, 'table-ton-kho-phan-thuoc-theo-ky')
  )
);
