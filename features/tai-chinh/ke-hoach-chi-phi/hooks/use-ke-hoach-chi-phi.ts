import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllKeHoachChiPhi,
  getKeHoachChiPhiById,
  getKeHoachChiPhiByNam,
  getPlanRowsAggregatedByNam,
  createKeHoachChiPhi,
  updateKeHoachChiPhi,
  deleteKeHoachChiPhi,
  deleteKeHoachChiPhiMany,
  getThucChiTheoThang,
  getThuChiDrillDown,
} from '../services/ke-hoach-chi-phi-service';
import type { KeHoachChiPhiFormValues } from '../core/schema';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['ke-hoach-chi-phi'];

export const useKeHoachChiPhiList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllKeHoachChiPhi,
    staleTime: 1000 * 60 * 5,
  });
};

export const useKeHoachChiPhiById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getKeHoachChiPhiById(id!),
    enabled: !!id,
  });
};

export const useKeHoachChiPhiByNam = (nam: number | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'nam', nam],
    queryFn: () => getKeHoachChiPhiByNam(nam!),
    enabled: nam !== undefined && nam >= 2000,
  });
};

export const usePlanRowsAggregatedByNam = (nam: number | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'aggregated', nam],
    queryFn: () => getPlanRowsAggregatedByNam(nam!),
    enabled: nam !== undefined && nam >= 2000,
  });
};

export const useThucChiTheoThang = (nam: number | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'thuc-chi', nam],
    queryFn: () => getThucChiTheoThang(nam!),
    enabled: nam !== undefined && nam >= 2000,
  });
};

export const useThuChiDrillDown = (nam: number | undefined, thang: number, idDanhMuc: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'drill-down', nam, thang, idDanhMuc],
    queryFn: () => getThuChiDrillDown(nam!, thang, idDanhMuc!),
    enabled: nam !== undefined && thang >= 1 && thang <= 12 && !!idDanhMuc,
  });
};

export const useCreateKeHoachChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKeHoachChiPhi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('keHoachChiPhi.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateKeHoachChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KeHoachChiPhiFormValues }) =>
      updateKeHoachChiPhi(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
      toast.success(i18n.t('keHoachChiPhi.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteKeHoachChiPhi = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKeHoachChiPhi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('keHoachChiPhi.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteKeHoachChiPhiMany = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKeHoachChiPhiMany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('keHoachChiPhi.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
