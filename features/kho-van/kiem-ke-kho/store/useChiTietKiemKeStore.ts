import { create } from 'zustand';
import type { ColumnConfig, GenericState } from '../../../../store/createGenericStore';
import { DEFAULT_COLUMN_MAX_WIDTH } from '../../../../store/createGenericStore';
import i18n from '../../../../lib/i18n';

export interface ChiTietKiemKeFilters {
  ket_qua: string[];
  id_kho: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_kho', label: i18n.t('kiemKeKho.store.khoCol'), visible: true, minWidth: 120, order: 0 },
  { id: 'ten_hang', label: i18n.t('kiemKeKho.store.hangHoaCol'), visible: true, minWidth: 160, order: 1 },
  { id: 'so_luong_so', label: i18n.t('kiemKeKho.store.soLuongSoCol'), visible: true, minWidth: 80, order: 2 },
  { id: 'so_luong_thuc_te', label: i18n.t('kiemKeKho.store.soLuongThucTeCol'), visible: true, minWidth: 80, order: 3 },
  { id: 'ket_qua', label: i18n.t('kiemKeKho.store.ketQuaCol'), visible: true, minWidth: 90, order: 4 },
  { id: 'don_vi_tinh', label: i18n.t('kiemKeKho.store.dvtCol'), visible: false, minWidth: 70, order: 5 },
  { id: 'ghi_chu_dong', label: i18n.t('kiemKeKho.store.ghiChuCol'), visible: false, minWidth: 120, order: 6 },
];

const initialFilters: ChiTietKiemKeFilters = {
  ket_qua: [],
  id_kho: [],
};

const CHILD_PAGE_SIZE = 10;

export const useChiTietKiemKeStore = create<GenericState<ChiTietKiemKeFilters>>((set) => ({
  searchTerm: '',
  filters: initialFilters,
  pagination: { page: 1, pageSize: CHILD_PAGE_SIZE },
  sort: { column: null, direction: null },
  selectedIds: new Set(),
  columns: DEFAULT_COLUMNS.map((col, i) => ({ ...col, order: col.order ?? i })),

  setSearchTerm: (term) => set((state) => ({ searchTerm: term, pagination: { page: 1, pageSize: state.pagination.pageSize } })),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value }, pagination: { ...state.pagination, page: 1 } })),
  resetFilters: () => set((state) => ({ filters: initialFilters, pagination: { ...state.pagination, page: 1 } })),
  setPage: (page) => set((state) => ({ pagination: { ...state.pagination, page } })),
  setPageSize: (pageSize) => set(() => ({ pagination: { pageSize, page: 1 } })),
  toggleSelection: (id) => set((state) => {
    const s = new Set(state.selectedIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    return { selectedIds: s };
  }),
  toggleAllSelection: (ids) => set((state) => {
    const allSelected = ids.every((id) => state.selectedIds.has(id));
    const s = new Set(state.selectedIds);
    if (allSelected) ids.forEach((id) => s.delete(id)); else ids.forEach((id) => s.add(id));
    return { selectedIds: s };
  }),
  clearSelection: () => set({ selectedIds: new Set() }),
  toggleColumn: (id) => set((state) => ({ columns: state.columns.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)) })),
  reorderColumns: (fromIndex, toIndex) => set((state) => {
    const sorted = [...state.columns].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    return { columns: sorted.map((c, i) => ({ ...c, order: i })) };
  }),
  resizeColumn: (id, width) => set((state) => ({
    columns: state.columns.map((c) => {
      if (c.id !== id) return c;
      const min = c.minWidth ?? 50;
      const max = c.maxWidth ?? DEFAULT_COLUMN_MAX_WIDTH;
      return { ...c, width: Math.min(Math.max(width, min), max) };
    }),
  })),
  resetColumns: () => set({ columns: DEFAULT_COLUMNS.map((c, i) => ({ ...c, order: c.order ?? i })) }),
  setSort: (column, direction) => set({ sort: { column, direction } }),
  resetState: () => set({
    searchTerm: '',
    filters: initialFilters,
    pagination: { page: 1, pageSize: CHILD_PAGE_SIZE },
    sort: { column: null, direction: null },
    selectedIds: new Set(),
    columns: DEFAULT_COLUMNS.map((c, i) => ({ ...c, order: c.order ?? i })),
  }),
}));
