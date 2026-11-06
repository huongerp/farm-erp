/**
 * Độ rộng + ẩn cột bảng in (thuần). Bảng được đánh số `data-in-bang="i"` trong nội dung nguồn
 * (`luoi-bang.ts`, đánh số trong TỪNG liên / chứng từ); mọi thay đổi đi qua CSS nên áp được cho
 * cả các mảnh bảng paged.js đã tách trang và cho bảng i của mọi liên.
 */
import { COT_MIN_PCT } from './cai-dat-in';

const tron2 = (x: number) => Math.round(x * 100) / 100;

/** Chia đều 100% cho n cột. */
export function chiaDeu(n: number): number[] {
  if (n <= 0) return [];
  const moi = Math.floor(10000 / n) / 100;
  const ds = Array.from({ length: n }, () => moi);
  ds[n - 1] = tron2(100 - moi * (n - 1));
  return ds;
}

/** Đưa bề rộng đo được (px hay % lệch) về % tổng đúng 100, mỗi cột ≥ `COT_MIN_PCT`. */
export function chuanHoaPhanTram(rong: readonly number[]): number[] {
  const n = rong.length;
  if (n === 0) return [];
  const tong = rong.reduce((s, x) => s + Math.max(0, x), 0);
  if (tong <= 0) return chiaDeu(n);
  let ds = rong.map((x) => Math.max(COT_MIN_PCT, (Math.max(0, x) / tong) * 100));
  const tong2 = ds.reduce((s, x) => s + x, 0);
  ds = ds.map((x) => tron2((x / tong2) * 100));
  // Dồn sai số làm tròn vào cột cuối để tổng đúng 100.
  ds[n - 1] = tron2(ds[n - 1] + (100 - ds.reduce((s, x) => s + x, 0)));
  return ds;
}

/**
 * Kéo mép phải cột `i` thêm `delta` (%): cột i rộng ra, cột KẾ TIẾP đang hiện hẹp lại đúng
 * chừng đó — tổng giữ 100, bảng không tràn khổ. Cột ẩn (`an`) bị bỏ qua khi tìm cột kế.
 */
export function keoCot(
  pct: readonly number[],
  i: number,
  delta: number,
  an: readonly number[] = [],
  minPct = COT_MIN_PCT
): number[] {
  const ds = [...pct];
  let j = i + 1;
  while (j < ds.length && an.includes(j)) j++;
  if (i < 0 || j >= ds.length) return ds;
  const d = Math.max(minPct - ds[i], Math.min(ds[j] - minPct, delta));
  if (d === 0) return ds;
  const tong = ds[i] + ds[j];
  ds[i] = tron2(ds[i] + d);
  ds[j] = tron2(tong - ds[i]);
  return ds;
}

/** Độ rộng hiển thị khi có cột ẩn: cột ẩn = 0, phần của nó CHIA LẠI theo tỉ lệ cho cột còn lại. */
export function doRongHienThi(pct: readonly number[], an: readonly number[]): number[] {
  const hien = pct.map((x, k) => (an.includes(k) ? 0 : x));
  const tong = hien.reduce((s, x) => s + x, 0);
  if (tong <= 0) return pct.map(() => 0);
  return hien.map((x) => tron2((x / tong) * 100));
}

/**
 * CSS áp độ rộng + ẩn cột. Độ rộng đặt trên `<col>` của `<colgroup data-in-cot>` (khung chèn
 * vào nội dung nguồn). Ẩn cột theo `data-in-o="k"` — gắn lên mọi ô KHÔNG gộp cột, k = vị trí
 * cột thật (đã tính rowSpan/colSpan) nên dòng «Tổng cộng» gộp ô không bị ẩn nhầm; ô gộp đi qua
 * cột ẩn vẫn hiện.
 */
export function cssCotBang(cot: Record<string, number[]>, anCot: Record<string, number[]>): string {
  const dong: string[] = [];
  for (const b of new Set([...Object.keys(cot), ...Object.keys(anCot)])) {
    const an = anCot[b] ?? [];
    const pct = cot[b];
    const sel = `table[data-in-bang="${b}"]`;
    if (pct) {
      dong.push(`${sel}{table-layout:fixed;width:100%}`);
      doRongHienThi(pct, an).forEach((w, k) => {
        dong.push(`${sel} > colgroup[data-in-cot] > col:nth-child(${k + 1}){width:${w}%}`);
      });
    }
    for (const k of an) {
      dong.push(`${sel} > colgroup[data-in-cot] > col:nth-child(${k + 1}),${sel} [data-in-o="${k}"]{display:none}`);
    }
  }
  return dong.join('\n');
}
