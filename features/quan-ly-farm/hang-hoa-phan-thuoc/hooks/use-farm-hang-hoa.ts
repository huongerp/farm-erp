import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllFarmHangHoa,
  getFarmHangHoaById,
  createFarmHangHoa,
  updateFarmHangHoa,
  deleteFarmHangHoa,
  deleteFarmHangHoaMany,
} from '../services/farm-hang-hoa-service';
import type { FarmHangHoaFormValues } from '../core/schema';
import type { FarmHangHoa } from '../core/types';
import i18n from '../../../../lib/i18n';
import { FARM_TON_KHO_PT_QUERY_KEY } from '../../ton-kho-phan-thuoc/hooks/use-farm-ton-kho-pt';

export const FARM_HANG_HOA_QUERY_KEY = ['farmHangHoaPhanThuoc'] as const;

/** Đồng bộ dropdown danh mục (cap2) khi hàng hóa đổi danh_muc_id / danh_muc_cha_id */
const FARM_DANH_MUC_QUERY_KEY = ['farmDanhMucHangHoa'] as const;

export const useFarmHangHoaList = () => {
  return useQuery({
    queryKey: FARM_HANG_HOA_QUERY_KEY,
    queryFn: getAllFarmHangHoa,
    staleTime: 1000 * 60 * 15,
  });
};

export const useFarmHangHoaById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...FARM_HANG_HOA_QUERY_KEY, id],
    queryFn: () => getFarmHangHoaById(id!),
    enabled: !!id,
  });
};

export const useCreateFarmHangHoa = (onSuccess?: (created?: FarmHangHoa) => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFarmHangHoa,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateFarmHangHoa = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FarmHangHoaFormValues }) => updateFarmHangHoa(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteFarmHangHoa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFarmHangHoa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteFarmHangHoaMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFarmHangHoaMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
