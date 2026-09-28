import { useQuery } from '@tanstack/react-query';
import { getSinhNhatNhanVien } from '../services/sinh-nhat-service';

/** Sinh nhật toàn công ty — vài chục dòng, đổi rất hiếm nên giữ cache nửa ngày. */
export const useSinhNhatNhanVien = (enabled = true) =>
  useQuery({
    queryKey: ['nhan-vien', 'sinh-nhat'],
    queryFn: getSinhNhatNhanVien,
    staleTime: 1000 * 60 * 60 * 12,
    enabled,
  });
