/**
 * Biến thể của nhóm module kho (Hàng hoá, Phiếu kho, Kiểm kê, Tồn kho, Đề xuất mua hàng,
 * Thiết lập đề xuất). Cùng một bộ code chạy cho hai submenu, mỗi submenu một bộ bảng riêng:
 * - `so-che`     — /quan-ly-nha-so-che, bảng `fp_farm_*` (vật tư, thành phẩm nhà sơ chế);
 * - `phan-thuoc` — /phan-thuoc, bảng `fp_pt_*` (phân bón, thuốc BVTV — migration 029).
 */

export type KhoBienTheKey = 'so-che' | 'phan-thuoc';

/** Slug module trong nhóm kho — giống nhau ở cả hai submenu. */
export type KhoModuleSlug =
  | 'de-xuat-mua-hang'
  | 'phieu-kho-phan-thuoc'
  | 'kiem-ke-kho-phan-thuoc'
  | 'ton-kho-phan-thuoc'
  | 'hang-hoa-phan-thuoc'
  | 'thiet-lap-de-xuat-mua-hang';

export const KHO_MODULE_SLUGS: readonly KhoModuleSlug[] = [
  'de-xuat-mua-hang',
  'phieu-kho-phan-thuoc',
  'kiem-ke-kho-phan-thuoc',
  'ton-kho-phan-thuoc',
  'hang-hoa-phan-thuoc',
  'thiet-lap-de-xuat-mua-hang',
];

export interface KhoBienThe {
  key: KhoBienTheKey;
  /** Đường dẫn submenu, vd `/phan-thuoc`. */
  basePath: string;
  /** Tiền tố mã do app tự sinh (tiền tố phiếu kho nằm trong RPC số phiếu). */
  tienTo: {
    deXuat: string;
    dotKiemKe: string;
  };
  /** `loai_chung_tu` khi gắn phiếu thu chi quỹ với đề xuất mua hàng (CHECK fp_tc_qtc_loai_chung_tu_check). */
  nguonThuChi: 'de_xuat_mua_hang' | 'pt_de_xuat_mua_hang';
  bang: {
    danhMucHangHoa: string;
    hangHoa: string;
    phieuKho: string;
    phieuKhoChiTiet: string;
    deXuat: string;
    deXuatChiTiet: string;
    dotKiemKe: string;
    dotKiemKeKho: string;
    dotKiemKeChiTiet: string;
    tienDoMuaHang: string;
  };
  view: {
    tonKho: string;
    phieuKhoSummary: string;
    phieuKhoChiTietFlat: string;
    deXuatSummary: string;
    deXuatChiTietFlat: string;
  };
  rpc: {
    soPhieuKho: string;
    soPhieuDeXuat: string;
    maDotKiemKe: string;
    kiemKeDieuChinhChiTiet: string;
    kiemKeDieuChinhDot: string;
    deXuatStats: string;
    tonKhoTheoKy: string;
    hangHoaDangDung: string;
  };
}

export const BIEN_THE_SO_CHE: KhoBienThe = {
  key: 'so-che',
  basePath: '/quan-ly-nha-so-che',
  tienTo: { deXuat: 'FDX-', dotKiemKe: 'KKPT' },
  nguonThuChi: 'de_xuat_mua_hang',
  bang: {
    danhMucHangHoa: 'fp_farm_danh_muc_hang_hoa',
    hangHoa: 'fp_farm_danh_sach_hang_hoa',
    phieuKho: 'fp_farm_phieu_kho_phan_thuoc',
    phieuKhoChiTiet: 'fp_farm_phieu_kho_phan_thuoc_chi_tiet',
    deXuat: 'fp_farm_de_xuat_mua_hang',
    deXuatChiTiet: 'fp_farm_de_xuat_mua_hang_chi_tiet',
    dotKiemKe: 'fp_farm_dot_kiem_ke_pt',
    dotKiemKeKho: 'fp_farm_dot_kiem_ke_pt_kho',
    dotKiemKeChiTiet: 'fp_farm_dot_kiem_ke_pt_chi_tiet',
    tienDoMuaHang: 'fp_farm_tien_do_mua_hang',
  },
  view: {
    tonKho: 'v_farm_ton_kho_phan_thuoc',
    phieuKhoSummary: 'v_farm_phieu_kho_phan_thuoc_summary',
    phieuKhoChiTietFlat: 'v_farm_phieu_kho_phan_thuoc_chi_tiet_flat',
    deXuatSummary: 'v_farm_de_xuat_mua_hang_summary',
    deXuatChiTietFlat: 'v_farm_de_xuat_mua_hang_chi_tiet_flat',
  },
  rpc: {
    soPhieuKho: 'get_next_so_phieu_farm_pt',
    soPhieuDeXuat: 'get_next_so_phieu_farm_de_xuat_mua_hang',
    maDotKiemKe: 'get_next_ma_dot_farm_kiem_ke_pt',
    kiemKeDieuChinhChiTiet: 'farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet',
    kiemKeDieuChinhDot: 'farm_kiem_ke_pt_apply_dieu_chinh_dot',
    deXuatStats: 'rpc_farm_de_xuat_mua_hang_stats',
    tonKhoTheoKy: 'rpc_farm_ton_kho_pt_theo_ky',
    hangHoaDangDung: 'rpc_farm_hang_hoa_dang_dung',
  },
};

