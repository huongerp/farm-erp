import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCauHinhSoPhieuThanhToan,
  getNextSoPhieuThanhToanAndIncrement,
} from '../services/cau-hinh-so-phieu-thanh-toan.service';

export const CAU_HINH_SO_PHIEU_THANH_TOAN_QUERY_KEY = ['cauHinhSoPhieuThanhToan'];

export function useCauHinhSoPhieuThanhToan() {
  return useQuery({
    queryKey: CAU_HINH_SO_PHIEU_THANH_TOAN_QUERY_KEY,
    queryFn: getCauHinhSoPhieuThanhToan,
  });
}

/** Gọi khi tạo phiếu thanh toán mới – trả về số phiếu đã sinh và tăng counter. */
export function useGetNextSoPhieuThanhToanAndIncrement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getNextSoPhieuThanhToanAndIncrement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAU_HINH_SO_PHIEU_THANH_TOAN_QUERY_KEY });
    },
  });
}
