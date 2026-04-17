import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getPhieuBaoTriList,
  getPhieuBaoTriById,
  deletePhieuBaoTri,
  createPhieuBaoTri,
  updatePhieuBaoTri,
  type GetPhieuBaoTriListParams,
} from '../services/bao-tri-sua-chua-service';
import type { PhieuBaoTriSuaChua, PhieuBaoTriSuaChuaCreate } from '../core/types';

const QUERY_KEY = ['phieuBaoTriSuaChua'] as const;

export const usePhieuBaoTriList = (params: GetPhieuBaoTriListParams = {}) =>
  useQuery({
    queryKey: [
      ...QUERY_KEY,
      // q chỉ lọc client — không đưa vào queryKey
      params.hang_muc?.join(',') ?? '',
      params.dateFrom ?? '',
      params.dateTo ?? '',
      Array.isArray(params.id_tai_san) ? params.id_tai_san.join(',') : (params.id_tai_san ?? ''),
    ],
    queryFn: () => getPhieuBaoTriList(params),
  });

export const usePhieuBaoTriById = (id: string | null) =>
  useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => (id ? getPhieuBaoTriById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

export const useDeletePhieuBaoTri = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deletePhieuBaoTri(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('baoTriSuaChua.toast.deleteSuccess', { count: ids.length }));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useCreatePhieuBaoTri = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      id_nguoi_tao,
      ten_nguoi_tao,
    }: {
      data: PhieuBaoTriSuaChuaCreate;
      id_nguoi_tao: string;
      ten_nguoi_tao?: string | null;
    }) => createPhieuBaoTri(data, id_nguoi_tao, { ten_nguoi_tao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('baoTriSuaChua.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdatePhieuBaoTri = (onSuccess?: (data?: PhieuBaoTriSuaChua) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuBaoTriSuaChuaCreate }) =>
      updatePhieuBaoTri(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('baoTriSuaChua.toast.updateSuccess'));
      if (onSuccess) onSuccess(data);
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
