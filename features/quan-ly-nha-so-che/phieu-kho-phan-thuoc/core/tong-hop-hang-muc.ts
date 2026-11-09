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
