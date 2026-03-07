import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getDuAnList,
  getDuAnById,
  createDuAn,
  updateDuAn,
  deleteDuAnList,
  importDuAnList,
} from '../services/du-an-service';
import type { DuAnFormValues } from '../core/schema';

export const DU_AN_QUERY_KEY = ['duAn'];

export const useDuAnList = () =>
  useQuery({
    queryKey: DU_AN_QUERY_KEY,
    queryFn: getDuAnList,
  });

export const useDuAnById = (id: string | null) =>
  useQuery({
    queryKey: [...DU_AN_QUERY_KEY, id],
    queryFn: () => (id ? getDuAnById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

export const useCreateDuAn = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      ten_phong_ban,
    }: {
      data: DuAnFormValues;
      ten_phong_ban?: string;
    }) => createDuAn(data, ten_phong_ban),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DU_AN_QUERY_KEY });
      toast.success(i18n.t('duAn.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateDuAn = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      ten_phong_ban,
    }: {
      id: string;
      data: DuAnFormValues;
      ten_phong_ban?: string;
    }) => updateDuAn(id, data, ten_phong_ban),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DU_AN_QUERY_KEY });
      toast.success(i18n.t('duAn.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteDuAnList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDuAnList(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: DU_AN_QUERY_KEY });
      toast.success(i18n.t('duAn.toast.deleteSuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useImportDuAn = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      rows: Array<{
        ma_du_an: string;
        ten_du_an: string;
        id_phong_ban?: string;
        ngay_bat_dau: string;
        ngay_ket_thuc: string;
        muc_tieu?: string;
        mo_ta?: string;
        trang_thai?: number;
      }>
    ) => importDuAnList(rows),
    onSuccess: (result, _variables) => {
      queryClient.invalidateQueries({ queryKey: DU_AN_QUERY_KEY });
      if (result.created > 0) {
        toast.success(i18n.t('duAn.toast.importSuccess', { count: result.created }));
      }
      if (result.errors.length > 0) {
        toast.warning(result.errors.slice(0, 3).join('; '));
      }
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
