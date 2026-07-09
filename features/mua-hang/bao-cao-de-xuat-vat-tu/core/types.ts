import type { TrangThaiPhieuDeXuatVatTu } from '../../../kho-van/phieu-de-xuat-vat-tu/core/constants';

export type { TrangThaiPhieuDeXuatVatTu };

/** Bộ lọc chung cho báo cáo đề xuất vật tư */
export interface BaoCaoDeXuatVatTuFilters {
  dateFrom: string;
  dateTo: string;
  /** Trạng thái: Chờ duyệt, Đợi duyệt, Đã duyệt, Không duyệt */
  trangThaiIds: TrangThaiPhieuDeXuatVatTu[];
  noiDeXuatIds: string[];
  nguoiDeXuatIds: string[];
  nguoiDuyetIds: string[];
  /** Khi có: chỉ lấy phiếu có id_noi_de_xuat → kho.id_chi_nhanh thuộc danh sách (phân quyền xem theo chi nhánh) */
  allowedBranchIds?: string[];
  /** Phân quyền hẹp: luôn gồm phiếu do user này đề xuất (id_nguoi_de_xuat). */
  allowedCreatorUserId?: string;
}

/** Dòng tổng hợp theo trạng thái */
export interface TongHopByTrangThaiRow {
  trang_thai: TrangThaiPhieuDeXuatVatTu;
  ten_trang_thai?: string;
  count: number;
}

/** Dòng tổng hợp theo nơi đề xuất */
export interface TongHopByNoiDeXuatRow {
  id_noi_de_xuat: string;
  ten_noi_de_xuat?: string;
  count: number;
}

/** Kết quả tổng hợp theo kỳ */
export interface TongHopDeXuatKyResult {
  total: number;
  choDuyet: number;
  doiDuyet: number;
  daDuyet: number;
  khongDuyet: number;
  byTrangThai: TongHopByTrangThaiRow[];
  byNoiDeXuat: TongHopByNoiDeXuatRow[];
  /** Số phiếu theo tháng (để vẽ chart): key = YYYY-MM */
  byMonth?: { monthKey: string; label: string; count: number }[];
}

/** Dòng chi tiết phiếu (để hiển thị bảng) */
export interface ChiTietPhieuRow {
  id: string;
  so_phieu: string;
  ngay: string;
  ngay_can: string;
  id_noi_de_xuat: string;
  ten_noi_de_xuat?: string;
  id_nguoi_de_xuat: string;
  ten_nguoi_de_xuat?: string;
  id_nguoi_duyet?: string | null;
  ten_nguoi_duyet?: string | null;
  trang_thai: TrangThaiPhieuDeXuatVatTu;
  ghi_chu?: string;
}

/** Dòng bảng liên kết đơn hàng */
export interface LienKetDonHangRow {
  id_phieu: string;
  so_phieu: string;
  ngay: string;
  trang_thai: TrangThaiPhieuDeXuatVatTu;
  ten_noi_de_xuat?: string;
  ten_nguoi_de_xuat?: string;
  da_chuyen_don: boolean;
  so_phieu_don?: string;
  id_don_dat_hang?: string;
}
