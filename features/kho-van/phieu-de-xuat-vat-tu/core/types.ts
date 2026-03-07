/** Dòng chi tiết phiếu đề xuất vật tư: một hàng hóa + số lượng. */
export interface PhieuDeXuatVatTuChiTiet {
  id: string;
  id_phieu_de_xuat_vat_tu: string;
  id_hang_hoa: string;
  so_luong: number;
  don_vi_tinh?: string;
  /** Thông số kỹ thuật – tự điền mỗi lần đề xuất, không lấy từ master hàng hóa */
  thong_so?: string;
  /** Ghi chú – tự điền mỗi lần đề xuất */
  ghi_chu?: string;
  /** Enrich từ danh sách hàng hóa */
  ma_hang?: string;
  ten_hang?: string;
}

export interface PhieuDeXuatVatTu {
  id: string;
  so_phieu: string;
  ngay: string;
  /** Ngày cần */
  ngay_can: string;
  /** Nơi đề xuất (id_kho) */
  id_noi_de_xuat: string;
  ten_noi_de_xuat?: string;
  /** Người đề xuất */
  id_nguoi_de_xuat: string;
  ten_nguoi_de_xuat?: string;
  ma_nguoi_de_xuat?: string;
  /** Người duyệt */
  id_nguoi_duyet?: string | null;
  ten_nguoi_duyet?: string | null;
  ma_nguoi_duyet?: string | null;
  ghi_chu?: string;
  /** 0 = Chờ duyệt, 1 = Đã duyệt, 2 = Không duyệt */
  trang_thai: 0 | 1 | 2;
  tg_tao: string;
  tg_cap_nhat: string;
  chi_tiet?: PhieuDeXuatVatTuChiTiet[];
}
