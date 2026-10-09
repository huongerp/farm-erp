/**
 * Kiểm tra trước khi xoá hàng hoá: tách hàng "xoá được" / "đang dùng ở phiếu".
 * Dùng cho cả danh mục Mua hàng (RPC rpc_hang_hoa_dang_dung, migration 025) và Nhà sơ chế
 * (rpc_farm_hang_hoa_dang_dung, migration 026).
 */

/** Loại chứng từ đang dùng một hàng hoá — khớp cột `loai` của hai RPC trên. */
export type LoaiPhieuDangDung =
  | 'phieu_kho'
  | 'don_dat_hang'
  | 'de_xuat_vat_tu'
  | 'dot_kiem_ke'
  | 'phieu_kiem_ke'
  | 'phieu_kho_pt'
  | 'de_xuat_mua_hang'
  | 'dot_kiem_ke_pt'
  | 'giam_sat_chat_luong';

export interface PhieuDangDung {
  idHangHoa: string;
  loai: LoaiPhieuDangDung;
  idPhieu: string;
  soPhieu: string;
  ngay: string | null;
  trangThai: string | null;
  soDong: number;
}

export interface HangHoaDangDung {
  idHangHoa: string;
  phieu: PhieuDangDung[];
}

export interface PhanLoaiXoa {
  /** Không phiếu nào dùng → xoá được, giữ thứ tự như lúc chọn. */
  xoaDuoc: string[];
  /** Đang dùng → không xoá; giữ thứ tự như lúc chọn. */
  dangDung: HangHoaDangDung[];
  /** Tổng số phiếu khác nhau (theo loại + id) đang dùng các hàng trên. */
  tongPhieu: number;
}

const THU_TU_LOAI: Record<LoaiPhieuDangDung, number> = {
  phieu_kho: 0,
  don_dat_hang: 1,
  de_xuat_vat_tu: 2,
  dot_kiem_ke: 3,
  phieu_kiem_ke: 4,
  phieu_kho_pt: 0,
  de_xuat_mua_hang: 1,
  dot_kiem_ke_pt: 2,
  giam_sat_chat_luong: 3,
};

/** Route xem phiếu (trang preview); null = chưa có màn hình xem riêng. */
export function duongDanPhieu(loai: LoaiPhieuDangDung, idPhieu: string): string | null {
  switch (loai) {
    case 'phieu_kho':
      return `/mua-hang/phieu-kho/preview/${idPhieu}`;
    case 'don_dat_hang':
      return `/mua-hang/don-dat-hang/preview/${idPhieu}`;
    case 'de_xuat_vat_tu':
      return `/mua-hang/phieu-de-xuat-vat-tu/preview/${idPhieu}`;
    case 'dot_kiem_ke':
      return `/mua-hang/kiem-ke-kho/preview/${idPhieu}`;
    case 'phieu_kho_pt':
      return `/quan-ly-nha-so-che/phieu-kho-phan-thuoc/preview/${idPhieu}`;
    case 'de_xuat_mua_hang':
      return `/quan-ly-nha-so-che/de-xuat-mua-hang/preview/${idPhieu}`;
    case 'dot_kiem_ke_pt':
      return `/quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc/preview/${idPhieu}`;
    case 'giam_sat_chat_luong':
      return `/quan-ly-nha-so-che/giam-sat-chat-luong/preview/${idPhieu}`;
    default:
      return null;
  }
}

/** Phiếu trong cùng một hàng: theo loại, rồi ngày mới nhất trước, rồi số phiếu. */
function soSanhPhieu(a: PhieuDangDung, b: PhieuDangDung): number {
  const loai = THU_TU_LOAI[a.loai] - THU_TU_LOAI[b.loai];
  if (loai !== 0) return loai;
  const ngay = (b.ngay ?? '').localeCompare(a.ngay ?? '');
  if (ngay !== 0) return ngay;
  return a.soPhieu.localeCompare(b.soPhieu);
}

/** Map dòng RPC (snake_case, id số) → PhieuDangDung. */
export function tuDongRpc(r: {
  id_hang_hoa: number;
  loai: LoaiPhieuDangDung;
  id_phieu: number;
  so_phieu: string | null;
  ngay: string | null;
  trang_thai: string | null;
  so_dong: number;
}): PhieuDangDung {
  return {
    idHangHoa: String(r.id_hang_hoa),
    loai: r.loai,
    idPhieu: String(r.id_phieu),
    soPhieu: r.so_phieu ?? `#${r.id_phieu}`,
    ngay: r.ngay,
    trangThai: r.trang_thai,
    soDong: r.so_dong,
  };
}

/** Tách các hàng định xoá thành "xoá được" và "đang dùng ở phiếu" theo kết quả RPC. */
export function phanLoaiXoa(ids: string[], thamChieu: PhieuDangDung[]): PhanLoaiXoa {
  const theoHang = new Map<string, PhieuDangDung[]>();
  for (const p of thamChieu) {
    const ds = theoHang.get(p.idHangHoa);
    if (ds) ds.push(p);
    else theoHang.set(p.idHangHoa, [p]);
  }

  const xoaDuoc: string[] = [];
  const dangDung: HangHoaDangDung[] = [];
  const phieuKhac = new Set<string>();
  for (const id of new Set(ids)) {
    const phieu = theoHang.get(id);
    if (!phieu || phieu.length === 0) {
      xoaDuoc.push(id);
      continue;
    }
    for (const p of phieu) phieuKhac.add(`${p.loai}:${p.idPhieu}`);
    dangDung.push({ idHangHoa: id, phieu: [...phieu].sort(soSanhPhieu) });
  }
  return { xoaDuoc, dangDung, tongPhieu: phieuKhac.size };
}
