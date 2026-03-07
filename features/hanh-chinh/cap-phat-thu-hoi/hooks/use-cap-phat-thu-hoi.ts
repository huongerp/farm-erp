import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getPhieuList,
  getPhieuById,
  deletePhieu,
  createPhieuAndExecute,
  updatePhieu,
  type GetPhieuListParams,
} from '../services/cap-phat-thu-hoi-service';
import type { PhieuCapPhatThuHoi, PhieuCapPhatThuHoiCreate } from '../core/types';

const QUERY_KEY = ['phieuCapPhatThuHoi'] as const;

export const usePhieuList = (params: GetPhieuListParams = {}) =>
  useQuery({
    queryKey: [...QUERY_KEY, params.filter ?? 'all', params.id_nguoi ?? '', params.q ?? '', params.id_tai_san ?? ''],
    queryFn: () => getPhieuList(params),
  });

export const usePhieuById = (id: string | null) =>
  useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: () => (id ? getPhieuById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

export const useDeletePhieu = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deletePhieu(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('capPhatThuHoi.toast.deleteSuccess', { count: ids.length }));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useCreatePhieuAndExecute = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      id_nguoi_thuc_hien,
    }: {
      data: PhieuCapPhatThuHoiCreate;
      id_nguoi_thuc_hien: string;
    }) => createPhieuAndExecute(data, id_nguoi_thuc_hien),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
      toast.success(i18n.t('capPhatThuHoi.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdatePhieu = (onSuccess?: (data?: PhieuCapPhatThuHoi) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      id_nguoi_thuc_hien,
    }: {
      id: string;
      data: PhieuCapPhatThuHoiCreate;
      id_nguoi_thuc_hien: string;
    }) => updatePhieu(id, data, id_nguoi_thuc_hien),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
      toast.success(i18n.t('capPhatThuHoi.toast.updateSuccess'));
      if (onSuccess) onSuccess(data);
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
