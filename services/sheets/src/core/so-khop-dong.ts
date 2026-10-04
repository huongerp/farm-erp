/**
 * So khớp bảng đang có trên Sheet với dữ liệu mới → kế hoạch ghi tối thiểu (sửa / thêm / xoá
 * từng dòng) thay vì ghi lại toàn bộ. Khoá là cột A (`id`).
 *
 * Không dựa vào `tg_cap_nhat`: view tổng hợp (phiếu + dòng chi tiết) đổi số liệu mà dòng cha
 * không đổi `tg_cap_nhat`. So thẳng giá trị là cách duy nhất không sót.
 */
import type { OSheet } from './bang-tinh.ts';

export interface KeHoachGhi {
  /** `dong` tính từ 1 (dòng 1 là header). */
  capNhat: { dong: number; values: OSheet[] }[];
  them: OSheet[][];
  /** Số dòng (từ 1) cần xoá, GIẢM DẦN — xoá từ dưới lên để chỉ số dòng phía trên không xê dịch. */
  xoa: number[];
}

function chuanHoa(o: unknown): OSheet {
  if (o === null || o === undefined) return '';
  if (typeof o === 'number') return Number.isFinite(o) ? o : '';
  if (typeof o === 'boolean') return o ? 'TRUE' : 'FALSE';
  return String(o);
}

function bang(a: OSheet, b: OSheet): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a));
  }
  return a === b;
}

function khoa(o: unknown): string {
  return String(chuanHoa(o)).trim();
}

/**
 * @param hienCo các dòng TỪ DÒNG 2 của tab (API bỏ ô trống cuối dòng → tự đệm), chỉ phạm vi
 *               cột của bảng — cột người dùng thêm bên phải không được so, không bị đụng.
 * @param mongMuon dữ liệu mới, mỗi dòng đúng `soCot` ô, ô đầu là id.
 */
export function soKhopDong(hienCo: readonly (readonly unknown[])[], mongMuon: readonly OSheet[][], soCot: number): KeHoachGhi {
  const viTri = new Map<string, number>();
  const xoa: number[] = [];

  hienCo.forEach((row, i) => {
    const dong = i + 2;
    const k = khoa(row[0]);
    // Dòng không có id (dòng trống giữa bảng) hoặc id trùng → rác trong bảng, xoá.
    if (k === '' || viTri.has(k)) xoa.push(dong);
    else viTri.set(k, i);
  });

  const capNhat: KeHoachGhi['capNhat'] = [];
  const them: OSheet[][] = [];
  const conDung = new Set<string>();

  for (const moi of mongMuon) {
    const k = khoa(moi[0]);
    const i = viTri.get(k);
    if (i === undefined || conDung.has(k)) {
      them.push(moi);
      continue;
    }
    conDung.add(k);
    const cu = hienCo[i]!;
    let khac = false;
    for (let c = 0; c < soCot; c++) {
      if (!bang(chuanHoa(cu[c]), moi[c] ?? '')) {
        khac = true;
        break;
      }
    }
    if (khac) capNhat.push({ dong: i + 2, values: moi });
  }

  for (const [k, i] of viTri) if (!conDung.has(k)) xoa.push(i + 2);
  xoa.sort((a, b) => b - a);
  return { capNhat, them, xoa };
}

/** Gộp các dòng xoá liền nhau thành khoảng `[batDau, ketThuc)` (chỉ số 0, như deleteDimension), giảm dần. */
export function gopKhoangXoa(xoaGiamDan: readonly number[]): { batDau: number; ketThuc: number }[] {
  const out: { batDau: number; ketThuc: number }[] = [];
  for (const dong of xoaGiamDan) {
    const idx = dong - 1;
    const cuoi = out[out.length - 1];
    if (cuoi && cuoi.batDau === idx + 1) cuoi.batDau = idx;
    else out.push({ batDau: idx, ketThuc: idx + 1 });
  }
  return out;
}

/** Thay đổi quá nhiều thì ghi lại toàn bộ rẻ hơn hàng nghìn range lẻ. */
export function nenGhiLaiToanBo(k: KeHoachGhi, tongDong: number): boolean {
  const soThayDoi = k.capNhat.length + k.them.length + k.xoa.length;
  return soThayDoi > 2_000 || (tongDong > 50 && soThayDoi > tongDong * 0.3);
}
