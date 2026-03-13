import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import { useNotificationStore } from '../../../../store/useNotificationStore';
import {
  getCongViecList,
  getCongViecById,
  createCongViec,
  updateCongViec,
  deleteCongViecList,
  importCongViecList,
  getBinhLuanByCongViecId,
  createBinhLuan,
} from '../services/cong-viec-service';
import type { CongViecFormValues } from '../core/schema';

export const CONG_VIEC_QUERY_KEY = ['congViec'];

export const useCongViecList = () =>
  useQuery({
    queryKey: CONG_VIEC_QUERY_KEY,
    queryFn: getCongViecList,
  });

export const useCongViecById = (id: string | null) =>
  useQuery({
    queryKey: [...CONG_VIEC_QUERY_KEY, id],
    queryFn: () => (id ? getCongViecById(id) : Promise.resolve(null)),
    enabled: !!id,
  });

export const useCreateCongViec = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: CongViecFormValues) =>
      createCongViec(data, (user?.id as number | string) ?? 0),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.toast.createSuccess'));
      const add = useNotificationStore.getState().add;
      const title = i18n.t('congViec.notif.assigned');
      const link = `/hanh-chinh/cong-viec?detail=${data.id}`;
      const recipients = [data.trach_nhiem, ...(data.nguoi_ho_tro ?? [])].filter((id): id is number => id != null);
      recipients.forEach(() => {
        add({ title, message: data.tieu_de, type: 'info', link });
      });
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateCongViec = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: Partial<CongViecFormValues> & { trao_doi?: import('../core/types').TraoDoiEntry[]; ket_qua?: string | null; link_ket_qua?: string | null };
    }) => updateCongViec(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteCongViecList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: (number | string)[]) => deleteCongViecList(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.toast.deleteSuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useImportCongViec = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (
      rows: Array<{
        tieu_de: string;
        mo_ta?: string;
        uu_tien?: string;
        trang_thai?: string;
        trach_nhiem?: string;
        nguoi_ho_tro?: string;
      }>
    ) => importCongViecList(rows, (user?.id as number | string) ?? 0),
    onSuccess: (result, _variables) => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      const msg =
        result.errors.length > 0
          ? i18n.t('congViec.toast.importPartial', { created: result.created, errors: result.errors.length })
          : i18n.t('congViec.toast.importSuccess', { count: result.created });
      toast.success(msg);
      if (result.errors.length > 0) result.errors.forEach((e) => toast.error(e));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useBinhLuanByCongViecId = (id_cong_viec: number | string | null) =>
  useQuery({
    queryKey: [...CONG_VIEC_QUERY_KEY, 'binhLuan', id_cong_viec],
    queryFn: () => (id_cong_viec != null ? getBinhLuanByCongViecId(id_cong_viec) : Promise.resolve([])),
    enabled: id_cong_viec != null && id_cong_viec !== '',
  });

export const useCreateBinhLuan = (id_cong_viec: number | string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (noi_dung: string) =>
      createBinhLuan(id_cong_viec, noi_dung, String(user?.id ?? ''), user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.binhLuan.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
