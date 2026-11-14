import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import type { HoFormValues, NhatKyFormValues } from '../core/schema';
import type {
  NhatKyPhaPhenListServerQuery,
  NkppChiTietListServerQuery,
} from '../services/nhat-ky-pha-phen-list-query';
import {
  deleteNkpp,
  deleteNkppMany,
  doiTrangThaiHo,
  getHoDangDungTheoChiNhanh,
  getHoList,
  getNkppById,
  getNkppChiTietPage,
  getNkppPage,
  getNkppTomTat,
  luuHo,
  luuNkpp,
} from '../services/nhat-ky-pha-phen-service';

export const QUERY_KEY_NKPP = ['nhatKyPhaPhen'] as const;

const onErr = (err: Error) => toast.error(err.message);

export function useNhatKyPhaPhenPage(query: NhatKyPhaPhenListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPP, 'page', query],
    queryFn: () => getNkppPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}

/** Tab Chi tiết: một trang các lần pha (phẳng). */
export function useNhatKyPhaPhenChiTietPage(query: NkppChiTietListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPP, 'chiTiet', query],
    queryFn: () => getNkppChiTietPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}

export function useNhatKyPhaPhenTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPP, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getNkppTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNhatKyPhaPhenById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPP, 'byId', id],
    queryFn: () => getNkppById(id!),
    enabled: !!id,
  });
}

/** Hồ đang dùng của một NSC — chỉ tải khi đã chọn NSC (form). */
export function useHoDangDungTheoChiNhanh(idChiNhanh: string) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPP, 'ho', 'dangDung', idChiNhanh],
    queryFn: () => getHoDangDungTheoChiNhanh(idChiNhanh),
    enabled: !!idChiNhanh,
    staleTime: 1000 * 30,
  });
}

/** Mọi hồ trong phạm vi xem (tab Cài đặt hồ). */
export function useHoList(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPP, 'ho', 'all', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getHoList(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY_NKPP });
}

export function useLuuNhatKyPhaPhen(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: NhatKyFormValues }) => luuNkpp(id, data),
    onSuccess: (_r, { id }) => {
      invalidate();
      toast.success(i18n.t(id ? 'nkpp.toast.updateSuccess' : 'nkpp.toast.createSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDeleteNhatKyPhaPhen() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteNkpp,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('nkpp.toast.deleteSuccess'));
    },
    onError: onErr,
  });
}

export function useDeleteNhatKyPhaPhenMany() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteNkppMany,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('nkpp.toast.deleteManySuccess'));
    },
    onError: onErr,
  });
}

export function useLuuHo(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: HoFormValues }) => luuHo(id, data),
    onSuccess: (_r, { id }) => {
      invalidate();
      toast.success(i18n.t(id ? 'nkpp.toast.hoUpdateSuccess' : 'nkpp.toast.hoCreateSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDoiTrangThaiHo() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, dangDung }: { id: string; dangDung: boolean }) => doiTrangThaiHo(id, dangDung),
    onSuccess: (_r, { dangDung }) => {
      invalidate();
      toast.success(i18n.t(dangDung ? 'nkpp.toast.hoBatSuccess' : 'nkpp.toast.hoNgungSuccess'));
    },
    onError: onErr,
  });
}
