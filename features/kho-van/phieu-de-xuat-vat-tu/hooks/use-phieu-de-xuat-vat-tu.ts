import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllPhieuDeXuatVatTu,
  getPhieuDeXuatVatTuPage,
  getPhieuDeXuatVatTuById,
  getAllPhieuDeXuatVatTuChiTiet,
  getPhieuDeXuatVatTuChiTietPage,
  createPhieuDeXuatVatTu,
  updatePhieuDeXuatVatTu,
  deletePhieuDeXuatVatTu,
  deletePhieuDeXuatVatTuMany,
} from '../services/phieu-de-xuat-vat-tu-service';
import type { PhieuDeXuatChiTietListServerQuery, PhieuDeXuatVatTuListServerQuery } from '../services/phieu-de-xuat-list-query';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import type { PhieuDeXuatVatTu } from '../core/types';
import i18n from '../../../../lib/i18n';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { PHIEU_DE_XUAT_SO_PHIEU_QUERY_KEY } from '../../../../lib/hooks/use-supabase-ref-queries';

const QUERY_KEY = ['phieuDeXuatVatTu'] as const;
const QUERY_KEY_CHI_TIET = [...QUERY_KEY, 'chiTiet'] as const;

const PHIEU_DE_XUAT_PAGE_SIZE = 50;
const PHIEU_DE_XUAT_CHI_TIET_PAGE_SIZE = 100;

/** @deprecated Tab Thống kê: dùng fetchPhieuDeXuatStatsFromRpc. List tab: usePhieuDeXuatVatTuListPaged. */
export const usePhieuDeXuatVatTuList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllPhieuDeXuatVatTu,
    enabled: false,
    staleTime: 1000 * 60 * 15,
  });
};

export const usePhieuDeXuatVatTuListPaged = (pageIndex: number, listQuery: PhieuDeXuatVatTuListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'paged', pageIndex, PHIEU_DE_XUAT_PAGE_SIZE, qPart] as const,
    queryFn: () => getPhieuDeXuatVatTuPage(pageIndex, PHIEU_DE_XUAT_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });
};

/** @deprecated Dùng usePhieuDeXuatVatTuChiTietPaged. */
export const usePhieuDeXuatVatTuChiTietAll = () => {
  return useQuery({
    queryKey: QUERY_KEY_CHI_TIET,
    queryFn: getAllPhieuDeXuatVatTuChiTiet,
    enabled: false,
    staleTime: 1000 * 60 * 15,
  });
};

export const usePhieuDeXuatVatTuChiTietPaged = (pageIndex: number, listQuery: PhieuDeXuatChiTietListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY_CHI_TIET, 'paged', pageIndex, PHIEU_DE_XUAT_CHI_TIET_PAGE_SIZE, qPart] as const,
    queryFn: () => getPhieuDeXuatVatTuChiTietPage(pageIndex, PHIEU_DE_XUAT_CHI_TIET_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });
};

export const usePhieuDeXuatVatTuById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getPhieuDeXuatVatTuById(id!),
    enabled: !!id,
  });
};

export const useCreatePhieuDeXuatVatTu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PhieuDeXuatVatTuFormValues) => createPhieuDeXuatVatTu(data),
    onSuccess: (created) => {
      qc.setQueryData(QUERY_KEY, (old: PhieuDeXuatVatTu[] | undefined) => (old ? [created, ...old] : [created]));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: PHIEU_DE_XUAT_SO_PHIEU_QUERY_KEY });
      toast.success(i18n.t('phieuDeXuatVatTu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePhieuDeXuatVatTu = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuDeXuatVatTuFormValues }) =>
      updatePhieuDeXuatVatTu(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, (old: PhieuDeXuatVatTu[] | undefined) =>
        old?.map((p) => (p.id === updated.id ? updated : p)) ?? [updated]
      );
      qc.setQueryData([...QUERY_KEY, updated.id], updated);
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      toast.success(i18n.t('phieuDeXuatVatTu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuDeXuatVatTu = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuDeXuatVatTu,
    onSuccess: (_void, id) => {
      qc.setQueryData(QUERY_KEY, (old: PhieuDeXuatVatTu[] | undefined) => old?.filter((p) => p.id !== id) ?? []);
      qc.removeQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: PHIEU_DE_XUAT_SO_PHIEU_QUERY_KEY });
      toast.success(i18n.t('phieuDeXuatVatTu.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuDeXuatVatTuMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuDeXuatVatTuMany,
    onSuccess: (_void, ids) => {
      const set = new Set(ids);
      qc.setQueryData(QUERY_KEY, (old: PhieuDeXuatVatTu[] | undefined) => old?.filter((p) => !set.has(p.id)) ?? []);
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: PHIEU_DE_XUAT_SO_PHIEU_QUERY_KEY });
      toast.success(i18n.t('phieuDeXuatVatTu.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
