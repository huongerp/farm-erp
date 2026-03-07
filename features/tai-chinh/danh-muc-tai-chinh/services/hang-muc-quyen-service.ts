import type { HangMucQuyen } from '../../core/types';

export interface HangMucQuyenByLoai {
  quan_ly: string[];
  de_xuat: string[];
}

let db: HangMucQuyen[] = [
  { id: 'q1', id_hang_muc: 'dm-thu-1', id_chuc_vu: 'pos-30', loai_quyen: 'quan_ly' },
  { id: 'q2', id_hang_muc: 'dm-thu-1', id_chuc_vu: 'pos-32', loai_quyen: 'de_xuat' },
  { id: 'q3', id_hang_muc: 'dm-chi-2', id_chuc_vu: 'pos-30', loai_quyen: 'quan_ly' },
  { id: 'q4', id_hang_muc: 'dm-chi-2', id_chuc_vu: 'pos-31', loai_quyen: 'de_xuat' },
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Lấy toàn bộ phân quyền (dùng cho list view). */
export const getAllQuyen = async (): Promise<HangMucQuyen[]> => {
  await delay(150);
  return [...db];
};

export const getQuyenByHangMuc = async (id_hang_muc: string): Promise<HangMucQuyenByLoai> => {
  await delay(200);
  const list = db.filter((q) => q.id_hang_muc === id_hang_muc);
  return {
    quan_ly: list.filter((q) => q.loai_quyen === 'quan_ly').map((q) => q.id_chuc_vu),
    de_xuat: list.filter((q) => q.loai_quyen === 'de_xuat').map((q) => q.id_chuc_vu),
  };
};

export const setQuyenHangMuc = async (
  id_hang_muc: string,
  loai_quyen: 'quan_ly' | 'de_xuat',
  id_chuc_vu_list: string[]
): Promise<void> => {
  await delay(400);
  db = db.filter((q) => !(q.id_hang_muc === id_hang_muc && q.loai_quyen === loai_quyen));
  const newRows: HangMucQuyen[] = id_chuc_vu_list.map((id_chuc_vu, i) => ({
    id: `q-${id_hang_muc}-${loai_quyen}-${Date.now()}-${i}`,
    id_hang_muc,
    id_chuc_vu,
    loai_quyen,
  }));
  db = [...db, ...newRows];
}
