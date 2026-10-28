import { useQuery } from '@tanstack/react-query';
import {
  getDgdvTongChuyenDb,
  getDgdvTongNgayDayDb,
  getDgdvTongNgayDb,
  idChiNhanhChoRpc,
  type DgdvPhamViTong,
} from '../services/danh-gia-dau-vao-tong-ngay.service';
import { QUERY_KEY_DGDV } from './use-danh-gia-dau-vao';

/** Tab «Bảng đánh giá» của module (mở tab mới từ ô khoá ở Báo cáo sơ chế / Dự báo). */
export const DGDV_BANG_DANH_GIA_URL = '/quan-ly-nha-so-che/danh-gia-dau-vao?tab=bang';

/**
 * Tổng thu + KSC của ngày + chi nhánh theo Đánh giá đầu vào (mọi chuyến) — cho ô khoá ở Báo cáo sơ chế / Dự báo.
 * Chưa chọn ngày hoặc chi nhánh → không gọi, `data` undefined.
 * Key nằm dưới `QUERY_KEY_DGDV` nên lưu phiếu Đánh giá đầu vào (invalidate cả nhánh) là tự tải lại.
 */
export function useDgdvTongNgay(ngay: string | null | undefined, idChiNhanh: string | number | null | undefined) {
  const ngayIso = ngay ? ngay.slice(0, 10) : '';
  const cn = idChiNhanhChoRpc(idChiNhanh);
  return useQuery({
    queryKey: [...QUERY_KEY_DGDV, 'tongNgay', ngayIso, cn],
    queryFn: () => getDgdvTongNgayDb(ngayIso, cn!),
    enabled: !!ngayIso && cn != null,
    staleTime: 1000 * 30,
  });
}

const khoaPhamVi = (pv: DgdvPhamViTong) => [pv.idChiNhanh, pv.viewAll, [...pv.allowedBranchIds].sort().join(',')];

/** Tổng ngày × lô × dây (cộng mọi chuyến) trong khoảng ngày — view `v_fp_farm_dgdv_tong_ngay_day`. */
export function useDgdvTongNgayDay(tu: string, den: string, pv: DgdvPhamViTong, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DGDV, 'tongNgayDay', tu, den, ...khoaPhamVi(pv)],
    queryFn: () => getDgdvTongNgayDayDb(tu, den, pv),
    enabled: enabled && !!tu && !!den,
    staleTime: 1000 * 30,
  });
}

/** Tổng từng chuyến trong khoảng ngày — view `v_fp_farm_dgdv_tong_chuyen`. */
export function useDgdvTongChuyen(tu: string, den: string, pv: DgdvPhamViTong, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DGDV, 'tongChuyen', tu, den, ...khoaPhamVi(pv)],
    queryFn: () => getDgdvTongChuyenDb(tu, den, pv),
    enabled: enabled && !!tu && !!den,
    staleTime: 1000 * 30,
  });
}
