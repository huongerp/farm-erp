/**
 * Bảng mô tả 7 module được đấu thông báo đợt đầu.
 *
 * Mỗi bảng nghiệp vụ đặt tên cột một kiểu (`nguoi_tao_id` với phiếu kho,
 * `id_nguoi_de_xuat` với phiếu đề xuất, `id_nguoi_dat` với đơn đặt hàng), nên
 * mọi khác biệt đó gom hết vào đây. Lớp luật và lớp render chỉ nói chuyện bằng
 * khái niệm nghiệp vụ.
 *
 * Đấu thêm module về sau = thêm một mục ở đây + một CREATE TRIGGER.
 */

export interface MoTaBang {
  /** Tên bảng trong Postgres. */
  bang: string;
  /**
   * Mã module dùng cho PHÂN QUYỀN — không phải lúc nào cũng trùng đường dẫn.
   * Phiếu kho có URL /mua-hang/phieu-kho nhưng mã quyền là kho-van/phieu-kho
   * (xem KHO_VAN_SLUGS trong permission-modules-config.ts).
   */
  moduleId: string;
  /** Đường dẫn module trong app, dùng dựng link điều hướng. */
  duongDan: string;
  /** Tên loại chứng từ để viết câu thông báo: "Phiếu kho", "Đề xuất mua hàng"… */
  tenChungTu: string;
  /** Cột chứa mã/số phiếu hiển thị cho người dùng. */
  cotSoPhieu?: string;
  /** Cột chứa id người tạo/người đề xuất/người đặt. */
  cotNguoiTao?: string;
  /** Cột chứa id người duyệt (nếu bảng có lưu). */
  cotNguoiDuyet?: string;
  /** Có trang xem trước riêng (/…/preview/:id) hay không. */
  coTrangPreview?: boolean;
  /**
   * Module không có trang preview nhưng mở được bản ghi bằng query param
   * (`/duong-dan?<thamSoPhieu>=<id>`) — trang tự chọn tab rồi bật drawer chi
   * tiết. Tên tham số khai ở đây vì mỗi module đã trót đặt một kiểu: phiếu
   * hành chính dùng `phieu`, công việc đọc sẵn `detail`.
   * Bỏ qua nếu `coTrangPreview` bật — trang preview luôn ưu tiên.
   */
  thamSoPhieu?: string;
  /**
   * Nhóm duyệt tra theo PHÒNG BAN CỦA NGƯỜI TẠO (rpc_tb_nguoi_duyet_phong_ban)
   * thay vì theo chi nhánh của phiếu (rpc_tb_nguoi_duyet). Phiếu hành chính là
   * module duy nhất như vậy: nó không gắn kho nào nên nhánh chi nhánh luôn trả
   * NULL, mà người duyệt thật sự là quản lý phòng của người xin nghỉ.
   */
  nhomDuyetTheoPhongBanNguoiTao?: boolean;
  /** Cột khoá ngoại trỏ danh mục loại phiếu — worker tra tên trước khi render. */
  cotLoaiPhieu?: string;
}

