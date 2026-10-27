import { useQuery } from '@tanstack/react-query';
import { getDgdvTongNgayDb, idChiNhanhChoRpc } from '../services/danh-gia-dau-vao-tong-ngay.service';
import { QUERY_KEY_DGDV } from './use-danh-gia-dau-vao';

/** Tab «Bảng đánh giá» của module (mở tab mới từ ô khoá ở Báo cáo sơ chế / Dự báo). */
export const DGDV_BANG_DANH_GIA_URL = '/quan-ly-nha-so-che/danh-gia-dau-vao?tab=bang';

/**
 * Tổng thu + KSC của ngày + chi nhánh theo Đánh giá đầu vào — cho ô khoá ở Báo cáo sơ chế / Dự báo.
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
