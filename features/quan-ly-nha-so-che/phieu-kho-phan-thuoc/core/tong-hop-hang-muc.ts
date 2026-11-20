/**
 * Tổng hợp tiền theo hạng mục cho tab "Theo hạng mục" (migration 071).
 * Thuần — nhận kết quả RPC (numeric về dạng string) và quy chuẩn + sắp xếp cho bảng hiển thị.
 */

/** Một dòng thô từ RPC `rpc_*_tong_hop_hang_muc` (tiền có thể về `string`). */
export interface TongHopHangMucRow {
  hangMuc?: string | null;
  tienXuat?: number | string | null;
  tienChuyen?: number | string | null;
  soDong?: number | string | null;
}

/** Một dòng tổng hợp đã quy chuẩn. */
export interface TongHopHangMucDong {
  hangMuc: string | null;
  tienXuat: number;
  tienChuyen: number;
  /** tienXuat + tienChuyen. */
  tong: number;
  soDong: number;
}

export interface TongHopHangMucTongCong {
  tienXuat: number;
  tienChuyen: number;
  tong: number;
  soDong: number;
}

export interface TongHopHangMucKetQua {
  dong: TongHopHangMucDong[];
  tongCong: TongHopHangMucTongCong;
}

/**
 * Quy chuẩn + sắp xếp dòng tổng hợp:
 * - chuỗi số về `number` (ô trống/rỗng → 0), `tong = tienXuat + tienChuyen`;
 * - sắp theo `tong` giảm dần, bằng nhau thì theo tên (locale `vi`);
 * - dòng chưa phân hạng mục (`null`) luôn xếp cuối.
 */
export function tongHopHangMuc(rows: readonly TongHopHangMucRow[]): TongHopHangMucKetQua {
  const dong: TongHopHangMucDong[] = (rows ?? []).map((r) => {
    const tienXuat = Number(r.tienXuat ?? 0) || 0;
    const tienChuyen = Number(r.tienChuyen ?? 0) || 0;
    return {
      hangMuc: r.hangMuc?.trim() ? r.hangMuc.trim() : null,
      tienXuat,
      tienChuyen,
      tong: tienXuat + tienChuyen,
      soDong: Number(r.soDong ?? 0) || 0,
    };
  });

  dong.sort((a, b) => {
    if (a.hangMuc == null && b.hangMuc != null) return 1;
    if (a.hangMuc != null && b.hangMuc == null) return -1;
    if (b.tong !== a.tong) return b.tong - a.tong;
    return (a.hangMuc ?? '').localeCompare(b.hangMuc ?? '', 'vi');
  });

  const tongCong = dong.reduce<TongHopHangMucTongCong>(
    (acc, d) => ({
      tienXuat: acc.tienXuat + d.tienXuat,
      tienChuyen: acc.tienChuyen + d.tienChuyen,
      tong: acc.tong + d.tong,
      soDong: acc.soDong + d.soDong,
    }),
    { tienXuat: 0, tienChuyen: 0, tong: 0, soDong: 0 }
  );

  return { dong, tongCong };
}

/* ------------------------------------------------------------------ */
/*  Giá trị xuất / luân chuyển (migration 082) — suy giá như NXT       */
/* ------------------------------------------------------------------ */

type SoTho = number | string | null | undefined;
const so = (v: SoTho): number => Number(v ?? 0) || 0;

/** JSON thô từ RPC `rpc_*_gia_tri_xuat_chuyen` (numeric có thể về `string`). */
export interface GiaTriXuatChuyenRaw {
  tong?: { tien_xuat?: SoTho; tien_chuyen?: SoTho; so_dong?: SoTho; so_dong_chua_gia?: SoTho } | null;
  theoHangMuc?: { hang_muc?: string | null; tien_xuat?: SoTho; tien_chuyen?: SoTho; so_dong?: SoTho }[] | null;
  /** Migration 088 — nhóm theo phẩm cấp của danh mục hàng hoá (`null` = hàng chưa gán phẩm cấp). */
  theoPhamCap?: { pham_cap?: string | null; tien_xuat?: SoTho; tien_chuyen?: SoTho; so_dong?: SoTho }[] | null;
  luanChuyen?:
    | {
        id_kho_di?: string | null;
        ten_kho_di?: string | null;
        id_kho_den?: string | null;
        ten_kho_den?: string | null;
        so_dong?: SoTho;
        tien?: SoTho;
      }[]
    | null;
  theoKho?:
    | { id_kho?: string | null; ten_kho?: string | null; tien_xuat?: SoTho; tien_chuyen_di?: SoTho; tien_nhan_ve?: SoTho }[]
    | null;
  chuaCoGia?: { id_hang_hoa?: string | null; ma_hang?: string | null; ten_hang?: string | null; so_dong?: SoTho }[] | null;
}

