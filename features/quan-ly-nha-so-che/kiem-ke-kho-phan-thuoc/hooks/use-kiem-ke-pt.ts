import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import { FARM_TON_KHO_PT_QUERY_KEY } from '../../ton-kho-phan-thuoc/hooks/use-farm-ton-kho-pt';
import { useKiemKeCapCaoPT } from './use-kiem-ke-cap-cao';
import {
  getDotKiemKePTPage,
  getDotKiemKePTTomTat,
  getDotKiemKePTById,
  getChiTietByDotPT,
  createDotKiemKePT,
  updateDotKiemKePT,
  deleteDotKiemKePT,
  changeTrangThaiDotPT,
  hoanThanhDotPT,
  getNextMaDotKiemKePT,
  taoDanhSachKiemKePT,
  createChiTietKiemKePT,
  deleteChiTietKiemKePT,
  updateChiTietKetQuaPT,
  dieuChinhTonTheoKetQuaPT,
  dieuChinhTonTheoDotPT,
} from '../services/kiem-ke-pt-service';
import type { DotKiemKePTListServerQuery } from '../services/kiem-ke-pt-service';
import type {
  DotKiemKePTCreate,
  ChiTietKiemKePTUpdate,
  TrangThaiDotKiemKePT,
  TaoDanhSachKiemKePTFilters,
} from '../core/types';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';

/**
 * MỌI query của module nằm dưới một prefix, và MỌI mutation invalidate đúng prefix
 * đó. Không để key "mồ côi": module kiểm kê kho (mua hàng) từng có bảng dùng key
 * riêng còn mutation invalidate key khác nên danh sách không tự làm mới.
 */
export const QUERY_KEY_KIEM_KE_PT = ['kiemKeKhoPT'] as const;

/** Phạm vi xem gửi xuống server cho bản tóm tắt. */
export interface PhamViKiemKePT {
  viewAll: boolean;
  allowedKhoIds: string[];
  currentEmployeeId: string | null;
}

/** Một trang danh sách đợt — lọc / phân trang chạy ở PostgREST. */
export function useDotKiemKePTPage(query: DotKiemKePTListServerQuery) {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY_KIEM_KE_PT, 'page', query, bt.key],
    queryFn: () => getDotKiemKePTPage(bt, query),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

/** Tóm tắt toàn bộ đợt trong phạm vi xem — nguồn đếm chip lọc và tab Thống kê. */
export function useDotKiemKePTTomTat(phamVi: PhamViKiemKePT) {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY_KIEM_KE_PT, 'tomTat', phamVi, bt.key],
    queryFn: () => getDotKiemKePTTomTat(bt, phamVi),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDotKiemKePTById(id: string | null) {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY_KIEM_KE_PT, 'dot', id, bt.key],
    queryFn: () => (id ? getDotKiemKePTById(bt, id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useChiTietKiemKePT(id_dot: string | null) {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY_KIEM_KE_PT, 'chiTiet', id_dot, bt.key],
    queryFn: () => (id_dot ? getChiTietByDotPT(bt, id_dot) : Promise.resolve([])),
    enabled: !!id_dot,
  });
}

/** Id nhân viên đang đăng nhập, dạng số — dùng cho RPC điều chỉnh tồn. */
function currentEmployeeIdNum(): number | null {
  const uid = useAuthStore.getState().user?.id;
  const n = uid != null ? Number(uid) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function useCreateDotKiemKePT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: (data: DotKiemKePTCreate) => {
      if (!userId) throw new Error(i18n.t('kiemKeKhoPT.validation.nguoiTaoSessionRequired'));
      return createDotKiemKePT(bt, data, userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      toast.success(i18n.t('kiemKeKhoPT.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useUpdateDotKiemKePT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  const capCao = useKiemKeCapCaoPT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DotKiemKePTCreate> }) => updateDotKiemKePT(bt, id, data, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      toast.success(i18n.t('kiemKeKhoPT.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteDotKiemKePT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  const capCao = useKiemKeCapCaoPT();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDotKiemKePT(bt, ids, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      toast.success(i18n.t('kiemKeKhoPT.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useChangeTrangThaiDotPT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  const capCao = useKiemKeCapCaoPT();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: TrangThaiDotKiemKePT }) =>
      changeTrangThaiDotPT(bt, id, trang_thai, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      toast.success(i18n.t('kiemKeKhoPT.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useHoanThanhDotPT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hoanThanhDotPT(bt, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      toast.success(i18n.t('kiemKeKhoPT.toast.hoanThanhSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useTaoDanhSachKiemKePT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  const capCao = useKiemKeCapCaoPT();
  return useMutation({
    mutationFn: ({ id_dot, filters }: { id_dot: string; filters?: TaoDanhSachKiemKePTFilters }) =>
      taoDanhSachKiemKePT(bt, id_dot, filters, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      toast.success(i18n.t('kiemKeKhoPT.toast.taoDanhSachSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useCreateChiTietKiemKePT(id_dot: string, onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  const capCao = useKiemKeCapCaoPT();
  return useMutation({
    mutationFn: ({ id_kho_list, id_hang_hoa }: { id_kho_list: string[]; id_hang_hoa: string }) =>
      createChiTietKiemKePT(bt, id_dot, id_kho_list, id_hang_hoa, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      toast.success(i18n.t('kiemKeKhoPT.toast.addChiTietSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteChiTietKiemKePT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  const capCao = useKiemKeCapCaoPT();
  return useMutation({
    mutationFn: (id_chi_tiet: string) => deleteChiTietKiemKePT(bt, id_chi_tiet, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      toast.success(i18n.t('kiemKeKhoPT.toast.deleteChiTietSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useUpdateChiTietKetQuaPT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  const capCao = useKiemKeCapCaoPT();
  return useMutation({
    mutationFn: ({
      id_chi_tiet,
      data,
      id_nguoi_kiem,
    }: {
      id_chi_tiet: string;
      data: ChiTietKiemKePTUpdate;
      id_nguoi_kiem: string;
    }) => updateChiTietKetQuaPT(bt, id_chi_tiet, data, id_nguoi_kiem, capCao),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

/** Điều chỉnh tồn sinh phiếu kho phân thuốc → phải làm mới cả phiếu kho lẫn tồn kho. */
function invalidateSauDieuChinh(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: QUERY_KEY_KIEM_KE_PT });
  qc.invalidateQueries({ queryKey: ['phieuKhoPhanThuoc'] });
  qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
}

export function useDieuChinhTonTheoKetQuaPT(onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id_chi_tiet: string) => dieuChinhTonTheoKetQuaPT(bt, id_chi_tiet, currentEmployeeIdNum()),
    onSuccess: () => {
      invalidateSauDieuChinh(qc);
      toast.success(i18n.t('kiemKeKhoPT.toast.dieuChinhTonSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDieuChinhTonTheoDotPT(id_dot: string, onSuccess?: () => void) {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => dieuChinhTonTheoDotPT(bt, id_dot, currentEmployeeIdNum()),
    onSuccess: (count) => {
      invalidateSauDieuChinh(qc);
      toast.success(i18n.t('kiemKeKhoPT.toast.dieuChinhTonDotSuccess', { count }));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useNextMaDotKiemKePT() {
  const bt = useKhoBienThe();
  return useMutation({ mutationFn: () => getNextMaDotKiemKePT(bt) });
}
