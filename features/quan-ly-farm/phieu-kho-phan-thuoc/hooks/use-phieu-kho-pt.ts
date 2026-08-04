import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPhieuKhoPTById,
  getPhieuKhoPTPage,
  getChiTietPhieuKhoPTPage,
  createPhieuKhoPT,
  updatePhieuKhoPT,
  deletePhieuKhoPT,
  deletePhieuKhoPTMany,
  getNextSoPhieuFarmPt,
  updatePhieuKhoPTTrangThai,
} from '../services/phieu-kho-pt-service';
import type { ChiTietPhieuKhoPTListServerQuery, PhieuKhoPTListServerQuery } from '../services/phieu-kho-pt-list-query';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import type { PhieuKhoPTFormValues } from '../core/schema';
import type { LoaiPhieuKhoPT } from '../core/types';
import i18n from '../../../../lib/i18n';
import { FARM_TON_KHO_PT_QUERY_KEY } from '../../ton-kho-phan-thuoc/hooks/use-farm-ton-kho-pt';

const QUERY_KEY = ['phieuKhoPhanThuoc'] as const;
const QUERY_KEY_CHI_TIET = ['phieuKhoPhanThuoc', 'chiTiet'] as const;

const PHIEU_KHO_PT_PAGE_SIZE = 50;
const CHI_TIET_PAGE_SIZE = 100;

export const usePhieuKhoPTListPaged = (pageIndex: number, listQuery: PhieuKhoPTListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'paged', pageIndex, PHIEU_KHO_PT_PAGE_SIZE, qPart] as const,
    queryFn: () => getPhieuKhoPTPage(pageIndex, PHIEU_KHO_PT_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
};

export const useChiTietPhieuKhoPTPaged = (pageIndex: number, listQuery: ChiTietPhieuKhoPTListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY_CHI_TIET, 'paged', pageIndex, CHI_TIET_PAGE_SIZE, qPart] as const,
    queryFn: () => getChiTietPhieuKhoPTPage(pageIndex, CHI_TIET_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
};

export const usePhieuKhoPTById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getPhieuKhoPTById(id!),
    enabled: !!id,
  });
};

export const useNextSoPhieuFarmPtQuery = (loai: LoaiPhieuKhoPT | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['phieuKhoPhanThuoc', 'nextSoPhieu', loai],
    queryFn: () => getNextSoPhieuFarmPt(loai!),
    enabled: enabled && !!loai,
    staleTime: 0,
  });
};

export const useCreatePhieuKhoPT = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PhieuKhoPTFormValues) => createPhieuKhoPT(data),
    onSuccess: (newPhieu) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.createSuccess'));
      onSuccess?.();
      void newPhieu;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePhieuKhoPT = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuKhoPTFormValues }) => updatePhieuKhoPT(id, data),
    onSuccess: (updated) => {
      qc.setQueryData([...QUERY_KEY, updated.id], updated);
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuKhoPT = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuKhoPT,
    onSuccess: (_void, id) => {
      qc.removeQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePhieuKhoPTTrangThai = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      trang_thai,
      ghi_chu,
      id_nguoi_duyet,
      ten_nguoi_duyet_hien_thi,
    }: {
      id: string;
      trang_thai: import('../core/types').TrangThaiPhieuKhoPT;
      ghi_chu?: string;
      id_nguoi_duyet?: number | null;
      ten_nguoi_duyet_hien_thi?: string;
    }) =>
      updatePhieuKhoPTTrangThai(id, trang_thai, {
        ghi_chu,
        id_nguoi_duyet,
        ten_nguoi_duyet_hien_thi,
      }),
    onSuccess: async (_void, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      try {
        const fresh = await getPhieuKhoPTById(id);
        if (fresh) {
          qc.setQueryData([...QUERY_KEY, id], fresh);
        }
      } catch {
        qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      }
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuKhoPTMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuKhoPTMany,
    onSuccess: (_void, ids) => {
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export { QUERY_KEY as PHIEU_KHO_PT_QUERY_KEY, QUERY_KEY_CHI_TIET as PHIEU_KHO_PT_CHI_TIET_QUERY_KEY };
