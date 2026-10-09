import React, { createContext, useContext } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import {
  BIEN_THE_PHAN_THUOC,
  BIEN_THE_SO_CHE,
  type KhoBienThe,
  type KhoBienTheKey,
} from './bien-the';

/** Mặc định sơ chế: module ngoài nhóm kho (GSCL, Đăng ký nhận hàng) dùng hook hàng hoá không cần bọc. */
const KhoBienTheContext = createContext<KhoBienThe>(BIEN_THE_SO_CHE);

export function KhoBienTheProvider({ value, children }: { value: KhoBienThe; children: React.ReactNode }) {
  return <KhoBienTheContext.Provider value={value}>{children}</KhoBienTheContext.Provider>;
}

export function useKhoBienThe(): KhoBienThe {
  return useContext(KhoBienTheContext);
}

/** Hook store dùng như store zustand thường (`useX()` / `useX(selector)`), nhưng mỗi biến thể một store. */
export interface StoreTheoBienThe<S> {
  (): S;
  <U>(selector: (s: S) => U): U;
}

/**
 * Tạo sẵn một store cho mỗi biến thể và trả hook chọn store theo context —
 * bộ lọc, chọn dòng, cấu hình cột của Phân thuốc không rò sang Sơ chế.
 */
export function storeTheoBienThe<S>(
  tao: (bt: KhoBienThe) => UseBoundStore<StoreApi<S>>
): StoreTheoBienThe<S> {
  const stores: Record<KhoBienTheKey, UseBoundStore<StoreApi<S>>> = {
    'so-che': tao(BIEN_THE_SO_CHE),
    'phan-thuoc': tao(BIEN_THE_PHAN_THUOC),
  };
  function useStoreTheoBienThe<U>(selector?: (s: S) => U) {
    const { key } = useKhoBienThe();
    return selector ? stores[key](selector) : stores[key]();
  }
  return useStoreTheoBienThe as StoreTheoBienThe<S>;
}
