import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getKyKhauHaoList,
  getKyKhauHaoById,
  createKyKhauHao,
  updateKyKhauHao,
  getChiTietKhauHao,
  tinhToanKhauHaoKy,
  chotKy,
  deleteKyKhauHao,
  updateKyKhauHaoGhiChu,
  updateKyKhauHaoTrangThai,
} from '../services/khau-hao-tai-san-service';
import type { KyKhauHaoFormValues } from '../core/schema';

const QUERY_KEY_KY = ['khauHaoTaiSan', 'ky'] as const;
const queryKeyChiTiet = (idKy: string) => ['khauHaoTaiSan', 'chiTiet', idKy] as const;

export const useKyKhauHaoList = () => {
  return useQuery({
    queryKey: QUERY_KEY_KY,
    queryFn: getKyKhauHaoList,
    staleTime: 1000 * 60 * 2,
  });
};

export const useKyKhauHaoById = (id: string | null) => {
  return useQuery({
    queryKey: ['khauHaoTaiSan', 'ky', id],
    queryFn: () => (id ? getKyKhauHaoById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
};

export const useCreateKyKhauHao = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: KyKhauHaoFormValues) => createKyKhauHao(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_KY });
      toast.success(i18n.t('khauHaoTaiSan.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateKyKhauHao = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KyKhauHaoFormValues }) =>
      updateKyKhauHao(id, data),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_KY });
      toast.success(i18n.t('khauHaoTaiSan.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useChiTietKhauHao = (idKy: string | null) => {
  return useQuery({
    queryKey: idKy ? queryKeyChiTiet(idKy) : ['khauHaoTaiSan', 'chiTiet', ''],
    queryFn: () => (idKy ? getChiTietKhauHao(idKy) : Promise.resolve([])),
    enabled: !!idKy,
    staleTime: 1000 * 60,
  });
};

export const useTinhToanKhauHaoKy = (idKy: string | null, onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => (idKy ? tinhToanKhauHaoKy(idKy) : Promise.reject(new Error('No idKy'))),
    onSuccess: (_data, _v) => {
      if (idKy) {
        queryClient.invalidateQueries({ queryKey: queryKeyChiTiet(idKy) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_KY });
      }
      toast.success(i18n.t('khauHaoTaiSan.toast.tinhToanSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useChotKy = (idKy: string | null, onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => (idKy ? chotKy(idKy) : Promise.reject(new Error('No idKy'))),
    onSuccess: () => {
      if (idKy) {
        queryClient.invalidateQueries({ queryKey: queryKeyChiTiet(idKy) });
        queryClient.invalidateQueries({ queryKey: QUERY_KEY_KY });
      }
      queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
      toast.success(i18n.t('khauHaoTaiSan.toast.chotKySuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteKyKhauHao = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteKyKhauHao(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_KY });
      queryClient.invalidateQueries({ queryKey: queryKeyChiTiet(id) });
      toast.success(i18n.t('khauHaoTaiSan.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateKyKhauHaoGhiChu = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ghi_chu }: { id: string; ghi_chu: string | null }) =>
      updateKyKhauHaoGhiChu(id, ghi_chu),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_KY });
      toast.success(i18n.t('khauHaoTaiSan.toast.ghiChuSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateKyKhauHaoTrangThai = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: 'draft' | 'chot' }) =>
      updateKyKhauHaoTrangThai(id, trang_thai),
    onSuccess: (_data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_KY });
      toast.success(i18n.t('khauHaoTaiSan.toast.statusSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
