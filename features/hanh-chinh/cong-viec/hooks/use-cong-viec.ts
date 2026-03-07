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
  getBaoCaoByCongViecId,
  createBaoCaoKetQua,
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
    mutationFn: ({
      data,
      ten_du_an,
    }: {
      data: CongViecFormValues;
      ten_du_an?: string | null;
    }) =>
      createCongViec(
        data,
        user?.id ?? 'emp-000',
        user?.full_name,
        ten_du_an
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.toast.createSuccess'));
      const add = useNotificationStore.getState().add;
      const title = i18n.t('congViec.notif.assigned');
      const link = `/hanh-chinh/cong-viec-cua-toi?detail=${data.id}`;
      (data.danh_sach_nguoi_thuc_hien ?? []).forEach(() => {
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
      ten_du_an,
    }: {
      id: string;
      data: Partial<CongViecFormValues> & { phan_tram_hoan_thanh?: number };
      ten_du_an?: string | null;
    }) => updateCongViec(id, data, ten_du_an),
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
    mutationFn: (ids: string[]) => deleteCongViecList(ids),
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
        ma_cong_viec: string;
        tieu_de: string;
        id_du_an?: string;
        ten_du_an?: string;
        ngay_het_han: string;
        uu_tien: string;
        trang_thai: string;
        phan_tram_hoan_thanh?: number;
        mo_ta?: string;
        danh_sach_nguoi_thuc_hien?: string;
      }>
    ) =>
      importCongViecList(rows, user?.id ?? 'emp-000', user?.full_name),
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

export const useBaoCaoByCongViecId = (id_cong_viec: string | null) =>
  useQuery({
    queryKey: [...CONG_VIEC_QUERY_KEY, 'baoCao', id_cong_viec],
    queryFn: () => (id_cong_viec ? getBaoCaoByCongViecId(id_cong_viec) : Promise.resolve([])),
    enabled: !!id_cong_viec,
  });

export const useCreateBaoCaoKetQua = (id_cong_viec: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: { noi_dung: string; links?: string[]; file_dinh_kem?: string }) =>
      createBaoCaoKetQua(id_cong_viec, data, user?.id ?? 'emp-000', user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.baoCaoKetQua.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useBinhLuanByCongViecId = (id_cong_viec: string | null) =>
  useQuery({
    queryKey: [...CONG_VIEC_QUERY_KEY, 'binhLuan', id_cong_viec],
    queryFn: () => (id_cong_viec ? getBinhLuanByCongViecId(id_cong_viec) : Promise.resolve([])),
    enabled: !!id_cong_viec,
  });
export const useCreateBinhLuan = (id_cong_viec: string, onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (noi_dung: string) =>
      createBinhLuan(id_cong_viec, noi_dung, user?.id ?? 'emp-000', user?.full_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONG_VIEC_QUERY_KEY });
      toast.success(i18n.t('congViec.binhLuan.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
