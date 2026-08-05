import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';
import type { Kho } from '../../danh-sach-kho/core/types';

export type TonKhoFilters = {
  belowMinStock: string[];
  /** Lọc theo danh mục (ten_danh_muc). Rỗng = tất cả. */
  categoryIds: string[];
  /** Lọc theo id_kho. Rỗng = tất cả. */
  warehouseIds: string[];
};

const initialTonKhoFilters: TonKhoFilters = {
  belowMinStock: [],
  categoryIds: [],
  warehouseIds: [],
};

const DEFAULT_COLUMNS_BY_PRODUCT: ColumnConfig[] = [
  { id: 'ma_hang', label: i18n.t('tonKho.byProduct.code'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ten_hang', label: i18n.t('tonKho.byProduct.name'), visible: true, minWidth: 240, maxWidth: 420, order: 1 },
  { id: 'ten_danh_muc', label: i18n.t('tonKho.byProduct.category'), visible: true, minWidth: 180, maxWidth: 300, order: 2 },
  { id: 'don_vi_tinh', label: i18n.t('tonKho.byProduct.unit'), visible: true, minWidth: 70, maxWidth: 100, order: 3 },
  { id: 'tong_so_luong', label: i18n.t('tonKho.byProduct.totalQty'), visible: true, minWidth: 95, maxWidth: 115, order: 4 },
  { id: 'ton_toi_thieu', label: i18n.t('tonKho.byProduct.minStock'), visible: true, minWidth: 95, maxWidth: 115, order: 5 },
  { id: 'canh_bao', label: i18n.t('tonKho.byProduct.alert'), visible: true, minWidth: 115, maxWidth: 160, order: 6 },
];

/** Cột cố định tab Tra cứu theo kỳ (sản phẩm + tổng kỳ); cột theo kho merge động. */
const DEFAULT_COLUMNS_TON_THOI_DIEM: ColumnConfig[] = [
  { id: 'ma_hang', label: i18n.t('tonKho.byProduct.code'), visible: true, minWidth: 100, maxWidth: 160, order: 0 },
  { id: 'ten_hang', label: i18n.t('tonKho.byProduct.name'), visible: true, minWidth: 240, maxWidth: 420, order: 1 },
  { id: 'ten_danh_muc', label: i18n.t('tonKho.byProduct.category'), visible: true, minWidth: 180, maxWidth: 300, order: 2 },
  { id: 'don_vi_tinh', label: i18n.t('tonKho.byProduct.unit'), visible: true, minWidth: 70, maxWidth: 100, order: 3 },
  { id: 'tong_dau', label: i18n.t('tonKho.tonThoiDiem.colDauKy'), visible: true, minWidth: 80, maxWidth: 110, order: 4 },
  { id: 'tong_trong', label: i18n.t('tonKho.tonThoiDiem.colTrongKy'), visible: true, minWidth: 88, maxWidth: 120, order: 5 },
  { id: 'tong_cuoi', label: i18n.t('tonKho.tonThoiDiem.colCuoiKy'), visible: true, minWidth: 80, maxWidth: 110, order: 6 },
];

/** Prefix id cột động theo kho trên list "Theo sản phẩm". */
export const KHO_COLUMN_ID_PREFIX = 'kho_';

export type KhoPeriodMetric = 'dau' | 'trong' | 'cuoi';

const KHO_PERIOD_METRICS: { metric: KhoPeriodMetric; labelKey: string }[] = [
  { metric: 'dau', labelKey: 'tonKho.tonThoiDiem.colDauKy' },
  { metric: 'trong', labelKey: 'tonKho.tonThoiDiem.colTrongKy' },
  { metric: 'cuoi', labelKey: 'tonKho.tonThoiDiem.colCuoiKy' },
];

export function khoColumnId(khoId: string): string {
  return `${KHO_COLUMN_ID_PREFIX}${khoId}`;
}

/** Cột SL tồn đơn giản theo kho (tab Theo sản phẩm): kho_{id} — không gồm bộ đầu/trong/cuối. */
export function isKhoColumnId(id: string): boolean {
  return id.startsWith(KHO_COLUMN_ID_PREFIX) && !/_dau$|_trong$|_cuoi$/.test(id);
}

export function khoIdFromColumnId(colId: string): string {
  return colId.slice(KHO_COLUMN_ID_PREFIX.length);
}

export function khoPeriodColumnId(khoId: string, metric: KhoPeriodMetric): string {
  return `${KHO_COLUMN_ID_PREFIX}${khoId}_${metric}`;
}

export function parseKhoPeriodColumnId(
  colId: string
): { khoId: string; metric: KhoPeriodMetric } | null {
  if (!colId.startsWith(KHO_COLUMN_ID_PREFIX)) return null;
  const rest = colId.slice(KHO_COLUMN_ID_PREFIX.length);
  const m = rest.match(/^(.*)_(dau|trong|cuoi)$/);
  if (!m) return null;
  return { khoId: m[1], metric: m[2] as KhoPeriodMetric };
}

export function isKhoPeriodColumnId(id: string): boolean {
  return parseKhoPeriodColumnId(id) != null;
}

/**
 * Chèn cột theo từng kho ngay sau cột "Tổng tồn".
 * Trả về cùng reference nếu không có cột nào thiếu (tránh set state vô ích).
 */
export function mergeWarehouseColumns(cols: ColumnConfig[], khoList: Kho[]): ColumnConfig[] {
  if (khoList.length === 0) return cols;
  const existing = new Set(cols.map((c) => c.id));
  const missing = khoList.filter((k) => !existing.has(khoColumnId(k.id)));
  if (missing.length === 0) return cols;

  const sorted = [...cols].sort((a, b) => a.order - b.order);
  const tongIdx = sorted.findIndex((c) => c.id === 'tong_so_luong');
  const insertAt = tongIdx >= 0 ? tongIdx + 1 : sorted.length;

  const newCols: ColumnConfig[] = missing.map((k, i) => ({
    id: khoColumnId(k.id),
    label: k.ten_kho,
    visible: true,
    minWidth: 90,
    maxWidth: 130,
    order: insertAt + i,
  }));

  const before = sorted.slice(0, insertAt);
  const after = sorted.slice(insertAt);
  return [...before, ...newCols, ...after].map((col, i) => ({ ...col, order: i }));
}

/**
 * Chèn bộ 3 cột (đầu / trong / cuối) cho mỗi kho sau cột tong_cuoi.
 * Label cột = "Tên kho · Đầu kỳ" để hiện trong quản lý cột.
 */
export function mergeWarehousePeriodColumns(cols: ColumnConfig[], khoList: Kho[]): ColumnConfig[] {
  if (khoList.length === 0) return cols;
  const existing = new Set(cols.map((c) => c.id));
  const missing = khoList.filter((k) => !existing.has(khoPeriodColumnId(k.id, 'dau')));
  if (missing.length === 0) return cols;

  const sorted = [...cols].sort((a, b) => a.order - b.order);
  const tongCuoiIdx = sorted.findIndex((c) => c.id === 'tong_cuoi');
  const insertAt = tongCuoiIdx >= 0 ? tongCuoiIdx + 1 : sorted.length;

  const newCols: ColumnConfig[] = [];
  missing.forEach((k) => {
    KHO_PERIOD_METRICS.forEach(({ metric, labelKey }) => {
      newCols.push({
        id: khoPeriodColumnId(k.id, metric),
        label: `${k.ten_kho} · ${i18n.t(labelKey)}`,
        visible: true,
        minWidth: metric === 'trong' ? 88 : 80,
        maxWidth: metric === 'trong' ? 120 : 110,
        order: 0,
      });
    });
  });

  const before = sorted.slice(0, insertAt);
  const after = sorted.slice(insertAt);
  return [...before, ...newCols, ...after].map((col, i) => ({ ...col, order: i }));
}

export const useTonKhoByProductStore = createGenericStore<TonKhoFilters>(initialTonKhoFilters, DEFAULT_COLUMNS_BY_PRODUCT);
export const useTonKhoTonThoiDiemStore = createGenericStore<TonKhoFilters>(initialTonKhoFilters, DEFAULT_COLUMNS_TON_THOI_DIEM);
