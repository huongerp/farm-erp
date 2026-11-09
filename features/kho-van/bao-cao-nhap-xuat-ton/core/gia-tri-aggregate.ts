/**
 * Chuẩn hoá payload RPC rpc_nxt_gia_tri (numeric của Postgres về dưới dạng chuỗi)
 * và các phép tính phụ (tỷ lệ phẩm cấp, chênh lệch luân chuyển theo kho).
 * Thuần, không React — test cạnh file.
 */
import type {
  NXTGiaTriChuaCoGia,
  NXTGiaTriLuanChuyen,
  NXTGiaTriTheoKho,
  NXTGiaTriTheoPhamCap,
  NXTGiaTriTong,
} from './types';

/** Ép numeric về number an toàn: null/undefined/'' và NaN → 0. */
function num(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export interface NXTGiaTriTheoPhamCapRow extends NXTGiaTriTheoPhamCap {
  /** true khi pham_cap null/rỗng — UI dịch nhãn «Chưa phân loại». */
  chuaPhanLoai: boolean;
  /** Tỷ lệ (tien_xuat + tien_chuyen) / tổng của MỌI row phẩm cấp. */
  tyLe: number;
}

export interface NXTGiaTriTheoKhoRow extends NXTGiaTriTheoKho {
  /** tien_nhan_ve − tien_chuyen_di. */
  chenh_lech: number;
}

/** Kết quả sau chuẩn hoá, dùng cho service/component. */
export interface NXTGiaTriNormalized {
  tong: NXTGiaTriTong;
  theoPhamCap: NXTGiaTriTheoPhamCapRow[];
  theoKho: NXTGiaTriTheoKhoRow[];
  luanChuyen: NXTGiaTriLuanChuyen[];
  chuaCoGia: NXTGiaTriChuaCoGia[];
}

export const EMPTY_NXT_GIA_TRI: NXTGiaTriNormalized = {
  tong: { tien_xuat: 0, tien_chuyen: 0, so_dong_chua_gia: 0 },
  theoPhamCap: [],
  theoKho: [],
  luanChuyen: [],
  chuaCoGia: [],
};

export function normalizeNXTGiaTri(raw: unknown): NXTGiaTriNormalized {
  if (!raw || typeof raw !== 'object') return EMPTY_NXT_GIA_TRI;
  const o = raw as Record<string, unknown>;

  const tongRaw = (o.tong ?? {}) as Record<string, unknown>;
  const tong: NXTGiaTriTong = {
    tien_xuat: num(tongRaw.tien_xuat),
    tien_chuyen: num(tongRaw.tien_chuyen),
    so_dong_chua_gia: num(tongRaw.so_dong_chua_gia),
  };

  const phamCapRows = (Array.isArray(o.theoPhamCap) ? o.theoPhamCap : []).map((r) => {
    const row = (r ?? {}) as Record<string, unknown>;
    const rawPhamCap = row.pham_cap;
    const phamCap = typeof rawPhamCap === 'string' && rawPhamCap.trim() !== '' ? rawPhamCap.trim() : null;
    return {
      pham_cap: phamCap,
      tien_xuat: num(row.tien_xuat),
      tien_chuyen: num(row.tien_chuyen),
      so_dong: num(row.so_dong),
      chuaPhanLoai: phamCap === null,
    };
  });
  const tongPhamCap = phamCapRows.reduce((s, r) => s + r.tien_xuat + r.tien_chuyen, 0);
  const theoPhamCap: NXTGiaTriTheoPhamCapRow[] = phamCapRows
    .map((r) => ({
      ...r,
      tyLe: tongPhamCap > 0 ? (r.tien_xuat + r.tien_chuyen) / tongPhamCap : 0,
    }))
    .sort((a, b) => b.tien_xuat + b.tien_chuyen - (a.tien_xuat + a.tien_chuyen));

  const theoKho: NXTGiaTriTheoKhoRow[] = (Array.isArray(o.theoKho) ? o.theoKho : [])
    .map((r) => {
      const row = (r ?? {}) as Record<string, unknown>;
      const tienChuyenDi = num(row.tien_chuyen_di);
      const tienNhanVe = num(row.tien_nhan_ve);
      return {
        id_kho: row.id_kho != null ? String(row.id_kho) : '',
        ten_kho: row.ten_kho != null ? String(row.ten_kho) : '',
        ten_chi_nhanh: row.ten_chi_nhanh != null ? String(row.ten_chi_nhanh) : '',
        tien_xuat: num(row.tien_xuat),
        tien_chuyen_di: tienChuyenDi,
        tien_nhan_ve: tienNhanVe,
        chenh_lech: tienNhanVe - tienChuyenDi,
      };
    })
    .sort((a, b) => a.ten_kho.localeCompare(b.ten_kho, 'vi'));

  const luanChuyen: NXTGiaTriLuanChuyen[] = (Array.isArray(o.luanChuyen) ? o.luanChuyen : []).map((r) => {
    const row = (r ?? {}) as Record<string, unknown>;
    return {
      id_kho_di: row.id_kho_di != null ? String(row.id_kho_di) : '',
      ten_kho_di: row.ten_kho_di != null ? String(row.ten_kho_di) : '',
      id_kho_den: row.id_kho_den != null ? String(row.id_kho_den) : '',
      ten_kho_den: row.ten_kho_den != null ? String(row.ten_kho_den) : '',
      tien: num(row.tien),
      so_dong: num(row.so_dong),
    };
  });

  const chuaCoGia: NXTGiaTriChuaCoGia[] = (Array.isArray(o.chuaCoGia) ? o.chuaCoGia : []).map((r) => {
    const row = (r ?? {}) as Record<string, unknown>;
    return {
      id_hang_hoa: row.id_hang_hoa != null ? String(row.id_hang_hoa) : '',
      ma_hang: row.ma_hang != null ? String(row.ma_hang) : '',
      ten_hang: row.ten_hang != null ? String(row.ten_hang) : '',
      so_dong: num(row.so_dong),
      so_luong: num(row.so_luong),
    };
  });

  return { tong, theoPhamCap, theoKho, luanChuyen, chuaCoGia };
}
