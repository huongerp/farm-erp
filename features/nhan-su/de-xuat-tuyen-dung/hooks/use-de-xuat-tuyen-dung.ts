import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getDeXuatTuyenDungs,
  createDeXuatTuyenDung,
  updateDeXuatTuyenDung,
  deleteDeXuatTuyenDungs,
  updateDeXuatTuyenDungStatus,
  updateDeXuatTuyenDungStatusWithNote,
} from '../services/de-xuat-tuyen-dung-service';
import type { DeXuatTuyenDungFormValues } from '../core/schema';
import type { DeXuatTuyenDung } from '../core/types';

const QUERY_KEY = ['deXuatTuyenDung'];

export const useDeXuatTuyenDungs = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getDeXuatTuyenDungs,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateDeXuatTuyenDung = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeXuatTuyenDungFormValues) => createDeXuatTuyenDung(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('deXuatTuyenDung.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateDeXuatTuyenDung = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeXuatTuyenDungFormValues }) =>
      updateDeXuatTuyenDung(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('deXuatTuyenDung.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateDeXuatTuyenDungStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 | 2 | 3 }) =>
      updateDeXuatTuyenDungStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(
        i18n.t('deXuatTuyenDung.toast.statusUpdate', { count: variables.ids.length })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateDeXuatTuyenDungStatusWithNote = (onSuccess?: (updated: DeXuatTuyenDung) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, ghi_chu }: { id: string; status: 0 | 1 | 2 | 3; ghi_chu: string | null }) =>
      updateDeXuatTuyenDungStatusWithNote(id, status, ghi_chu),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('deXuatTuyenDung.toast.statusUpdate', { count: 1 }));
      onSuccess?.(updated);
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteDeXuatTuyenDungs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDeXuatTuyenDungs(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('deXuatTuyenDung.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
