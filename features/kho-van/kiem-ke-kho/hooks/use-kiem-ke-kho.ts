import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getDotKiemKeKhoById,
  getChiTietByDot,
  createDotKiemKeKho,
  updateDotKiemKeKho,
  deleteDotKiemKeKho,
  taoDanhSachKiemKe,
  createChiTietKiemKe,
  deleteChiTietKiemKe,
  updateChiTietKetQua,
  dieuChinhTonTheoKetQua,
  dieuChinhTonTheoDot,
  hoanThanhDot,
  changeTrangThaiDot,
  getNextMaDotDotKiemKeKho,
  getDotKiemKeKhoPageSupabase,
  getDotKiemKeKhoTomTatSupabase,
} from '../services/kiem-ke-kho-service';
import type { TaoDanhSachKiemKeKhoFilters } from '../services/kiem-ke-kho-service';
import type { DotKiemKeKhoCreate, ChiTietKiemKeKhoUpdate, TrangThaiDotKiemKeKho } from '../core/types';
import { useAuthStore } from '../../../../store/useStore';
import { TON_KHO_QUERY_KEY } from '../../ton-kho/hooks/use-ton-kho';
import { useKiemKeCapCao } from './use-kiem-ke-cap-cao';

/**
 * Mọi query của module nằm dưới MỘT prefix, và mọi mutation invalidate đúng prefix
 * đó. Trước đây bảng dùng key `['kiemKeKho','dot','page',…]` còn mutation lại
 * invalidate `['dotKiemKeKhoList']` → sửa/xoá xong danh sách không tự làm mới.
 */
export const QUERY_KEY_KIEM_KE_KHO = ['kiemKeKho'] as const;

/** Một trang danh sách đợt — lọc / phân trang chạy ở PostgREST. */
export function useDotKiemKeKhoPage(
  page: number,
  pageSize: number,
  params: Parameters<typeof getDotKiemKeKhoPageSupabase>[2],
  phamVi: Parameters<typeof getDotKiemKeKhoPageSupabase>[3]
) {
  return useQuery({
    queryKey: [...QUERY_KEY_KIEM_KE_KHO, 'page', page, pageSize, params, phamVi],
    queryFn: () => getDotKiemKeKhoPageSupabase(page, pageSize, params, phamVi),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

/** Tóm tắt toàn bộ đợt trong phạm vi xem — nguồn đếm chip lọc và tab Thống kê. */
export function useDotKiemKeKhoTomTat(
  phamVi: Parameters<typeof getDotKiemKeKhoTomTatSupabase>[0]
) {
  return useQuery({
    queryKey: [...QUERY_KEY_KIEM_KE_KHO, 'tomTat', phamVi],
    queryFn: () => getDotKiemKeKhoTomTatSupabase(phamVi),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDotKiemKeKhoById(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY_KIEM_KE_KHO, 'dot', id],
    queryFn: () => (id ? getDotKiemKeKhoById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useChiTietByDot(id_dot: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY_KIEM_KE_KHO, 'chiTiet', id_dot],
    queryFn: () => (id_dot ? getChiTietByDot(id_dot) : Promise.resolve([])),
    enabled: !!id_dot,
  });
}

export function useCreateDotKiemKeKho(onSuccess?: () => void) {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: (data: DotKiemKeKhoCreate) => {
      if (!userId) {
        throw new Error(i18n.t('kiemKeKho.validation.nguoiTaoSessionRequired'));
      }
      return createDotKiemKeKho(data, userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      toast.success(i18n.t('kiemKeKho.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useUpdateDotKiemKeKho(onSuccess?: () => void) {
  const qc = useQueryClient();
  const capCao = useKiemKeCapCao();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DotKiemKeKhoCreate> }) => updateDotKiemKeKho(id, data, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      toast.success(i18n.t('kiemKeKho.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteDotKiemKeKho(onSuccess?: () => void) {
  const qc = useQueryClient();
  const capCao = useKiemKeCapCao();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDotKiemKeKho(ids, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      toast.success(i18n.t('kiemKeKho.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useTaoDanhSachKiemKe(onSuccess?: () => void) {
  const qc = useQueryClient();
  const capCao = useKiemKeCapCao();
  return useMutation({
    mutationFn: ({
      id_dot_kiem_ke_kho,
      filters,
    }: {
      id_dot_kiem_ke_kho: string;
      filters?: TaoDanhSachKiemKeKhoFilters;
    }) => taoDanhSachKiemKe(id_dot_kiem_ke_kho, filters, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      toast.success(i18n.t('kiemKeKho.toast.taoDanhSachSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useCreateChiTietKiemKe(id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  const capCao = useKiemKeCapCao();
  return useMutation({
    mutationFn: ({
      id_kho,
      id_hang_hoa,
    }: {
      id_kho: string;
      id_hang_hoa: string;
    }) => createChiTietKiemKe(id_dot, id_kho, id_hang_hoa, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      toast.success(i18n.t('kiemKeKho.toast.addChiTietSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteChiTietKiemKe(_id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  const capCao = useKiemKeCapCao();
  return useMutation({
    mutationFn: (id_chi_tiet: string) => deleteChiTietKiemKe(id_chi_tiet, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      toast.success(i18n.t('kiemKeKho.toast.deleteChiTietSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useUpdateChiTietKetQua(_id_dot: string, onSuccess?: () => void) {
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
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDieuChinhTonTheoKetQua(_id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_chi_tiet: string) => {
      const uid = useAuthStore.getState().user?.id;
      const nv = uid != null ? Number(uid) : NaN;
      return dieuChinhTonTheoKetQua(id_chi_tiet, Number.isFinite(nv) ? nv : null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      qc.invalidateQueries({ queryKey: ['phieuKho'] });
      qc.invalidateQueries({ queryKey: TON_KHO_QUERY_KEY });
      toast.success(i18n.t('kiemKeKho.toast.dieuChinhTonSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDieuChinhTonTheoDot(id_dot: string, onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      const uid = useAuthStore.getState().user?.id;
      const nv = uid != null ? Number(uid) : NaN;
      return dieuChinhTonTheoDot(id_dot, Number.isFinite(nv) ? nv : null);
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      qc.invalidateQueries({ queryKey: ['phieuKho'] });
      qc.invalidateQueries({ queryKey: TON_KHO_QUERY_KEY });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      toast.success(i18n.t('kiemKeKho.toast.hoanThanhSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useChangeTrangThaiDot(onSuccess?: () => void) {
  const qc = useQueryClient();
  const capCao = useKiemKeCapCao();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: TrangThaiDotKiemKeKho }) =>
      changeTrangThaiDot(id, trang_thai, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_KHO });
      toast.success(i18n.t('kiemKeKho.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

/** Mã đợt tự sinh: KK-YYYY-NNNN */
function formatMaDotDotKiemKeKho(seq: number): string {
  const y = new Date().getFullYear();
  return `KK-${y}-${String(seq).padStart(4, '0')}`;
}

export function useNextMaDotDotKiemKeKho() {
  return useMutation({
    mutationFn: getNextMaDotDotKiemKeKho,
  });
}

export { formatMaDotDotKiemKeKho };