export const BIEN_THE_PHAN_THUOC: KhoBienThe = {
  key: 'phan-thuoc',
  basePath: '/phan-thuoc',
  // Phiếu kho: PNK- / PXK- / PCK- (RPC get_next_so_phieu_pt_phieu_kho).
  tienTo: { deXuat: 'PDX-', dotKiemKe: 'PKK' },
  nguonThuChi: 'pt_de_xuat_mua_hang',
  bang: {
    danhMucHangHoa: 'fp_pt_danh_muc_hang_hoa',
    hangHoa: 'fp_pt_danh_sach_hang_hoa',
    phieuKho: 'fp_pt_phieu_kho',
    phieuKhoChiTiet: 'fp_pt_phieu_kho_chi_tiet',
    deXuat: 'fp_pt_de_xuat_mua_hang',
    deXuatChiTiet: 'fp_pt_de_xuat_mua_hang_chi_tiet',
    dotKiemKe: 'fp_pt_dot_kiem_ke',
    dotKiemKeKho: 'fp_pt_dot_kiem_ke_kho',
    dotKiemKeChiTiet: 'fp_pt_dot_kiem_ke_chi_tiet',
    tienDoMuaHang: 'fp_pt_tien_do_mua_hang',
  },
  view: {
    tonKho: 'v_pt_ton_kho',
    phieuKhoSummary: 'v_pt_phieu_kho_summary',
    phieuKhoChiTietFlat: 'v_pt_phieu_kho_chi_tiet_flat',
    deXuatSummary: 'v_pt_de_xuat_mua_hang_summary',
    deXuatChiTietFlat: 'v_pt_de_xuat_mua_hang_chi_tiet_flat',
  },
  rpc: {
    soPhieuKho: 'get_next_so_phieu_pt_phieu_kho',
    soPhieuDeXuat: 'get_next_so_phieu_pt_de_xuat_mua_hang',
    maDotKiemKe: 'get_next_ma_dot_pt_kiem_ke',
    kiemKeDieuChinhChiTiet: 'pt_kiem_ke_apply_dieu_chinh_chi_tiet',
    kiemKeDieuChinhDot: 'pt_kiem_ke_apply_dieu_chinh_dot',
    deXuatStats: 'rpc_pt_de_xuat_mua_hang_stats',
    tonKhoTheoKy: 'rpc_pt_ton_kho_theo_ky',
    hangHoaDangDung: 'rpc_pt_hang_hoa_dang_dung',
  },
};

export const KHO_BIEN_THE: Record<KhoBienTheKey, KhoBienThe> = {
  'so-che': BIEN_THE_SO_CHE,
  'phan-thuoc': BIEN_THE_PHAN_THUOC,
};

/** Biến thể theo đường dẫn; ngoài /phan-thuoc đều là sơ chế (giữ hành vi cũ cho GSCL, Đăng ký nhận hàng…). */
export function bienTheTheoPath(pathname: string): KhoBienThe {
  const p = pathname.toLowerCase();
  return p === BIEN_THE_PHAN_THUOC.basePath || p.startsWith(`${BIEN_THE_PHAN_THUOC.basePath}/`)
    ? BIEN_THE_PHAN_THUOC
    : BIEN_THE_SO_CHE;
}

/** module_id phân quyền / thông báo, vd `phan-thuoc/phieu-kho-phan-thuoc`. */
export function khoModuleId(bt: KhoBienThe, slug: KhoModuleSlug): string {
  return `${bt.basePath.replace(/^\//, '')}/${slug}`;
}

/** Đường dẫn trang in/preview của một phiếu. */
export function khoPreviewUrl(bt: KhoBienThe, slug: KhoModuleSlug, id: string | number): string {
  return `${bt.basePath}/${slug}/preview/${encodeURIComponent(String(id))}`;
}

/** Khoá localStorage của store bảng: sơ chế giữ khoá cũ (không mất cấu hình cột), phân thuốc thêm tiền tố. */
export function khoStorageKey(bt: KhoBienThe, khoaGoc: string): string {
  return bt.key === 'so-che' ? khoaGoc : khoaGoc.replace(/^table-/, 'table-pt-');
}
