import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllPhieuKho,
  getPhieuKhoById,
  getPhieuKhoPage,
  getChiTietPhieuKhoPage,
  createPhieuKho,
  updatePhieuKho,
  deletePhieuKho,
  deletePhieuKhoMany,
  getChiTietPhieuKhoAll,
  getNextSoPhieu,
  updatePhieuKhoTrangThai,
} from '../services/phieu-kho-service';
import type { ChiTietPhieuKhoListServerQuery, PhieuKhoListServerQuery } from '../services/phieu-kho-list-query';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { getTonKhoTheoKho } from '../services/ton-kho-service';
import type { PhieuKhoFormValues } from '../core/schema';
import type { LoaiPhieuKhoTab } from '../core/types';
import { LOAI_TAB_TO_DB } from '../core/types';
import type { LoaiPhieuKho, PhieuKho } from '../core/types';
import i18n from '../../../../lib/i18n';
import { TON_KHO_QUERY_KEY } from '../../ton-kho/hooks/use-ton-kho';

const QUERY_KEY = ['phieuKho'] as const;

const invalidateTonKho = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: TON_KHO_QUERY_KEY });
};

export const usePhieuKhoList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllPhieuKho,
    staleTime: 1000 * 60 * 10,
  });
};

const PHIEU_KHO_PAGE_SIZE = 50;

/** Danh sách phiếu kho theo trang (server-side). `pageIndex` 0-based. */
export const usePhieuKhoListPaged = (pageIndex: number, listQuery: PhieuKhoListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'paged', pageIndex, PHIEU_KHO_PAGE_SIZE, qPart] as const,
    queryFn: () => getPhieuKhoPage(pageIndex, PHIEU_KHO_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
};

const QUERY_KEY_CHI_TIET = ['phieuKho', 'chiTiet'] as const;

const CHI_TIET_PHIEU_KHO_PAGE_SIZE = 100;

/** Danh sách phẳng toàn bộ dòng chi tiết phiếu (nhập/xuất/chuyển) cho tab Chi tiết phiếu. */
export const useChiTietPhieuKhoAll = () => {
  return useQuery({
    queryKey: QUERY_KEY_CHI_TIET,
    queryFn: getChiTietPhieuKhoAll,
    staleTime: 1000 * 60 * 2,
  });
};

/** Chi tiết phiếu kho theo trang (server-side). `pageIndex` 0-based. */
export const useChiTietPhieuKhoPaged = (pageIndex: number, listQuery: ChiTietPhieuKhoListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY_CHI_TIET, 'paged', pageIndex, CHI_TIET_PHIEU_KHO_PAGE_SIZE, qPart] as const,
    queryFn: () => getChiTietPhieuKhoPage(pageIndex, CHI_TIET_PHIEU_KHO_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
};

export const usePhieuKhoById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getPhieuKhoById(id!),
    enabled: !!id,
  });
};

/** Số phiếu tiếp theo khi tạo mới (Option B: RPC). Chỉ gọi khi đang tạo phiếu (enabled = true). */
export const useNextSoPhieu = (loai: LoaiPhieuKhoTab, enabled: boolean) => {
  const loaiDb = LOAI_TAB_TO_DB[loai];
  return useQuery({
    queryKey: ['phieuKho', 'nextSoPhieu', loaiDb],
    queryFn: () => getNextSoPhieu(loaiDb as LoaiPhieuKho),
    enabled,
    staleTime: 0,
  });
};

/** Tồn kho theo một kho (để hiển thị trong form phiếu). */
export const useTonKhoTheoKho = (kho_id: string | undefined) => {
  return useQuery({
    queryKey: ['tonKho', kho_id],
    queryFn: () => getTonKhoTheoKho(kho_id!),
    enabled: !!kho_id,
    staleTime: 1000 * 60,
  });
};

export const useCreatePhieuKho = (loaiTab: LoaiPhieuKhoTab, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PhieuKhoFormValues) => createPhieuKho(LOAI_TAB_TO_DB[loaiTab], data),
    onSuccess: (newPhieu) => {
      qc.setQueryData(QUERY_KEY, (old: PhieuKho[] | undefined) => (old ? [newPhieu, ...old] : [newPhieu]));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      invalidateTonKho(qc);
      toast.success(i18n.t('phieuKho.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePhieuKho = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuKhoFormValues }) => updatePhieuKho(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, (old: PhieuKho[] | undefined) =>
        old?.map((p) => (p.id === updated.id ? updated : p)) ?? [updated]
      );
      qc.setQueryData([...QUERY_KEY, updated.id], updated);
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      invalidateTonKho(qc);
      toast.success(i18n.t('phieuKho.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuKho = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuKho,
    onSuccess: (_void, id) => {
      qc.setQueryData(QUERY_KEY, (old: PhieuKho[] | undefined) => old?.filter((p) => p.id !== id) ?? []);
      qc.removeQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      invalidateTonKho(qc);
      toast.success(i18n.t('phieuKho.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePhieuKhoTrangThai = (onSuccess?: () => void) => {
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
      trang_thai: import('../core/types').TrangThaiPhieuKho;
      ghi_chu?: string;
      id_nguoi_duyet?: number | null;
      ten_nguoi_duyet_hien_thi?: string;
    }) =>
      updatePhieuKhoTrangThai(id, trang_thai, {
        ghi_chu,
        id_nguoi_duyet,
        ten_nguoi_duyet_hien_thi,
      }),
    onSuccess: async (_void, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      invalidateTonKho(qc);
      try {
        const fresh = await getPhieuKhoById(id);
        if (fresh) {
          qc.setQueryData(QUERY_KEY, (old: PhieuKho[] | undefined) =>
            old?.map((p) => (p.id === id ? fresh : p)) ?? [fresh]
          );
          qc.setQueryData([...QUERY_KEY, id], fresh);
        }
      } catch {
        qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      }
      toast.success(i18n.t('phieuKho.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuKhoMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuKhoMany,
    onSuccess: (_void, ids) => {
      const set = new Set(ids);
      qc.setQueryData(QUERY_KEY, (old: PhieuKho[] | undefined) => old?.filter((p) => !set.has(p.id)) ?? []);
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      invalidateTonKho(qc);
      toast.success(i18n.t('phieuKho.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
