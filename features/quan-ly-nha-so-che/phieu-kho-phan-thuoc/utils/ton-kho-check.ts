/**
 * Phát hiện phiếu làm tồn kho âm (xuất / chuyển vượt tồn, hoặc sửa phiếu nhập xuống dưới số đã xuất)
 * để CẢNH BÁO — phiếu vẫn được lưu, không chặn. Thuần, không db → test trực tiếp.
 *
 * Công thức khớp view `v_farm_ton_kho_phan_thuoc`: nhập +kho; xuất −kho; chuyển −kho nguồn +kho đích;
 * phiếu "Không duyệt" không tính. Tồn tính cả phiếu "Chờ duyệt" nên phiếu chờ duyệt cũng giữ chỗ.
 */
import type { LoaiPhieuKhoPT } from '../core/types';

/** Khoá `${id_kho}|${id_hang_hoa}` → số lượng. */
export type TonMap = Map<string, number>;

export interface PhieuDeltaInput {
  loai: LoaiPhieuKhoPT;
  kho_id: string | number;
  kho_den_id?: string | number | null;
  trang_thai?: string;
  lines: { id_hang_hoa: string | number; so_luong: number }[];
}

export interface VuotTon {
  id_kho: string;
  id_hang_hoa: string;
  /** Tồn khả dụng cho phiếu này (đã trừ phần của chính phiếu cũ khi sửa). */
  ton: number;
  /** Số lượng phiếu cần lấy ra. */
  can: number;
}

/** Sai số của numeric(18,4) khi cộng số thực. */
const EPS = 1e-6;

export const tonKey = (idKho: string | number, idHang: string | number) => `${idKho}|${idHang}`;

export function buildTonMap(rows: { id_kho: string; id_hang_hoa: string; so_luong: number }[]): TonMap {
  const map: TonMap = new Map();
  rows.forEach((r) => map.set(tonKey(r.id_kho, r.id_hang_hoa), (map.get(tonKey(r.id_kho, r.id_hang_hoa)) ?? 0) + r.so_luong));
  return map;
}

/** Phần phiếu đóng góp vào tồn theo từng (kho, hàng). */
export function phieuDelta(p: PhieuDeltaInput): TonMap {
  const out: TonMap = new Map();
  if (p.trang_thai === 'Không duyệt') return out;
  const add = (kho: string | number, hang: string | number, v: number) => {
    const k = tonKey(kho, hang);
    out.set(k, (out.get(k) ?? 0) + v);
  };
  p.lines.forEach((l) => {
    const sl = Number(l.so_luong) || 0;
    if (sl <= 0) return;
    if (p.loai === 'nhập') add(p.kho_id, l.id_hang_hoa, sl);
    else if (p.loai === 'xuất') add(p.kho_id, l.id_hang_hoa, -sl);
    else if (p.kho_den_id != null && String(p.kho_den_id) !== '') {
      add(p.kho_id, l.id_hang_hoa, -sl);
      add(p.kho_den_id, l.id_hang_hoa, sl);
    }
  });
  return out;
}

/**
 * Các (kho, hàng) mà phiếu mới làm tồn giảm xuống dưới 0.
 * Khi sửa, truyền `oldDelta` của phiếu cũ — phần đó đang nằm trong tồn nên phải trừ ra trước.
 * Chỉ báo chỗ phiếu làm tồn GIẢM: tồn đã âm sẵn mà phiếu không đụng tới thì không báo.
 */
export function findVuotTon(ton: TonMap, newDelta: TonMap, oldDelta: TonMap = new Map()): VuotTon[] {
  const keys = new Set([...newDelta.keys(), ...oldDelta.keys()]);
  const out: VuotTon[] = [];
  keys.forEach((k) => {
    const oldV = oldDelta.get(k) ?? 0;
    const newV = newDelta.get(k) ?? 0;
    if (newV - oldV >= -EPS) return;
    const available = (ton.get(k) ?? 0) - oldV;
    if (available + newV >= -EPS) return;
    const [id_kho, id_hang_hoa] = k.split('|');
    out.push({ id_kho, id_hang_hoa, ton: Math.max(0, available), can: -newV });
  });
  return out;
}

/** Cộng phiếu vừa ghi vào tồn — import nhiều phiếu thì phiếu sau thấy phần phiếu trước đã lấy. */
export function applyDelta(ton: TonMap, delta: TonMap): void {
  delta.forEach((v, k) => ton.set(k, (ton.get(k) ?? 0) + v));
}

/** Kho bị phiếu làm giảm tồn — chỉ cần tải tồn của các kho này. */
export function khoCanKiemTra(...deltas: TonMap[]): string[] {
  const ids = new Set<string>();
  deltas.forEach((d) => d.forEach((_v, k) => ids.add(k.split('|')[0])));
  return [...ids];
}
