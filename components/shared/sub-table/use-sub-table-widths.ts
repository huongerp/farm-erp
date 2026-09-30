import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Bề rộng cột do người dùng kéo ở các bảng con trong drawer (`SubTable`).
 *
 * Một store chung, khoá theo `tableKey` (vd. `kiem-ke-kho.chi-tiet`) — bảng con
 * chỉ cần nhớ bề rộng, không có ẩn/hiện hay thứ tự cột như bảng chính, nên không
 * đáng một store `createGenericStore` riêng cho mỗi bảng.
 */
interface SubTableWidthsState {
  widths: Record<string, Record<string, number>>;
  setWidth: (tableKey: string, colId: string, width: number) => void;
  resetTable: (tableKey: string) => void;
}

export const useSubTableWidthsStore = create<SubTableWidthsState>()(
  persist(
    (set) => ({
      widths: {},
      setWidth: (tableKey, colId, width) =>
        set((s) => ({
          widths: { ...s.widths, [tableKey]: { ...s.widths[tableKey], [colId]: Math.round(width) } },
        })),
      resetTable: (tableKey) =>
        set((s) => {
          const next = { ...s.widths };
          delete next[tableKey];
          return { widths: next };
        }),
    }),
    { name: 'table-sub-widths', version: 1 }
  )
);

const EMPTY: Record<string, number> = {};

export function useSubTableWidths(tableKey: string) {
  const widths = useSubTableWidthsStore((s) => s.widths[tableKey] ?? EMPTY);
  const setWidth = useSubTableWidthsStore((s) => s.setWidth);
  return { widths, setWidth: (colId: string, width: number) => setWidth(tableKey, colId, width) };
}
