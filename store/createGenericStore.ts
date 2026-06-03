import { create } from 'zustand';
import type { CSSProperties } from 'react';

/**
 * Cấu hình cột dùng cho list/table view.
 * Quy định generic: mỗi cột nên có minWidth và maxWidth để tránh chữ chen chúc hoặc cột quá rộng.
 */
export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  /** Chiều rộng tối thiểu (px). Nên luôn khai báo. */
  minWidth?: number;
  /** Chiều rộng tối đa (px). Nên khai báo cho cột text dài để tránh cột quá rộng. */
  maxWidth?: number;
  /** Chiều rộng hiện tại (do user resize). undefined = auto */
  width?: number;
  order: number;
}

/** Giá trị maxWidth mặc định khi cột không khai báo (tránh cột trải quá rộng). */
export const DEFAULT_COLUMN_MAX_WIDTH = 400;

/** Cột chỉ ngày (date): đủ một dòng cho DD/MM/YYYY và header tiếng Việt. */
export const COLUMN_WIDTH_DATE_MIN = 132;
export const COLUMN_WIDTH_DATE_MAX = 168;

/** Cột ngày giờ (timestamptz / tg_*). */
export const COLUMN_WIDTH_DATETIME_MIN = 160;
export const COLUMN_WIDTH_DATETIME_MAX = 240;

/** Số tiền (locale vi-VN, có dấu chấm phân tách). */
export const COLUMN_WIDTH_MONEY_MIN = 128;
export const COLUMN_WIDTH_MONEY_MAX = 196;

/** Trạng thái / badge — tránh ép hẹp khiến nhãn xuống dòng. */
export const COLUMN_WIDTH_STATUS_MIN = 116;
export const COLUMN_WIDTH_STATUS_MAX = 196;

/** Mã / số chứng từ (ma_dot, ma_*, so_phieu, …). */
export const COLUMN_WIDTH_CODE_MIN = 156;
export const COLUMN_WIDTH_CODE_MAX = 224;

/** Tên dài (ten_dot, ten_hang_hoa, ten_*, …). */
export const COLUMN_WIDTH_NAME_MIN = 220;
export const COLUMN_WIDTH_NAME_MAX = 400;

/** Tên tham chiếu ngắn hơn (kho, NCC, danh mục, …). */
export const COLUMN_WIDTH_ENTITY_MIN = 168;
export const COLUMN_WIDTH_ENTITY_MAX = 300;

/** Người (ten_nguoi_*). */
export const COLUMN_WIDTH_PERSON_MIN = 152;
export const COLUMN_WIDTH_PERSON_MAX = 248;

/** Ghi chú / mô tả. */
export const COLUMN_WIDTH_NOTE_MIN = 220;
export const COLUMN_WIDTH_NOTE_MAX = 520;

/** Số lượng / thứ tự / cột đếm gọn. */
export const COLUMN_WIDTH_COUNT_MIN = 96;
export const COLUMN_WIDTH_COUNT_MAX = 132;

/** Loại / phân loại. */
export const COLUMN_WIDTH_TYPE_MIN = 108;
export const COLUMN_WIDTH_TYPE_MAX = 168;

/** Đơn vị tính, icon, QR. */
export const COLUMN_WIDTH_COMPACT_MIN = 72;
export const COLUMN_WIDTH_COMPACT_MAX = 108;

const MONEY_COLUMN_IDS = new Set(['so_tien', 'tong_tien', 'thanh_tien', 'don_gia']);

const DOC_CODE_IDS = new Set(['so_phieu', 'ma_dot', 'ma_phieu']);

const NOTE_IDS = new Set(['ghi_chu', 'mo_ta', 'trao_doi']);

const COUNT_IDS = new Set([
  'thu_tu',
  'so_kho',
  'so_hang_hoa',
  'so_lech',
  'tong_so_dong',
  'tong_so_luong',
  'so_luong',
  'so_cay',
  'cap_bac',
]);

const ENTITY_NAME_IDS = new Set([
  'ten_kho',
  'ten_kho_den',
  'ten_nha_cung_cap',
  'ten_khach_hang',
  'ten_chi_nhanh',
  'ten_danh_muc',
  'ten_nhom',
  'ten_hang',
  'ten_hang_hoa',
  'ten_tai_san',
  'ten_noi_luu',
  'ten_cha',
  'ten_noi_luu_truoc',
  'ten_noi_luu_sau',
]);

const TYPE_IDS = new Set(['loai', 'loai_phieu', 'loai_doi_tac', 'loai_phieu_hanh_chinh']);

const COMPACT_IDS = new Set(['dvt', 'don_vi_tinh', 'hinh_anh', 'qr', 'mau', 'actions']);

function isStatusColumnId(id: string): boolean {
  return id === 'trang_thai' || id === 'ten_trang_thai' || id.endsWith('_trang_thai');
}

function isNoteColumnId(id: string): boolean {
  return NOTE_IDS.has(id);
}

