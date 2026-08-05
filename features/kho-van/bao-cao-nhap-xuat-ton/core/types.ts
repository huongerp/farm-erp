import type { LoaiPhieuKho } from '../../phieu-kho/core/types';

/** Bộ lọc chung cho báo cáo NXT */
export interface NXTReportFilters {
  dateFrom: string;
  dateTo: string;
  warehouseIds: string[];
  loaiPhieu: LoaiPhieuKho[];
  /** Trạng thái phiếu: 0 Chờ duyệt, 3 Đợi duyệt, 1 Đã duyệt, 2 Không duyệt. Rỗng = tất cả. */
  trangThaiPhieu: (0 | 1 | 2 | 3)[];
  /** Lọc theo hàng hóa (id) hoặc danh mục – cho tổng hợp theo sản phẩm / tồn tại thời điểm */
  hangHoaIds: string[];
  categoryIds: string[];
  /** Khi có: chỉ phiếu/tồn thuộc chi nhánh được phân (phân quyền xem theo chi nhánh). Phiếu: kho_id / kho_den_id → kho.id_chi_nhanh; tồn: id_kho → kho.id_chi_nhanh. Mảng rỗng = không có kho thuộc chi nhánh được phân (tồn báo cáo = rỗng). */
  allowedBranchIds?: string[];
  /** Khi phân quyền hẹp: luôn gồm phiếu do user này tạo (fp_var_nhan_vien.id = nguoi_tao_id). */
  allowedCreatorUserId?: string;
}

/** Dòng báo cáo tổng hợp NXT theo kho */
export interface NXTByWarehouseRow {
  id_kho: string;
  ma_kho: string;
  ten_kho: string;
  ton_dau_ky: number;
  tong_nhap: number;
  tong_xuat: number;
  ton_cuoi_ky: number;
}

/** Dòng báo cáo tổng hợp NXT theo hàng hóa (có thể tổng toàn hệ thống hoặc theo kho) */
export interface NXTByProductRow {
  id_hang_hoa: string;
  ma_hang: string;
  ten_hang: string;
  ten_danh_muc?: string;
  don_vi_tinh: string;
  id_kho?: string;
  ten_kho?: string;
  ton_dau_ky: number;
  tong_nhap: number;
  tong_xuat: number;
  ton_cuoi_ky: number;
}

/** Dòng bảng tồn tại thời điểm (kho × hàng hóa) */
export interface TonTaiThoiDiemRow {
  id_kho: string;
  ma_kho: string;
  ten_kho: string;
  id_hang_hoa: string;
  ma_hang: string;
  ten_hang: string;
  ten_danh_muc?: string;
  don_vi_tinh: string;
  so_luong: number;
}

/** Ô ma trận NXT kho × hàng hóa trong kỳ */
export interface NXTKHCell {
  id_kho: string;
  id_hang_hoa: string;
  ton_dau_ky: number;
  tong_nhap: number;
  tong_xuat: number;
  ton_cuoi_ky: number;
}

/** Kết quả báo cáo tổng hợp NXT theo kỳ */
export interface NXTByPeriodResult {
  byWarehouse: NXTByWarehouseRow[];
  byProduct: NXTByProductRow[];
  /** Ma trận chi tiết kho × hàng — dùng cho pivot cột theo kho. */
  byCell?: NXTKHCell[];
}
