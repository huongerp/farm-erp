import { useQuery } from '@tanstack/react-query';
import { idChiNhanhChoRpc } from '../../danh-gia-dau-vao/services/danh-gia-dau-vao-tong-ngay.service';
import { getBcscTonDauNgayDb } from '../services/ton-dau-ngay.service';
import { QUERY_KEY_BAO_CAO_SO_CHE } from './use-bao-cao-so-che';

/**
 * Tồn đầu ngày theo phiếu liền trước (ngày + chi nhánh đang chọn) — cho ô khoá mục 6.
 * Key dưới `baoCaoSoChe` → lưu / xoá phiếu là tải lại. Chưa chọn ngày hoặc chi nhánh → không gọi.
 */
export function useBcscTonDauNgay(ngay: string | null | undefined, idChiNhanh: string | number | null | undefined) {
  const ngayIso = ngay ? ngay.slice(0, 10) : '';
  const cn = idChiNhanhChoRpc(idChiNhanh);
  return useQuery({
    queryKey: [...QUERY_KEY_BAO_CAO_SO_CHE, 'tonDauNgay', ngayIso, cn],
    queryFn: () => getBcscTonDauNgayDb(ngayIso, cn!),
    enabled: !!ngayIso && cn != null,
    staleTime: 1000 * 30,
  });
}
