import { useQuery } from '@tanstack/react-query';
import { getTiLeLoiNgayDb } from '../services/giam-sat-chat-luong-db.service';
import { QUERY_KEY_GSCL } from './use-giam-sat-chat-luong';

/** Id chi nhánh hợp lệ cho RPC (bigint dương), không hợp lệ → null. */
function idChiNhanhChoRpc(idChiNhanh: string | number | null | undefined): number | null {
  if (idChiNhanh == null || String(idChiNhanh).trim() === '') return null;
  const n = Number(idChiNhanh);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * % nải lỗi QC của ngày + chi nhánh theo Giám sát chất lượng — cho ô khoá ở Báo cáo sơ chế.
 * Chưa chọn ngày hoặc chi nhánh → không gọi, `data` undefined.
 * Key nằm dưới `QUERY_KEY_GSCL` nên mọi mutation GSCL (invalidate cả nhánh) tự tải lại.
 */
export function useGsclTiLeLoiNgay(ngay: string | null | undefined, idChiNhanh: string | number | null | undefined) {
  const ngayIso = ngay ? ngay.slice(0, 10) : '';
  const cn = idChiNhanhChoRpc(idChiNhanh);
  return useQuery({
    queryKey: [...QUERY_KEY_GSCL, 'tiLeLoiNgay', ngayIso, cn],
    queryFn: () => getTiLeLoiNgayDb(ngayIso, cn!),
    enabled: !!ngayIso && cn != null,
    staleTime: 1000 * 30,
  });
}
