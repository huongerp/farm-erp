/** Một ô ma trận từ view v_farm_ton_kho_phan_thuoc (tồn tức thời) */
export interface TonKhoPTRecord {
  id_kho: string;
  id_hang_hoa: string;
  so_luong: number;
}

/** Tham số kỳ cho rpc_farm_ton_kho_pt_theo_ky — ngày YYYY-MM-DD, rỗng = không giới hạn. */
export interface TonKhoPTKyParams {
  tu: string;
  den: string;
  /** true → chỉ tính phiếu 'Đã duyệt'; false → mọi phiếu trừ 'Không duyệt'. */
  chiDaDuyet: boolean;
}

/** Một ô kho × hàng trong kỳ, từ rpc_farm_ton_kho_pt_theo_ky. */
export interface TonKhoPTKyCell {
  id_kho: string;
  id_hang_hoa: string;
  ton_dau: number;
  nhap: number;
  xuat: number;
  chuyen_den: number;
  chuyen_di: number;
  ton_cuoi: number;
}

/** Ô của một kho trong drawer chi tiết (đã gắn tên kho). */
export interface TonKhoPTKhoKy extends TonKhoPTKyCell {
  ma_kho: string;
  ten_kho: string;
}

/** Một dòng bảng Tồn kho: gom các kho của một hàng trong kỳ. */
export interface TonKhoPTProductAgg {
  id_hang_hoa: string;
  ma_hang: string;
  ten_hang: string;
  ten_danh_muc?: string;
  danh_muc_id?: string | null;
  don_vi_tinh: string;
  /** Định mức tồn mỗi kho — ô kho nào dưới mức này tô đỏ. */
  dinh_muc: number | null;
  ton_dau: number;
  nhap: number;
  xuat: number;
  /** Chuyển kho ròng (đến − đi) trong phạm vi kho đang xem; xem mọi kho thì = 0. */
  chuyen: number;
  ton_cuoi: number;
  /** Số kho có tồn cuối kỳ > 0 */
  so_kho_co_ton: number;
  /** Tồn cuối kỳ theo id_kho — cột động trên bảng */
  by_kho: Record<string, number>;
  /** Chi tiết từng kho (drawer). Rỗng = hàng có định mức chưa phát sinh ở kho nào. */
  kho: TonKhoPTKhoKy[];
}

/** Một dòng lịch sử NX (nhập/xuất/chuyển) của hàng trong drawer tồn theo SP */
export interface TonKhoPTHangNxHistoryRow {
  chi_tiet_id: number;
  id_phieu_kho: number;
  so_phieu: string;
  ngay: string;
  loai: string;
  kho_id: string;
  kho_den_id: string | null;
  /** Thời gian tạo phiếu — sắp xếp luỹ kế tồn */
  phieu_tg_tao?: string | null;
  ten_kho: string | null;
  ten_kho_den: string | null;
  trang_thai: string;
  so_luong: number;
  don_vi_tinh: string | null;
}
