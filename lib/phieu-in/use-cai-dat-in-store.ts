import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CaiDatIn } from './cai-dat-in';

/**
 * Cài đặt in người dùng đã đổi, khoá theo mẫu (`mauKey`, vd `phieu-kho`). Chỉ lưu phần ĐÃ
 * ĐỔI — phần còn lại lấy mặc định của mẫu lúc dùng (`chuanHoaCaiDatIn`), nên đổi mặc định
 * trong code vẫn ăn với người chưa từng chỉnh.
 */
interface CaiDatInState {
  theoMau: Record<string, Partial<CaiDatIn>>;
  datCaiDat: (mauKey: string, patch: Partial<Omit<CaiDatIn, 'cot'>>) => void;
  datCot: (mauKey: string, bang: string, rong: number[]) => void;
  datLaiCot: (mauKey: string, bang?: string) => void;
  khoiPhucMacDinh: (mauKey: string) => void;
}

export const useCaiDatInStore = create<CaiDatInState>()(
  persist(
    (set) => ({
      theoMau: {},
      datCaiDat: (mauKey, patch) =>
        set((s) => ({ theoMau: { ...s.theoMau, [mauKey]: { ...s.theoMau[mauKey], ...patch } } })),
      datCot: (mauKey, bang, rong) =>
        set((s) => {
          const cu = s.theoMau[mauKey] ?? {};
          return { theoMau: { ...s.theoMau, [mauKey]: { ...cu, cot: { ...cu.cot, [bang]: rong } } } };
        }),
      datLaiCot: (mauKey, bang) =>
        set((s) => {
          const cu = s.theoMau[mauKey];
          if (!cu?.cot) return s;
          let cot: Record<string, number[]> | undefined;
          if (bang != null) {
            cot = { ...cu.cot };
            delete cot[bang];
          }
          return { theoMau: { ...s.theoMau, [mauKey]: { ...cu, cot } } };
        }),
      khoiPhucMacDinh: (mauKey) =>
        set((s) => {
          const next = { ...s.theoMau };
          delete next[mauKey];
          return { theoMau: next };
        }),
    }),
    { name: 'phieu-in-cai-dat', version: 1 }
  )
);
