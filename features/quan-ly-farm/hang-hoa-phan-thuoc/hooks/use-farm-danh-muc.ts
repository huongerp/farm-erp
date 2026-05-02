import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllFarmDanhMuc,
  getFarmDanhMucById,
  getFarmDanhMucCap2WithParent,
  createFarmDanhMuc,
  updateFarmDanhMuc,
  deleteFarmDanhMuc,
  deleteFarmDanhMucMany,
} from '../services/farm-danh-muc-service';
import type { FarmDanhMucFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { FARM_HANG_HOA_QUERY_KEY } from './use-farm-hang-hoa';

const QUERY_KEY = ['farmDanhMucHangHoa'] as const;

export const useFarmDanhMucList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllFarmDanhMuc,
    staleTime: 1000 * 60 * 30,
  });
};

export const useFarmDanhMucById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getFarmDanhMucById(id!),
    enabled: !!id,
  });
};

export const useFarmDanhMucCap2WithParent = () => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'cap2WithParent'],
    queryFn: getFarmDanhMucCap2WithParent,
    staleTime: 1000 * 60 * 30,
  });
};

export const useCreateFarmDanhMuc = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFarmDanhMuc,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateFarmDanhMuc = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FarmDanhMucFormValues }) => updateFarmDanhMuc(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteFarmDanhMuc = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFarmDanhMuc,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteFarmDanhMucMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFarmDanhMucMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
