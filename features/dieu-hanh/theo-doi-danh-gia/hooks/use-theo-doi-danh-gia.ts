import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getBaoCaoList,
  getBaoCaoById,
  createBaoCao,
  updateBaoCao,
  deleteBaoCao,
  type BaoCaoListParams,
} from '../services/theo-doi-danh-gia-service';
import type { BaoCaoKetQuaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['theoDoiDanhGia'] as const;

export function useBaoCaoList(params?: BaoCaoListParams) {
  return useQuery({
    queryKey: [
      ...QUERY_KEY,
      'list',
      params?.id_tieu_chi,
      params?.id_phong_ban,
      params?.ky_nam,
      params?.ky_quy,
      params?.ky_thang,
      params?.trang_thai,
    ],
    queryFn: () => getBaoCaoList(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useBaoCaoById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => getBaoCaoById(id!),
    enabled: !!id,
  });
}

export function useCreateBaoCao(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBaoCao,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('theoDoiDanhGia.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBaoCao(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BaoCaoKetQuaFormValues> }) =>
      updateBaoCao(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('theoDoiDanhGia.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBaoCao(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBaoCao,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('theoDoiDanhGia.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