export interface LuanChuyenTuyen {
  id: string;
  tenKhoDi: string;
  tenKhoDen: string;
  soDong: number;
  tien: number;
}

export interface GiaTriTheoKho {
  id: string;
  tenKho: string;
  tienXuat: number;
  tienChuyenDi: number;
  tienNhanVe: number;
}

export interface HangChuaCoGia {
  id: string;
  maHang: string;
  tenHang: string;
  soDong: number;
}

export interface GiaTriXuatChuyen {
  tong: { tienXuat: number; tienChuyen: number; soDong: number; soDongChuaGia: number };
  hangMuc: TongHopHangMucKetQua;
  /** Cùng khuôn `hangMuc`; trường nhóm `hangMuc` của mỗi dòng chứa phẩm cấp. */
  phamCap: TongHopHangMucKetQua;
  luanChuyen: LuanChuyenTuyen[];
  theoKho: GiaTriTheoKho[];
  chuaCoGia: HangChuaCoGia[];
}

/**
 * Quy chuẩn JSON RPC giá trị xuất/luân chuyển:
 * - số dạng chuỗi → number, trống/sai → 0; thiếu mảng → [];
 * - hạng mục / phẩm cấp đi qua `tongHopHangMuc` (sắp xếp, nhóm trống cuối, dòng tổng cộng);
 * - tuyến luân chuyển: tiền giảm dần, bằng nhau thì số dòng giảm dần;
 * - theo kho: tổng (xuất + chuyển đi + nhận về) giảm dần; hàng chưa giá: số dòng giảm dần.
 */
export function chuanHoaGiaTriXuatChuyen(raw: GiaTriXuatChuyenRaw | null | undefined): GiaTriXuatChuyen {
  const r = raw ?? {};
  const hangMuc = tongHopHangMuc(
    (r.theoHangMuc ?? []).map((d) => ({
      hangMuc: d.hang_muc ?? null,
      tienXuat: d.tien_xuat,
      tienChuyen: d.tien_chuyen,
      soDong: d.so_dong,
    }))
  );

  const phamCap = tongHopHangMuc(
    (r.theoPhamCap ?? []).map((d) => ({
      hangMuc: d.pham_cap ?? null,
      tienXuat: d.tien_xuat,
      tienChuyen: d.tien_chuyen,
      soDong: d.so_dong,
    }))
  );

  const luanChuyen = (r.luanChuyen ?? [])
    .map((d) => ({
      id: `${d.id_kho_di ?? ''}-${d.id_kho_den ?? ''}`,
      tenKhoDi: d.ten_kho_di?.trim() || d.id_kho_di || '—',
      tenKhoDen: d.ten_kho_den?.trim() || d.id_kho_den || '—',
      soDong: so(d.so_dong),
      tien: so(d.tien),
    }))
    .sort((a, b) => b.tien - a.tien || b.soDong - a.soDong);

  const tongKho = (k: GiaTriTheoKho) => k.tienXuat + k.tienChuyenDi + k.tienNhanVe;
  const theoKho = (r.theoKho ?? [])
    .map((d) => ({
      id: d.id_kho ?? '',
      tenKho: d.ten_kho?.trim() || d.id_kho || '—',
      tienXuat: so(d.tien_xuat),
      tienChuyenDi: so(d.tien_chuyen_di),
      tienNhanVe: so(d.tien_nhan_ve),
    }))
    .sort((a, b) => tongKho(b) - tongKho(a) || a.tenKho.localeCompare(b.tenKho, 'vi'));

  const chuaCoGia = (r.chuaCoGia ?? [])
    .map((d) => ({
      id: d.id_hang_hoa ?? '',
      maHang: d.ma_hang?.trim() || '—',
      tenHang: d.ten_hang?.trim() || '—',
      soDong: so(d.so_dong),
    }))
    .sort((a, b) => b.soDong - a.soDong);

  return {
    tong: {
      tienXuat: so(r.tong?.tien_xuat),
      tienChuyen: so(r.tong?.tien_chuyen),
      soDong: so(r.tong?.so_dong),
      soDongChuaGia: so(r.tong?.so_dong_chua_gia),
    },
    hangMuc,
    phamCap,
    luanChuyen,
    theoKho,
    chuaCoGia,
  };
}
