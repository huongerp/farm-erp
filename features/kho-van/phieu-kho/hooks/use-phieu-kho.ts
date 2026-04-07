import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllPhieuKho,
  getPhieuKhoById,
  createPhieuKho,
  updatePhieuKho,
  deletePhieuKho,
  deletePhieuKhoMany,
  getChiTietPhieuKhoAll,
  getNextSoPhieu,
  updatePhieuKhoTrangThai,
} from '../services/phieu-kho-service';
import { getTonKhoTheoKho } from '../services/ton-kho-service';
import type { PhieuKhoFormValues } from '../core/schema';
import type { LoaiPhieuKhoTab } from '../core/types';
import { LOAI_TAB_TO_DB } from '../core/types';
import type { LoaiPhieuKho } from '../core/types';
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
    staleTime: 1000 * 60 * 2,
  });
};

const QUERY_KEY_CHI_TIET = ['phieuKho', 'chiTiet'] as const;

/** Danh sách phẳng toàn bộ dòng chi tiết phiếu (nhập/xuất/chuyển) cho tab Chi tiết phiếu. */
export const useChiTietPhieuKhoAll = () => {
  return useQuery({
    queryKey: QUERY_KEY_CHI_TIET,
    queryFn: getChiTietPhieuKhoAll,
    staleTime: 1000 * 60 * 2,
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      invalidateTonKho(qc);
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      invalidateTonKho(qc);
      toast.success(i18n.t('phieuKho.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
