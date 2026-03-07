/**
 * Tồn kho theo (kho, hàng hóa). Mock in-memory; cập nhật khi lưu/xóa phiếu.
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface TonKhoRecord {
  id_kho: string;
  id_hang_hoa: string;
  so_luong: number;
}

const key = (id_kho: string, id_hang_hoa: string) => `${id_kho}|${id_hang_hoa}`;

/** Seed: kho-1, kho-2 × một số hàng hóa (hh-1..hh-8) với tồn ban đầu. Một vài mục dưới định mức để test cảnh báo. */
const seed: TonKhoRecord[] = [
  { id_kho: 'kho-1', id_hang_hoa: 'hh-1', so_luong: 100 },
  { id_kho: 'kho-1', id_hang_hoa: 'hh-2', so_luong: 250 },
  { id_kho: 'kho-1', id_hang_hoa: 'hh-3', so_luong: 180 },
  { id_kho: 'kho-1', id_hang_hoa: 'hh-4', so_luong: 15 },
  { id_kho: 'kho-1', id_hang_hoa: 'hh-5', so_luong: 120 },
  { id_kho: 'kho-1', id_hang_hoa: 'hh-6', so_luong: 10 },
  { id_kho: 'kho-1', id_hang_hoa: 'hh-7', so_luong: 200 },
  { id_kho: 'kho-1', id_hang_hoa: 'hh-8', so_luong: 80 },
  { id_kho: 'kho-2', id_hang_hoa: 'hh-1', so_luong: 40 },
  { id_kho: 'kho-2', id_hang_hoa: 'hh-2', so_luong: 60 },
  { id_kho: 'kho-2', id_hang_hoa: 'hh-3', so_luong: 90 },
  { id_kho: 'kho-2', id_hang_hoa: 'hh-4', so_luong: 8 },
  { id_kho: 'kho-2', id_hang_hoa: 'hh-5', so_luong: 25 },
  { id_kho: 'kho-2', id_hang_hoa: 'hh-6', so_luong: 5 },
  { id_kho: 'kho-2', id_hang_hoa: 'hh-7', so_luong: 150 },
  { id_kho: 'kho-2', id_hang_hoa: 'hh-8', so_luong: 50 },
];

const store = new Map<string, number>();
seed.forEach((r) => store.set(key(r.id_kho, r.id_hang_hoa), r.so_luong));

/** Lấy số lượng tồn tại (kho, hàng). Trả về 0 nếu chưa có bản ghi. */
export async function getTonKho(id_kho: string, id_hang_hoa: string): Promise<number> {
  await delay(100);
  return store.get(key(id_kho, id_hang_hoa)) ?? 0;
}

/** Lấy toàn bộ tồn theo một kho (để hiển thị trong form). */
export async function getTonKhoTheoKho(id_kho: string): Promise<{ id_hang_hoa: string; so_luong: number }[]> {
  await delay(150);
  const result: { id_hang_hoa: string; so_luong: number }[] = [];
  store.forEach((so_luong, k) => {
    const [kho] = k.split('|');
    if (kho === id_kho) {
      const id_hang_hoa = k.slice(kho.length + 1);
      result.push({ id_hang_hoa, so_luong });
    }
  });
  return result;
}

/** Lấy toàn bộ bản ghi tồn (cho module Tồn kho). Nếu store rỗng thì trả về seed mẫu để list view có dữ liệu. */
export async function getAllTonKho(): Promise<TonKhoRecord[]> {
  await delay(200);
  const result: TonKhoRecord[] = [];
  store.forEach((so_luong, k) => {
    const [id_kho, id_hang_hoa] = k.split('|');
    result.push({ id_kho, id_hang_hoa, so_luong });
  });
  if (result.length === 0) {
    seed.forEach((r) => result.push({ ...r }));
  }
  return result;
}

/** Lấy tồn theo từng nơi lưu cho một hàng hóa (chi tiết sản phẩm). */
export async function getTonKhoTheoHangHoa(
  id_hang_hoa: string
): Promise<{ id_kho: string; so_luong: number }[]> {
  await delay(150);
  const result: { id_kho: string; so_luong: number }[] = [];
  store.forEach((so_luong, k) => {
    const idx = k.indexOf('|');
    const id_kho = k.slice(0, idx);
    const id_hh = k.slice(idx + 1);
    if (id_hh === id_hang_hoa) result.push({ id_kho, so_luong });
  });
  return result;
}

/**
 * Cập nhật tồn: so_luong_moi = so_luong_hien_tai + bien_dong.
 * bien_dong > 0: cộng (nhập), < 0: trừ (xuất).
 * Cho phép tồn âm trong mock (chỉ cảnh báo UI).
 */
export function capNhatTonKho(id_kho: string, id_hang_hoa: string, bien_dong: number): void {
  const k = key(id_kho, id_hang_hoa);
  const current = store.get(k) ?? 0;
  store.set(k, current + bien_dong);
}
