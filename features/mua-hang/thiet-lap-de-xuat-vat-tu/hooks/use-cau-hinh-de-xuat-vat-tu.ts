import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getCauHinhDeXuatVatTu,
  saveCauHinhDeXuatVatTu,
  getNextSoPhieuAndIncrement,
} from '../services/thiet-lap-de-xuat-vat-tu-service';
import type { CauHinhDeXuatVatTu } from '../core/types';

export const CAU_HINH_DE_XUAT_VAT_TU_QUERY_KEY = ['cauHinhDeXuatVatTu'];

export const useCauHinhDeXuatVatTu = () =>
  useQuery({
    queryKey: CAU_HINH_DE_XUAT_VAT_TU_QUERY_KEY,
    queryFn: getCauHinhDeXuatVatTu,
  });

export const useSaveCauHinhDeXuatVatTu = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CauHinhDeXuatVatTu>) => saveCauHinhDeXuatVatTu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAU_HINH_DE_XUAT_VAT_TU_QUERY_KEY });
      toast.success(i18n.t('thietLapDeXuatVatTu.toast.saveSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

/** Gọi khi tạo phiếu mới (tự sinh số phiếu). Trả về so_phieu đã sinh hoặc '' nếu tắt tự sinh. */
export function useGetNextSoPhieuAndIncrement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getNextSoPhieuAndIncrement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAU_HINH_DE_XUAT_VAT_TU_QUERY_KEY });
    },
  });
}
