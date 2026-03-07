import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllHangHoa,
  getHangHoaById,
  createHangHoa,
  updateHangHoa,
  deleteHangHoa,
  deleteHangHoaMany,
} from '../services/hang-hoa-service';
import type { HangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['hangHoa'] as const;

export const useHangHoaList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllHangHoa,
    staleTime: 1000 * 60 * 5,
  });
};

export const useHangHoaById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getHangHoaById(id!),
    enabled: !!id,
  });
};

export const useCreateHangHoa = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHangHoa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hangHoa.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateHangHoa = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HangHoaFormValues }) => updateHangHoa(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hangHoa.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteHangHoa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHangHoa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteHangHoaMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHangHoaMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
