/**
 * Cài đặt in lưu trên MÁY (localStorage `phieu-in-cai-dat`) theo mẫu (`mauKey`, vd `phieu-kho`).
 * CHỈ lưu phần khác mặc định của mẫu (`phanKhacMacDinh`) — đổi mặc định trong code thì người
 * chưa từng chỉnh vẫn nhận mặc định mới. Bản lưu cũ (v1, có `leMm`) được `chuanHoaCaiDatIn` đọc
 * thành lề đều, lần chỉnh sau ghi lại theo dạng mới.
 */
import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { chuanHoaCaiDatIn, phanKhacMacDinh, type CaiDatIn, type MacDinhMau } from './cai-dat-in';

interface CaiDatInState {
  theoMau: Record<string, Partial<CaiDatIn>>;
  dat: (mauKey: string, phan: Partial<CaiDatIn>) => void;
  xoa: (mauKey: string) => void;
}

export const useCaiDatInStore = create<CaiDatInState>()(
  persist(
    (set) => ({
      theoMau: {},
      dat: (mauKey, phan) =>
        set((s) => {
          const theoMau = { ...s.theoMau };
          if (Object.keys(phan).length === 0) delete theoMau[mauKey];
          else theoMau[mauKey] = phan;
          return { theoMau };
        }),
      xoa: (mauKey) =>
        set((s) => {
          const theoMau = { ...s.theoMau };
          delete theoMau[mauKey];
          return { theoMau };
        }),
    }),
    { name: 'phieu-in-cai-dat', version: 1 }
  )
);

/** Cài đặt in đã chuẩn hoá của một mẫu + hàm đổi (nhận hàm sửa trên bản mới nhất). */
export function useCaiDatIn(mauKey: string, macDinh: MacDinhMau = {}) {
  const luu = useCaiDatInStore((s) => s.theoMau[mauKey]);
  const dat = useCaiDatInStore((s) => s.dat);
  const xoa = useCaiDatInStore((s) => s.xoa);
  const khoaMacDinh = JSON.stringify(macDinh);
  // So theo NỘI DUNG mặc định, không theo tham chiếu object (trang hay truyền literal mới mỗi render).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const md = useMemo(() => macDinh, [khoaMacDinh]);
  const caiDat = useMemo(() => chuanHoaCaiDatIn(luu, md), [luu, md]);

  const doi = useCallback(
    (sua: (c: CaiDatIn) => CaiDatIn) => {
      const cu = chuanHoaCaiDatIn(useCaiDatInStore.getState().theoMau[mauKey], md);
      dat(mauKey, phanKhacMacDinh(chuanHoaCaiDatIn(sua(cu), md), md));
    },
    [dat, mauKey, md]
  );
  const khoiPhuc = useCallback(() => xoa(mauKey), [xoa, mauKey]);
  const coThayDoi = !!luu && Object.keys(phanKhacMacDinh(caiDat, md)).length > 0;

  return { caiDat, doi, khoiPhuc, coThayDoi };
}
