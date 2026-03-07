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
} from '../services/phieu-kho-service';
import { getTonKhoTheoKho } from '../services/ton-kho-service';
import type { PhieuKhoFormValues } from '../core/schema';
import type { LoaiPhieuKho } from '../core/types';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['phieuKho'] as const;

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

/** Tồn kho theo một kho (để hiển thị trong form phiếu). */
export const useTonKhoTheoKho = (id_kho: string | undefined) => {
  return useQuery({
    queryKey: ['tonKho', id_kho],
    queryFn: () => getTonKhoTheoKho(id_kho!),
    enabled: !!id_kho,
    staleTime: 1000 * 60,
  });
};

export const useCreatePhieuKho = (loai: LoaiPhieuKho, onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PhieuKhoFormValues) => createPhieuKho(loai, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
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
      toast.success(i18n.t('phieuKho.toast.deleteSuccess'));
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
      toast.success(i18n.t('phieuKho.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