function isNameColumnId(id: string): boolean {
  if (isStatusColumnId(id)) return false;
  if (ENTITY_NAME_IDS.has(id)) return false;
  if (id.startsWith('ten_nguoi_')) return false;
  if (id === 'ten_dot' || id === 'ten' || id === 'ho_ten' || id === 'ho_va_ten') return true;
  if (id.startsWith('ten_')) return true;
  return false;
}

function isCodeColumnId(id: string): boolean {
  if (DOC_CODE_IDS.has(id)) return true;
  if (id === 'ma' || id.startsWith('ma_')) return true;
  if (id.startsWith('so_po_')) return true;
  return false;
}

function isPersonColumnId(id: string): boolean {
  return id.startsWith('ten_nguoi_');
}

function isEntityColumnId(id: string): boolean {
  if (ENTITY_NAME_IDS.has(id)) return true;
  if (id.startsWith('ref_ten_')) return true;
  return false;
}

function isCountColumnId(id: string): boolean {
  if (COUNT_IDS.has(id)) return true;
  if (id.startsWith('tong_so_')) return true;
  return false;
}

/**
 * Preset min/max theo id cột (quy ước naming toàn app).
 * Dùng cho style bảng, minWidth khi cuộn ngang, và giới hạn resize.
 */
export function inferColumnSizingPreset(id: string | undefined): { minWidth: number; maxWidth: number } | null {
  if (!id) return null;
  if (id === 'actions') return null;
  if (COMPACT_IDS.has(id)) {
    return { minWidth: COLUMN_WIDTH_COMPACT_MIN, maxWidth: COLUMN_WIDTH_COMPACT_MAX };
  }
  if (id.startsWith('tg_')) {
    return { minWidth: COLUMN_WIDTH_DATETIME_MIN, maxWidth: COLUMN_WIDTH_DATETIME_MAX };
  }
  if (id === 'ngay' || id.startsWith('ngay_')) {
    return { minWidth: COLUMN_WIDTH_DATE_MIN, maxWidth: COLUMN_WIDTH_DATE_MAX };
  }
  if (MONEY_COLUMN_IDS.has(id)) {
    return { minWidth: COLUMN_WIDTH_MONEY_MIN, maxWidth: COLUMN_WIDTH_MONEY_MAX };
  }
  if (isStatusColumnId(id)) {
    return { minWidth: COLUMN_WIDTH_STATUS_MIN, maxWidth: COLUMN_WIDTH_STATUS_MAX };
  }
  if (isNoteColumnId(id)) {
    return { minWidth: COLUMN_WIDTH_NOTE_MIN, maxWidth: COLUMN_WIDTH_NOTE_MAX };
  }
  if (TYPE_IDS.has(id) || id.startsWith('loai_')) {
    return { minWidth: COLUMN_WIDTH_TYPE_MIN, maxWidth: COLUMN_WIDTH_TYPE_MAX };
  }
  if (isCountColumnId(id)) {
    return { minWidth: COLUMN_WIDTH_COUNT_MIN, maxWidth: COLUMN_WIDTH_COUNT_MAX };
  }
  if (isPersonColumnId(id)) {
    return { minWidth: COLUMN_WIDTH_PERSON_MIN, maxWidth: COLUMN_WIDTH_PERSON_MAX };
  }
  if (isCodeColumnId(id)) {
    return { minWidth: COLUMN_WIDTH_CODE_MIN, maxWidth: COLUMN_WIDTH_CODE_MAX };
  }
  if (isEntityColumnId(id)) {
    return { minWidth: COLUMN_WIDTH_ENTITY_MIN, maxWidth: COLUMN_WIDTH_ENTITY_MAX };
  }
  if (isNameColumnId(id)) {
    return { minWidth: COLUMN_WIDTH_NAME_MIN, maxWidth: COLUMN_WIDTH_NAME_MAX };
  }
  if (id === 'dien_thoai' || id === 'email' || id === 'tags') {
    return { minWidth: 128, maxWidth: 220 };
  }
  return null;
}

/** Min width hiệu dụng (đồng bộ với getColumnCellStyle) — dùng cho tableMinWidth / sticky offset. */
export function getEffectiveColumnMinWidth(col: Pick<ColumnConfig, 'id' | 'minWidth'>, fallback = 120): number {
  const preset = inferColumnSizingPreset(col.id);
  const base = col.minWidth ?? fallback;
  return preset ? Math.max(base, preset.minWidth) : base;
}

/** Min/max khi kéo resize cột — tôn trọng preset. */
export function getEffectiveColumnResizeBounds(col: ColumnConfig): { min: number; max: number } {
  const preset = inferColumnSizingPreset(col.id);
  const minBase = col.minWidth ?? 50;
  const min = preset ? Math.max(minBase, preset.minWidth) : minBase;
  const maxBase = col.maxWidth ?? DEFAULT_COLUMN_MAX_WIDTH;
  const max = preset ? Math.max(maxBase, preset.maxWidth) : maxBase;
  return { min, max };
}

/** Cột có preset sizing. */
export function usesColumnSizingPreset(id: string): boolean {
  return inferColumnSizingPreset(id) != null;
}

/** Cột preset nên giữ một dòng (không áp nowrap cho tên / ghi chú dài). */
export function usesColumnNoWrapPreset(id: string): boolean {
  if (!inferColumnSizingPreset(id)) return false;
  return !isNameColumnId(id) && !isNoteColumnId(id);
}

