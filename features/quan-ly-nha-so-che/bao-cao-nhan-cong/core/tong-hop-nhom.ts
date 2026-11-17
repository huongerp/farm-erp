/**
 * Chia chuyền thành nhóm (Nhóm 1, Nhóm 2…) để so năng suất — nhóm đổi theo ngày, lưu ở `so_nhom` của từng người.
 * NULL = chưa chia nhóm.
 */
import { gonTen } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';
import { CONG_THEO_CHAM_CONG, type NvFormRow } from './danh-sach-nv';

export const SO_NHOM_TOI_DA = 9;

type DongNhom = Pick<NvFormRow, 'ho_ten' | 'cham_cong' | 'so_gio_cong' | 'so_gio_tc'> & { so_nhom: number | null };

export interface TongHopNhom<T> {
  soNhom: number | null;
  soNguoi: number;
  /** Không tính người nghỉ cả ngày. */
  soNguoiDiLam: number;
  /** Công quy đổi (cả ngày 1, nửa ngày ½). */
  cong: number;
  gioCong: number;
  gioTc: number;
  nhanVien: T[];
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Gom người có tên theo số nhóm tăng dần, «chưa chia nhóm» xếp cuối; trong nhóm giữ thứ tự gặp. */
export function tongHopTheoNhom<T extends DongNhom>(ds: readonly T[]): TongHopNhom<T>[] {
  const theoNhom = new Map<number | null, TongHopNhom<T>>();
  for (const r of ds) {
    if (gonTen(r.ho_ten) == null) continue;
    const soNhom = r.so_nhom ?? null;
    let g = theoNhom.get(soNhom);
    if (!g) {
      g = { soNhom, soNguoi: 0, soNguoiDiLam: 0, cong: 0, gioCong: 0, gioTc: 0, nhanVien: [] };
      theoNhom.set(soNhom, g);
    }
    g.soNguoi += 1;
    if (r.cham_cong !== 'NGHI') g.soNguoiDiLam += 1;
    g.cong += CONG_THEO_CHAM_CONG[r.cham_cong];
    g.gioCong += num(r.so_gio_cong);
    g.gioTc += num(r.so_gio_tc);
    g.nhanVien.push(r);
  }
  return [...theoNhom.values()].sort((a, b) => (a.soNhom ?? Infinity) - (b.soNhom ?? Infinity));
}

/**
 * Đọc số nhóm từ ô nhập / Excel: trống → null (chưa chia nhóm); 1–9 (cả «2», « 9 », «Nhóm 2») → số;
 * còn lại → undefined (không hợp lệ).
 */
export function docSoNhom(v: unknown): number | null | undefined {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isInteger(v) && v >= 1 && v <= SO_NHOM_TOI_DA ? v : undefined;
  const s = String(v).trim();
  if (!s) return null;
  const m = /^(?:nhóm\s*)?(\d+)$/iu.exec(s.normalize('NFC'));
  if (!m) return undefined;
  const n = Number(m[1]);
  return n >= 1 && n <= SO_NHOM_TOI_DA ? n : undefined;
}
