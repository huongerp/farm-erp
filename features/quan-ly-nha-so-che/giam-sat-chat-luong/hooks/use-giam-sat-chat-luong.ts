import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import type { GiamSatChatLuongFormValues, TieuChiFormValues } from '../core/schema';
import type { TieuChiDanhMuc } from '../core/types';
import type { GiamSatChatLuongListServerQuery } from '../services/giam-sat-chat-luong-list-query';
import {
  apDungTieuChiMoi,
  createGscl,
  createTieuChi,
  datDangDungTieuChi,
  deleteGscl,
  deleteGsclMany,
  deleteTieuChi,
  getGsclById,
  getGsclPage,
  getGsclTomTat,
  getThung,
  getTieuChi,
  huyGscl,
  khoiPhucGscl,
  luuKetQuaThung,
  moPhieuGscl,
  nopGscl,
  sapXepTieuChi,
  updateGscl,
  updateTieuChi,
  type LuuKetQuaThungInput,
} from '../services/giam-sat-chat-luong-service';

export const QUERY_KEY_GSCL = ['giamSatChatLuong'] as const;
const QUERY_KEY_TIEU_CHI = ['giamSatChatLuong', 'tieuChi'] as const;

const onErr = (err: Error) => toast.error(err.message);

export function useGiamSatChatLuongPage(query: GiamSatChatLuongListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_GSCL, 'page', query],
    queryFn: () => getGsclPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
}

export function useGiamSatChatLuongTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_GSCL, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getGsclTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGiamSatChatLuongById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_GSCL, 'byId', id],
    queryFn: () => getGsclById(id!),
    enabled: !!id,
  });
}

export function useThungMau(idPhieu: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_GSCL, 'thung', idPhieu],
    queryFn: () => getThung(idPhieu!),
    enabled: !!idPhieu,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY_GSCL });
}

const idNguoiHienTai = (id: string | number | null | undefined) => (id != null ? String(id) : null);

export function useCreateGiamSatChatLuong(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: GiamSatChatLuongFormValues) => createGscl(data, idNguoiHienTai(user?.id)),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('giamSatChatLuong.toast.createSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useUpdateGiamSatChatLuong(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GiamSatChatLuongFormValues }) => updateGscl(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('giamSatChatLuong.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDeleteGiamSatChatLuong() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteGscl,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('giamSatChatLuong.toast.deleteSuccess'));
    },
    onError: onErr,
  });
}

export function useDeleteGiamSatChatLuongMany() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteGsclMany,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('giamSatChatLuong.toast.deleteManySuccess'));
    },
    onError: onErr,
  });
}

export type HanhDongPhieu = 'huy' | 'khoiPhuc' | 'apDungTieuChi' | 'nop' | 'moPhieu';

export function useHanhDongGiamSatChatLuong() {
  const invalidate = useInvalidate();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({ action, id }: { action: HanhDongPhieu; id: string }) => {
      if (action === 'huy') return huyGscl(id);
      if (action === 'khoiPhuc') return khoiPhucGscl(id);
      if (action === 'nop') return nopGscl(id, idNguoiHienTai(user?.id));
      if (action === 'moPhieu') return moPhieuGscl(id);
      return apDungTieuChiMoi(id);
    },
    onSuccess: (_r, { action }) => {
      invalidate();
      toast.success(i18n.t(`giamSatChatLuong.toast.${action}Success`));
    },
    onError: onErr,
  });
}

/** Lưu kết quả một thùng — không toast mặc định (dialog tự báo + cho quét tiếp). */
export function useLuuKetQuaThung() {
  const invalidate = useInvalidate();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (input: Omit<LuuKetQuaThungInput, 'idNguoi'>) => luuKetQuaThung({ ...input, idNguoi: idNguoiHienTai(user?.id) }),
    onSuccess: () => invalidate(),
    onError: onErr,
  });
}

// ── Danh mục tiêu chí ──────────────────────────────────────────────────────────

export function useTieuChiDanhMuc() {
  return useQuery({
    queryKey: QUERY_KEY_TIEU_CHI,
    queryFn: getTieuChi,
    staleTime: 1000 * 60 * 5,
  });
}

function useInvalidateTieuChi() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY_TIEU_CHI });
}

export function useLuuTieuChi(onSuccess?: () => void) {
  const invalidate = useInvalidateTieuChi();
  return useMutation({
    mutationFn: ({ id, data, danhMuc }: { id: string | null; data: TieuChiFormValues; danhMuc: TieuChiDanhMuc[] }) =>
      id ? updateTieuChi(id, data) : createTieuChi(data, danhMuc),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('giamSatChatLuong.toast.tieuChiSaved'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useThaoTacTieuChi() {
  const invalidate = useInvalidateTieuChi();
  return useMutation({
    mutationFn: async (
      args: { action: 'dangDung'; id: string; value: boolean } | { action: 'xoa'; id: string } | { action: 'sapXep'; ids: string[] }
    ) => {
      if (args.action === 'dangDung') return datDangDungTieuChi(args.id, args.value);
      if (args.action === 'xoa') return deleteTieuChi(args.id);
      return sapXepTieuChi(args.ids);
    },
    onSuccess: () => invalidate(),
    onError: (err: Error) => {
      invalidate();
      onErr(err);
    },
  });
}
