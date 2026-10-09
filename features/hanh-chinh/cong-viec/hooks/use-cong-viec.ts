import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import {
  getCongViecList,
  getCongViecById,
  createCongViec,
  updateCongViec,
  deleteCongViecList,
  updateCongViecMany,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.toast.createSuccess'));
      // Thông báo cho người chịu trách nhiệm và nhóm hỗ trợ do trigger DB sinh ra
      // (docs/db-schema-baseline.sql). Trước đây chỗ này tự thêm
      // thông báo vào store phía client — chúng chỉ hiện với chính người tạo và
      // không bao giờ tới được người nhận thật.
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

/** Import Excel: lỗi từng dòng trả về trong `errors` để ImportDialog hiển thị. */
export const useImportCongViec = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (items: Parameters<typeof importCongViecList>[0]) =>
      importCongViecList(items, (user?.id as number | string) ?? 0),
    onSuccess: (result) => {
      if (result.created === 0) return;
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.toast.importSuccess', { count: result.created }));
    },
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
  return useMutation({
    mutationFn: (noi_dung: string) => createBinhLuan(id_cong_viec, noi_dung),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.binhLuan.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

/** Đổi trạng thái / giao lại hàng loạt — một request, một toast (không loop useUpdateCongViec). */
export const useUpdateCongViecMany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, patch }: { ids: (number | string)[]; patch: Parameters<typeof updateCongViecMany>[1] }) =>
      updateCongViecMany(ids, patch),
    onSuccess: (count, { patch }) => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(
        i18n.t('trang_thai' in patch ? 'congViec.bulk.toast.trangThaiSuccess' : 'congViec.bulk.toast.giaoLaiSuccess', {
          count,
        })
      );
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
