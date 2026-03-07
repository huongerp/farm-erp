import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getDotKiemKeKhoList,
  getDotKiemKeKhoById,
  getChiTietByDot,
  createDotKiemKeKho,
  updateDotKiemKeKho,
  deleteDotKiemKeKho,
  taoDanhSachKiemKe,
  updateChiTietKetQua,
  dieuChinhTonTheoKetQua,
  dieuChinhTonTheoDot,
  hoanThanhDot,
  changeTrangThaiDot,
} from '../services/kiem-ke-kho-service';
import type { TaoDanhSachKiemKeKhoFilters } from '../services/kiem-ke-kho-service';
import type { DotKiemKeKhoCreate, ChiTietKiemKeKhoUpdate } from '../core/types';
import type { TrangThaiDotKiemKeKho } from '../core/types';

export interface UseDotKiemKeKhoListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  trang_thai_dot?: string[];
  dateFrom?: string;
  dateTo?: string;
  id_nguoi_phu_trach?: string[];
  id_kho?: string[];
}

export function useDotKiemKeKhoList(params: UseDotKiemKeKhoListParams = {}) {
  return useQuery({
    queryKey: ['dotKiemKeKhoList', params],
    queryFn: () => getDotKiemKeKhoList(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useDotKiemKeKhoById(id: string | null) {
  return useQuery({
    queryKey: ['dotKiemKeKho', id],
    queryFn: () => (id ? getDotKiemKeKhoById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useChiTietByDot(id_dot: string | null) {
  return useQuery({
    queryKey: ['chiTietKiemKeKho', id_dot],
    queryFn: () => (id_dot ? getChiTietByDot(id_dot) : Promise.resolve([])),
    enabled: !!id_dot,
  });
}

export function useCreateDotKiemKeKho(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DotKiemKeKhoCreate) => createDotKiemKeKho(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dotKiemKeKhoList'] });
      toast.success(i18n.t('kiemKeKho.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useUpdateDotKiemKeKho(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DotKiemKeKhoCreate> }) => updateDotKiemKeKho(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['dotKiemKeKhoList'] });
      qc.invalidateQueries({ queryKey: ['dotKiemKeKho', id] });
      toast.success(i18n.t('kiemKeKho.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteDotKiemKeKho(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDotKiemKeKho(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dotKiemKeKhoList'] });
      toast.success(i18n.t('kiemKeKho.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useTaoDanhSachKiemKe(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id_dot_kiem_ke_kho,
      filters,
    }: {
      id_dot_kiem_ke_kho: string;
      filters?: TaoDanhSachKiemKeKhoFilters;
    }) => taoDanhSachKiemKe(id_dot_kiem_ke_kho, filters),
    onSuccess: (_, { id_dot_kiem_ke_kho }) => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKeKho', id_dot_kiem_ke_kho] });
      qc.invalidateQueries({ queryKey: ['dotKiemKeKho', id_dot_kiem_ke_kho] });
      qc.invalidateQueries({ queryKey: ['dotKiemKeKhoList'] });
      toast.success(i18n.t('kiemKeKho.toast.taoDanhSachSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useUpdateChiTietKetQua(id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id_chi_tiet,
      data,
      id_nguoi_kiem,
    }: {
      id_chi_tiet: string;
      data: ChiTietKiemKeKhoUpdate;
      id_nguoi_kiem: string;
    }) => updateChiTietKetQua(id_chi_tiet, data, id_nguoi_kiem),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKeKho', id_dot] });
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDieuChinhTonTheoKetQua(id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_chi_tiet: string) => dieuChinhTonTheoKetQua(id_chi_tiet),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKeKho', id_dot] });
      toast.success(i18n.t('kiemKeKho.toast.dieuChinhTonSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDieuChinhTonTheoDot(id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dieuChinhTonTheoDot(id_dot),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKeKho', id_dot] });
      toast.success(i18n.t('kiemKeKho.toast.dieuChinhTonDotSuccess', { count }));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useHoanThanhDot(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_dot_kiem_ke_kho: string) => hoanThanhDot(id_dot_kiem_ke_kho),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['dotKiemKeKho', id] });
      qc.invalidateQueries({ queryKey: ['dotKiemKeKhoList'] });
      toast.success(i18n.t('kiemKeKho.toast.hoanThanhSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useChangeTrangThaiDot(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: TrangThaiDotKiemKeKho }) =>
      changeTrangThaiDot(id, trang_thai),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['dotKiemKeKho', id] });
      qc.invalidateQueries({ queryKey: ['dotKiemKeKhoList'] });
      toast.success(i18n.t('kiemKeKho.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}
