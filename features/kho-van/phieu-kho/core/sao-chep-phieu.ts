import { LOAI_DB_TO_TAB, LOAI_TAB_TO_DB, type LoaiPhieuKhoTab, type PhieuKho } from './types';

interface TuyChonSaoChep {
  /** Ngày phiếu mới (YYYY-MM-DD). */
  homNay: string;
  /** Mô tả gán cho phiếu mới khi ĐỔI loại (vd "Sao chép từ phiếu NK-3105"). */
  moTaKhiDoiLoai: string;
}

/**
 * Bản sao phiếu kho để mở form tạo mới, có thể đổi loại (nhập → xuất / chuyển…).
 * Giữ kho, hàng, SL, đơn giá, số lô, phẩm cấp, ghi chú dòng. Khi đổi loại thì bỏ các trường chỉ
 * có nghĩa với loại cũ: đơn PO (chỉ phiếu nhập), NCC (nhập), khách hàng (xuất), kho đến (chuyển).
 */
export function taoBanSaoPhieuKho(item: PhieuKho, loaiMoi: LoaiPhieuKhoTab, opts: TuyChonSaoChep): PhieuKho {
  const doiLoai = LOAI_DB_TO_TAB[item.loai] !== loaiMoi;
  return {
    ...item,
    id: '',
    so_phieu: '',
    loai: LOAI_TAB_TO_DB[loaiMoi],
    trang_thai: 'Chờ duyệt',
    ngay: opts.homNay,
    trao_doi: undefined,
    id_nguoi_duyet: undefined,
    ten_nguoi_duyet: undefined,
    id_nguoi_nhan: undefined,
    ten_nguoi_nhan: undefined,
    tg_nhan: undefined,
    nguoi_tao_id: undefined,
    ten_nguoi_tao: undefined,
    ...(doiLoai && {
      id_don_dat_hang: null,
      so_po_don_dat_hang: null,
      id_nha_cung_cap: loaiMoi === 'nhap' ? item.id_nha_cung_cap : null,
      ten_nha_cung_cap: loaiMoi === 'nhap' ? item.ten_nha_cung_cap : undefined,
      id_khach_hang: loaiMoi === 'xuat' ? item.id_khach_hang : null,
      ten_khach_hang: loaiMoi === 'xuat' ? item.ten_khach_hang : undefined,
      kho_den_id: loaiMoi === 'chuyen' ? (item.kho_den_id ?? null) : null,
      ten_kho_den: loaiMoi === 'chuyen' ? item.ten_kho_den : undefined,
      mo_ta: opts.moTaKhiDoiLoai,
    }),
  };
}