export const MO_TA_BANG: Record<string, MoTaBang> = {
  // --- Bốn module phiếu dùng chung bộ trạng thái duyệt -----------------------
  fp_mh_phieu_kho: {
    bang: 'fp_mh_phieu_kho',
    moduleId: 'kho-van/phieu-kho',
    duongDan: '/mua-hang/phieu-kho',
    tenChungTu: 'Phiếu kho',
    cotSoPhieu: 'so_phieu',
    cotNguoiTao: 'nguoi_tao_id',
    cotNguoiDuyet: 'id_nguoi_duyet',
    coTrangPreview: true,
  },
  fp_mh_phieu_de_xuat_vat_tu: {
    bang: 'fp_mh_phieu_de_xuat_vat_tu',
    moduleId: 'mua-hang/phieu-de-xuat-vat-tu',
    duongDan: '/mua-hang/phieu-de-xuat-vat-tu',
    tenChungTu: 'Phiếu đề xuất vật tư',
    cotSoPhieu: 'so_phieu',
    cotNguoiTao: 'id_nguoi_de_xuat',
    cotNguoiDuyet: 'id_nguoi_duyet',
    coTrangPreview: true,
  },
  fp_farm_de_xuat_mua_hang: {
    bang: 'fp_farm_de_xuat_mua_hang',
    moduleId: 'quan-ly-nha-so-che/de-xuat-mua-hang',
    duongDan: '/quan-ly-nha-so-che/de-xuat-mua-hang',
    tenChungTu: 'Đề xuất mua hàng',
    cotSoPhieu: 'so_phieu',
    cotNguoiTao: 'id_nguoi_de_xuat',
    cotNguoiDuyet: 'id_nguoi_duyet',
    coTrangPreview: true,
  },
  fp_farm_phieu_kho_phan_thuoc: {
    bang: 'fp_farm_phieu_kho_phan_thuoc',
    moduleId: 'quan-ly-nha-so-che/phieu-kho-phan-thuoc',
    duongDan: '/quan-ly-nha-so-che/phieu-kho-phan-thuoc',
    tenChungTu: 'Phiếu kho farm',
    cotSoPhieu: 'so_phieu',
    cotNguoiTao: 'nguoi_tao_id',
    cotNguoiDuyet: 'id_nguoi_duyet',
    coTrangPreview: true,
  },

  // --- Công việc ------------------------------------------------------------
  fp_hc_cong_viec: {
    bang: 'fp_hc_cong_viec',
    moduleId: 'hanh-chinh/cong-viec',
    duongDan: '/hanh-chinh/cong-viec',
    tenChungTu: 'Công việc',
    cotSoPhieu: 'tieu_de',
    cotNguoiTao: 'id_nguoi_giao',
  },

  // --- Phiếu hành chính -----------------------------------------------------
  fp_hr_phieu_hanh_chinh: {
    bang: 'fp_hr_phieu_hanh_chinh',
    moduleId: 'hanh-chinh/phieu-hanh-chinh',
    duongDan: '/hanh-chinh/phieu-hanh-chinh',
    tenChungTu: 'Phiếu hành chính',
    cotNguoiTao: 'nguoi_tao_id',
    cotLoaiPhieu: 'loai_phieu_id',
    thamSoPhieu: 'phieu',
    nhomDuyetTheoPhongBanNguoiTao: true,
  },

  // --- Sổ quỹ (khoá / xin mở khoá) ------------------------------------------
  fp_tc_quy_thu_chi: {
    bang: 'fp_tc_quy_thu_chi',
    moduleId: 'tai-chinh/thu-chi-quy',
    duongDan: '/tai-chinh/thu-chi-quy',
    tenChungTu: 'Phiếu quỹ',
    cotSoPhieu: 'so_phieu',
    cotNguoiTao: 'id_nguoi_tao',
  },

  // --- Đơn đặt hàng ---------------------------------------------------------
  fp_mh_don_dat_hang: {
    bang: 'fp_mh_don_dat_hang',
    moduleId: 'mua-hang/don-dat-hang',
    duongDan: '/mua-hang/don-dat-hang',
    tenChungTu: 'Đơn đặt hàng',
    cotSoPhieu: 'so_po',
    cotNguoiTao: 'id_nguoi_dat',
    cotNguoiDuyet: 'id_nguoi_duyet',
    coTrangPreview: true,
  },
};

export function layMoTaBang(bang: string): MoTaBang | null {
  return MO_TA_BANG[bang] ?? null;
}

/** Link điều hướng khi người dùng bấm vào thông báo. */
export function dungLink(moTa: MoTaBang, banGhiId: number): string {
  if (moTa.coTrangPreview) return `${moTa.duongDan}/preview/${banGhiId}`;
  if (moTa.thamSoPhieu) return `${moTa.duongDan}?${moTa.thamSoPhieu}=${banGhiId}`;
  return moTa.duongDan;
}
