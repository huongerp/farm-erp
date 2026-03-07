import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import type { DangKyThamGia } from '../core/types';
import type { DangKyTuDangKyFormValues, GiaoKhoaFormValues } from '../core/schema';
import {
  getDangKyList,
  getDangKyById,
  createDangKyTuDangKy,
  createDangKyGiao,
  updateDangKyTrangThai,
  deleteDangKy,
  getKhoaMoDangKy,
} from '../services/dang-ky-dao-tao-service';
import type { KhoaDaoTao } from '@/features/nhan-su/khoa-dao-tao/core/types';

const QUERY_KEY_LIST = ['dangKyDaoTao'];
const QUERY_KEY_ID = (id: string) => ['dangKyDaoTao', id];
const QUERY_KEY_KHOA_MO = (idChucVu: string[] | undefined) => ['dangKyDaoTao', 'khoaMoDangKy', idChucVu?.join(',')];

export const useDangKyList = (
  params?: {
    id_nhan_vien?: string;
    id_khoa_hoc?: string;
    trang_thai?: number;
  },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [...QUERY_KEY_LIST, params?.id_nhan_vien, params?.id_khoa_hoc, params?.trang_thai],
    queryFn: () => getDangKyList(params),
    staleTime: 1000 * 60 * 2,
    enabled: options?.enabled !== false,
  });
};

export const useDangKyById = (id: string | null) => {
  return useQuery({
    queryKey: QUERY_KEY_ID(id ?? ''),
    queryFn: () => getDangKyById(id!),
    enabled: !!id,
  });
};

export const useCreateDangKyTuDangKy = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, id_nhan_vien }: { data: DangKyTuDangKyFormValues; id_nhan_vien: string }) =>
      createDangKyTuDangKy(data, id_nhan_vien),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_LIST });
      toast.success(i18n.t('dangKyDaoTao.toast.dangKySuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useCreateDangKyGiao = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, id_nguoi_giao }: { data: GiaoKhoaFormValues; id_nguoi_giao: string }) =>
      createDangKyGiao(data, id_nguoi_giao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_LIST });
      toast.success(i18n.t('dangKyDaoTao.toast.giaoSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateDangKyTrangThai = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: DangKyThamGia['trang_thai'] }) =>
      updateDangKyTrangThai(id, trang_thai),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_LIST });
      qc.invalidateQueries({ queryKey: QUERY_KEY_ID(data.id) });
      toast.success(i18n.t('dangKyDaoTao.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteDangKy = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDangKy(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_LIST });
      qc.invalidateQueries({ queryKey: QUERY_KEY_ID(id) });
      toast.success(i18n.t('dangKyDaoTao.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useKhoaMoDangKy = (id_chuc_vu_user: string[] | undefined) => {
  return useQuery({
    queryKey: QUERY_KEY_KHOA_MO(id_chuc_vu_user),
    queryFn: () => getKhoaMoDangKy(id_chuc_vu_user),
    enabled: true,
    staleTime: 1000 * 60 * 2,
  });
};
