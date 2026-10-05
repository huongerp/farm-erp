import type { TonKhoPTDisplayRow, TonKhoPTProductAgg } from '../core/types';
import { laDuoiDinhMuc } from '../../phieu-kho-phan-thuoc/utils/ton-kho-check';

export function aggregateTonKhoPTByProduct(rows: TonKhoPTDisplayRow[]): TonKhoPTProductAgg[] {
  const map = new Map<string, TonKhoPTDisplayRow[]>();
  rows.forEach((r) => {
    const id = String(r.id_hang_hoa);
    const arr = map.get(id);
    if (arr) arr.push(r);
    else map.set(id, [r]);
  });
  const out: TonKhoPTProductAgg[] = [];
  map.forEach((list, id_hang_hoa) => {
    const first = list[0];
    let tong = 0;
    let khoCoTon = 0;
    const by_kho: Record<string, number> = {};
    for (const r of list) {
      const q = Number(r.so_luong) || 0;
      tong += q;
      if (q > 0) khoCoTon += 1;
      const kid = String(r.id_kho);
      by_kho[kid] = (by_kho[kid] ?? 0) + q;
    }
    out.push({
      id_hang_hoa,
      ma_hang: first.ma_hang,
      ten_hang: first.ten_hang,
      ten_danh_muc: first.ten_danh_muc,
      danh_muc_id: first.danh_muc_id ?? null,
      don_vi_tinh: first.don_vi_tinh,
      dinh_muc: first.dinh_muc ?? null,
      tong_so_luong: tong,
      so_kho_co_ton: khoCoTon,
      by_kho,
      rows: list,
    });
  });
  out.sort((a, b) => b.tong_so_luong - a.tong_so_luong || a.ma_hang.localeCompare(b.ma_hang));
  return out;
}

/** Hàng hoá tối thiểu để dựng dòng "chưa phát sinh tồn". */
export interface HangHoaDinhMucLite {
  id: string;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  ten_danh_muc?: string;
  danh_muc_id: string | null;
  dvt: string | null;
  dinh_muc: number | null;
}

/**
 * Hàng có định mức nhưng chưa từng phát sinh ở kho nào → thêm dòng tồn 0 (không gắn kho) để
 * vẫn báo đỏ ở cột Tổng SL. `daPhatSinh` = id hàng đã có dòng trong view tồn (mọi kho).
 */
export function themHangChuaPhatSinh(
  agg: TonKhoPTProductAgg[],
  hangList: HangHoaDinhMucLite[],
  daPhatSinh: Set<string>
): TonKhoPTProductAgg[] {
  const them = hangList
    .filter((h) => (h.dinh_muc ?? 0) > 0 && !daPhatSinh.has(String(h.id)))
    .map(
      (h): TonKhoPTProductAgg => ({
        id_hang_hoa: String(h.id),
        ma_hang: h.ma_hang_hoa,
        ten_hang: h.ten_hang_hoa,
        ten_danh_muc: h.ten_danh_muc,
        danh_muc_id: h.danh_muc_id,
        don_vi_tinh: h.dvt ?? '—',
        dinh_muc: h.dinh_muc,
        tong_so_luong: 0,
        so_kho_co_ton: 0,
        by_kho: {},
        rows: [],
      })
    )
    .sort((a, b) => a.ma_hang.localeCompare(b.ma_hang));
  return them.length > 0 ? [...agg, ...them] : agg;
}

/** Dòng chưa phát sinh ở kho nào (do `themHangChuaPhatSinh` thêm) — báo đỏ ở Tổng SL. */
export const laHangChuaPhatSinh = (item: TonKhoPTProductAgg) => item.rows.length === 0;

/** Có ít nhất một ô đỏ: kho nào âm / dưới định mức, hoặc hàng có định mức chưa từng nhập kho. */
export function laHangDuoiDinhMuc(item: TonKhoPTProductAgg): boolean {
  if (laHangChuaPhatSinh(item)) return laDuoiDinhMuc(0, item.dinh_muc);
  return Object.values(item.by_kho).some((q) => q < 0 || laDuoiDinhMuc(q, item.dinh_muc));
}
