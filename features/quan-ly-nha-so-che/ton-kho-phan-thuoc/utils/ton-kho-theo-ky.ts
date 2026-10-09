import type { TonKhoPTKhoKy, TonKhoPTKyCell, TonKhoPTProductAgg } from '../core/types';
import { laDuoiDinhMuc } from '../../phieu-kho-phan-thuoc/utils/ton-kho-check';

/** Hàng hoá tối thiểu để gắn tên / danh mục / định mức vào dòng tồn. */
export interface HangHoaDinhMucLite {
  id: string;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  ten_danh_muc?: string;
  danh_muc_id: string | null;
  dvt: string | null;
  dinh_muc: number | null;
}

export interface KhoLite {
  id: string;
  ma_kho: string;
  ten_kho: string;
}

export interface GomTonKyOptions {
  hangMap: Record<string, HangHoaDinhMucLite>;
  khoMap: Record<string, KhoLite>;
  /** Kho đang xem — rỗng = mọi kho. */
  khoIds?: string[];
  /** Danh mục đang xem — rỗng = mọi danh mục. */
  categoryIds?: string[];
}

const laOTrong = (c: TonKhoPTKyCell) =>
  c.ton_dau === 0 && c.nhap === 0 && c.xuat === 0 && c.chuyen_den === 0 && c.chuyen_di === 0 && c.ton_cuoi === 0;

/**
 * Gom các ô kho × hàng của kỳ thành một dòng mỗi hàng.
 *
 * Cột Chuyển là chuyển ròng (đến − đi) trong phạm vi kho đang xem, nên luôn có
 * Đầu + Nhập − Xuất + Chuyển = Cuối. Xem mọi kho thì chuyển nội bộ triệt tiêu (Chuyển = 0)
 * và không làm phồng cột Nhập/Xuất.
 *
 * Ô toàn 0 (hàng đã phát sinh rồi về 0, kỳ không có biến động) chỉ giữ khi hàng có định mức —
 * để còn báo đỏ; hàng không đặt định mức thì ẩn.
 */
export function gomTonKhoPTTheoKy(cells: TonKhoPTKyCell[], opts: GomTonKyOptions): TonKhoPTProductAgg[] {
  const { hangMap, khoMap } = opts;
  const khoSet = opts.khoIds?.length ? new Set(opts.khoIds.map(String)) : null;
  const catSet = opts.categoryIds?.length ? new Set(opts.categoryIds.map(String)) : null;

  const byHang = new Map<string, TonKhoPTProductAgg>();
  for (const c of cells) {
    if (khoSet && !khoSet.has(c.id_kho)) continue;
    const h = hangMap[c.id_hang_hoa];
    if (catSet && !(h?.danh_muc_id && catSet.has(String(h.danh_muc_id)))) continue;
    if (laOTrong(c) && !((h?.dinh_muc ?? 0) > 0)) continue;

    let row = byHang.get(c.id_hang_hoa);
    if (!row) {
      row = {
        id_hang_hoa: c.id_hang_hoa,
        ma_hang: h?.ma_hang_hoa ?? c.id_hang_hoa,
        ten_hang: h?.ten_hang_hoa ?? '—',
        ten_danh_muc: h?.ten_danh_muc,
        danh_muc_id: h?.danh_muc_id ?? null,
        don_vi_tinh: h?.dvt ?? '—',
        dinh_muc: h?.dinh_muc ?? null,
        ton_dau: 0,
        nhap: 0,
        xuat: 0,
        chuyen: 0,
        ton_cuoi: 0,
        so_kho_co_ton: 0,
        by_kho: {},
        kho: [],
      };
      byHang.set(c.id_hang_hoa, row);
    }
    const k = khoMap[c.id_kho];
    const khoKy: TonKhoPTKhoKy = { ...c, ma_kho: k?.ma_kho ?? c.id_kho, ten_kho: k?.ten_kho ?? c.id_kho };
    row.kho.push(khoKy);
    row.ton_dau += c.ton_dau;
    row.nhap += c.nhap;
    row.xuat += c.xuat;
    row.chuyen += c.chuyen_den - c.chuyen_di;
    row.ton_cuoi += c.ton_cuoi;
    row.by_kho[c.id_kho] = (row.by_kho[c.id_kho] ?? 0) + c.ton_cuoi;
    if (c.ton_cuoi > 0) row.so_kho_co_ton += 1;
  }

  const out = [...byHang.values()];
  for (const r of out) r.kho.sort((a, b) => a.ten_kho.localeCompare(b.ten_kho, 'vi'));
  out.sort((a, b) => b.ton_cuoi - a.ton_cuoi || a.ma_hang.localeCompare(b.ma_hang));
  return out;
}

/**
 * Hàng có định mức nhưng chưa từng phát sinh ở kho nào → thêm dòng tồn 0 (không gắn kho) để
 * vẫn báo đỏ ở cột Tồn cuối kỳ. `daPhatSinh` = id hàng đã có ô trong kỳ (mọi kho).
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
        ton_dau: 0,
        nhap: 0,
        xuat: 0,
        chuyen: 0,
        ton_cuoi: 0,
        so_kho_co_ton: 0,
        by_kho: {},
        kho: [],
      })
    )
    .sort((a, b) => a.ma_hang.localeCompare(b.ma_hang));
  return them.length > 0 ? [...agg, ...them] : agg;
}

/** Dòng chưa phát sinh ở kho nào (do `themHangChuaPhatSinh` thêm) — báo đỏ ở Tồn cuối kỳ. */
export const laHangChuaPhatSinh = (item: TonKhoPTProductAgg) => item.kho.length === 0;

/** Có ít nhất một ô đỏ: kho nào âm / dưới định mức, hoặc hàng có định mức chưa từng nhập kho. */
export function laHangDuoiDinhMuc(item: TonKhoPTProductAgg): boolean {
  if (laHangChuaPhatSinh(item)) return laDuoiDinhMuc(0, item.dinh_muc);
  return Object.values(item.by_kho).some((q) => q < 0 || laDuoiDinhMuc(q, item.dinh_muc));
}
