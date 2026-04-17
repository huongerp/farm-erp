import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getDotKiemKeList,
  getDotKiemKeById,
  getChiTietByDot,
  createDotKiemKe,
  updateDotKiemKe,
  deleteDotKiemKe,
  getNextMaDotDotKiemKeTaiSan,
  taoDanhSachKiemKe,
  updateChiTietKetQua,
  deleteChiTietKiemKe,
  themChiTietPhatHien,
  capNhatSoTheoKetQua,
  hoanThanhDot,
  changeTrangThaiDot,
} from '../services/kiem-ke-tai-san-service';
import type {
  TaoDanhSachKiemKeFilters,
  ThemChiTietPhatHienPayload,
} from '../services/kiem-ke-tai-san-service';
import type { DotKiemKeCreate, ChiTietKiemKeUpdate } from '../core/types';
import type { TrangThaiDotKiemKe } from '../core/types';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';

export interface UseDotKiemKeListParams {
  filter?: 'all' | 'mine';
  id_nguoi?: string;
  q?: string;
  trang_thai_dot?: string[];
  dateFrom?: string;
  dateTo?: string;
  id_nguoi_phu_trach?: string[];
}

export function useDotKiemKeList(params: UseDotKiemKeListParams = {}) {
  const { q: _qIgnored, ...paramsForKey } = params;
  return useQuery({
    queryKey: ['dotKiemKeList', stableListQueryKeyPart(paramsForKey)],
    queryFn: () => getDotKiemKeList(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useDotKiemKeById(id: string | null) {
  return useQuery({
    queryKey: ['dotKiemKe', id],
    queryFn: () => (id ? getDotKiemKeById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useChiTietByDot(id_dot: string | null) {
  return useQuery({
    queryKey: ['chiTietKiemKe', id_dot],
    queryFn: () => (id_dot ? getChiTietByDot(id_dot) : Promise.resolve([])),
    enabled: !!id_dot,
  });
}

export function useCreateDotKiemKe(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DotKiemKeCreate) => createDotKiemKe(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dotKiemKeList'] });
      toast.success(i18n.t('kiemKeTaiSan.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useUpdateDotKiemKe(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DotKiemKeCreate> }) => updateDotKiemKe(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['dotKiemKeList'] });
      qc.invalidateQueries({ queryKey: ['dotKiemKe', id] });
      toast.success(i18n.t('kiemKeTaiSan.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteDotKiemKe(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDotKiemKe(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dotKiemKeList'] });
      toast.success(i18n.t('kiemKeTaiSan.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useTaoDanhSachKiemKe(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id_dot_kiem_ke,
      filters,
    }: {
      id_dot_kiem_ke: string;
      filters?: TaoDanhSachKiemKeFilters;
    }) => taoDanhSachKiemKe(id_dot_kiem_ke, filters),
    onSuccess: (_, { id_dot_kiem_ke }) => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKe', id_dot_kiem_ke] });
      qc.invalidateQueries({ queryKey: ['dotKiemKe', id_dot_kiem_ke] });
      qc.invalidateQueries({ queryKey: ['dotKiemKeList'] });
      toast.success(i18n.t('kiemKeTaiSan.toast.taoDanhSachSuccess'));
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
      data: ChiTietKiemKeUpdate;
      id_nguoi_kiem: string;
    }) => updateChiTietKetQua(id_chi_tiet, data, id_nguoi_kiem),
    onSuccess: (_, { id_chi_tiet }) => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKe', id_dot] });
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteChiTietKiemKe(id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_chi_tiet: string) => deleteChiTietKiemKe(id_chi_tiet),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKe', id_dot] });
      qc.invalidateQueries({ queryKey: ['dotKiemKe', id_dot] });
      toast.success(i18n.t('kiemKeTaiSan.toast.deleteChiTietSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useThemChiTietPhatHien(id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      id_nguoi_kiem,
    }: {
      payload: ThemChiTietPhatHienPayload;
      id_nguoi_kiem: string;
    }) => themChiTietPhatHien(id_dot, payload, id_nguoi_kiem),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKe', id_dot] });
      qc.invalidateQueries({ queryKey: ['dotKiemKe', id_dot] });
      toast.success(i18n.t('kiemKeTaiSan.toast.themTaiSanThucTeSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useCapNhatSoTheoKetQua(id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_chi_tiet: string) => capNhatSoTheoKetQua(id_chi_tiet),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chiTietKiemKe', id_dot] });
      toast.success(i18n.t('kiemKeTaiSan.toast.capNhatSoSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useHoanThanhDot(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_dot_kiem_ke: string) => hoanThanhDot(id_dot_kiem_ke),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['dotKiemKe', id] });
      qc.invalidateQueries({ queryKey: ['dotKiemKeList'] });
      toast.success(i18n.t('kiemKeTaiSan.toast.hoanThanhSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useChangeTrangThaiDot(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: TrangThaiDotKiemKe }) =>
      changeTrangThaiDot(id, trang_thai),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['dotKiemKe', id] });
      qc.invalidateQueries({ queryKey: ['dotKiemKeList'] });
      toast.success(i18n.t('kiemKeTaiSan.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

/** Mã đợt tự đề xuất: KK-TS-001, KK-TS-002, ... */
export function formatMaDotDotKiemKeTaiSan(seq: number): string {
  return `KK-TS-${String(seq).padStart(3, '0')}`;
}

export function useNextMaDotDotKiemKeTaiSan() {
  return useMutation({
    mutationFn: getNextMaDotDotKiemKeTaiSan,
  });
}