/** Input cho getColumnCellStyle: có thể kèm id để áp preset ngày/giờ. */
export type ColumnStyleInput = Pick<ColumnConfig, 'minWidth' | 'maxWidth'> & { id?: string };

/**
 * Style áp dụng cho th/td theo ColumnConfig (minWidth + maxWidth).
 * Cột có inferColumnSizingPreset được nới tối thiểu & tối đa để tránh xuống dòng.
 */
export function getColumnCellStyle(col: ColumnStyleInput): CSSProperties {
  const preset = inferColumnSizingPreset(col.id);
  const style: CSSProperties = {};
  if (preset) {
    style.minWidth = col.minWidth != null ? Math.max(col.minWidth, preset.minWidth) : preset.minWidth;
    style.maxWidth = col.maxWidth != null ? Math.max(col.maxWidth, preset.maxWidth) : preset.maxWidth;
  } else {
    if (col.minWidth != null) style.minWidth = col.minWidth;
    if (col.maxWidth != null) style.maxWidth = col.maxWidth;
    else style.maxWidth = DEFAULT_COLUMN_MAX_WIDTH;
  }
  return style;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

export interface GenericState<TFilters> {
  // Data State
  searchTerm: string;
  filters: TFilters;
  pagination: PaginationState;
  sort: SortState;
  
  // UI State
  selectedIds: Set<string>;
  columns: ColumnConfig[];
  
  // Actions — commitSearchTerm / setSearchTerm: cập nhật search + reset trang 1 (gọi sau debounce từ toolbar)
  commitSearchTerm: (term: string) => void;
  setSearchTerm: (term: string) => void;
  setFilter: (key: keyof TFilters, value: any) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleSelection: (id: string) => void;
  toggleAllSelection: (ids: string[]) => void;
  clearSelection: () => void;
  toggleColumn: (id: string) => void;
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  resizeColumn: (id: string, width: number) => void;
  resetColumns: () => void;
  setSort: (column: string | null, direction: 'asc' | 'desc' | null) => void;
  resetState: () => void;
}

export const createGenericStore = <TFilters>(
  initialFilters: TFilters,
  defaultColumns: ColumnConfig[]
) => create<GenericState<TFilters>>((set) => ({
  searchTerm: '',
  filters: initialFilters,
  pagination: {
    page: 1,
    pageSize: 20,
  },
  sort: {
    column: null,
    direction: null,
  },
  selectedIds: new Set(),
  columns: defaultColumns.map((col, i) => ({ ...col, order: col.order ?? i })),

  commitSearchTerm: (term) =>
    set((state) => ({
      searchTerm: term,
      pagination: { page: 1, pageSize: state.pagination.pageSize },
    })),
  setSearchTerm: (term) =>
    set((state) => ({
      searchTerm: term,
      pagination: { page: 1, pageSize: state.pagination.pageSize },
    })),
  
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value },
    pagination: { ...state.pagination, page: 1 }
  })),

  resetFilters: () => set((state) => ({ 
    filters: initialFilters,
    pagination: { ...state.pagination, page: 1 }
  })),

  setPage: (page) => set((state) => ({ pagination: { ...state.pagination, page } })),
  
  setPageSize: (pageSize) => set((state) => ({ pagination: { ...state.pagination, pageSize, page: 1 } })),

  toggleSelection: (id) => set((state) => {
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    return { selectedIds: newSelected };
  }),

  toggleAllSelection: (ids) => set((state) => {
    const allSelected = ids.every(id => state.selectedIds.has(id));
    const newSelected = new Set(state.selectedIds);
    
    if (allSelected) {
      ids.forEach(id => newSelected.delete(id));
    } else {
      ids.forEach(id => newSelected.add(id));
    }
    return { selectedIds: newSelected };
  }),

  clearSelection: () => set({ selectedIds: new Set() }),

  toggleColumn: (id) => set((state) => ({
    columns: state.columns.map(col => 
      col.id === id ? { ...col, visible: !col.visible } : col
    )
  })),

  reorderColumns: (fromIndex, toIndex) => set((state) => {
    const sorted = [...state.columns].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    return {
      columns: sorted.map((col, i) => ({ ...col, order: i }))
    };
  }),

  resizeColumn: (id, width) => set((state) => ({
    columns: state.columns.map(col => {
      if (col.id !== id) return col;
      const { min, max } = getEffectiveColumnResizeBounds(col);
      return { ...col, width: Math.min(Math.max(width, min), max) };
    })
  })),

  resetColumns: () => set({
    columns: defaultColumns.map((col, i) => ({ ...col, order: col.order ?? i }))
  }),

  setSort: (column, direction) => set({ sort: { column, direction } }),

  resetState: () => set({
    searchTerm: '',
    filters: initialFilters,
    pagination: { page: 1, pageSize: 20 },
    sort: { column: null, direction: null },
    selectedIds: new Set(),
    columns: defaultColumns.map((col, i) => ({ ...col, order: col.order ?? i }))
  })
}));
