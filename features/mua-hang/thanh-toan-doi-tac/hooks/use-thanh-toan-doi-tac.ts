import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ThanhToanDoiTacListServerQuery } from '../services/thanh-toan-doi-tac-list-query';
import { toast } from 'sonner';
import {
  getAllThanhToanDoiTac,
  getThanhToanDoiTacPage,
  getThanhToanDoiTacTomTat,
  getThanhToanDoiTacById,
  createThanhToanDoiTac,
  updateThanhToanDoiTac,
  deleteThanhToanDoiTac,
  deleteThanhToanDoiTacMany,
  chuyenTrangThaiThanhToanMany,
} from '../services/thanh-toan-doi-tac-service';
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['thanhToanDoiTac'] as const;

/** Tóm tắt toàn bộ phiếu cho chip lọc + số đếm. */
export function useThanhToanDoiTacTomTat() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'tomTat'],
    queryFn: getThanhToanDoiTacTomTat,
    staleTime: 1000 * 60 * 5,
  });
}

/** Một trang danh sách — lọc / sắp xếp / phân trang chạy ở PostgREST. */
export function useThanhToanDoiTacPage(query: ThanhToanDoiTacListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'page', query],
    queryFn: () => getThanhToanDoiTacPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

export const useThanhToanDoiTacList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllThanhToanDoiTac,
    staleTime: 1000 * 60 * 2,
  });
};

export const useThanhToanDoiTacById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getThanhToanDoiTacById(id!),
    enabled: !!id,
  });
};

export const useCreateThanhToanDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ThanhToanDoiTacFormValues) => createThanhToanDoiTac(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateThanhToanDoiTac = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThanhToanDoiTacFormValues }) =>
      updateThanhToanDoiTac(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteThanhToanDoiTac = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteThanhToanDoiTac,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteThanhToanDoiTacMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteThanhToanDoiTacMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/** Đánh dấu Đã thanh toán / Đã huỷ hàng loạt; báo số phiếu bỏ qua (đã ở trạng thái kết thúc). */
export const useChuyenTrangThaiThanhToanMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      status,
      idsKetThuc,
      ngayXuLy,
    }: {
      ids: string[];
      status: { id: string; ten: string };
      idsKetThuc: string[];
      ngayXuLy: string;
    }) => chuyenTrangThaiThanhToanMany(ids, status, idsKetThuc, ngayXuLy),
    onSuccess: (count, { ids, status }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('thanhToanDoiTac.bulk.toast.success', { count, status: status.ten }));
      const boQua = ids.length - count;
      if (boQua > 0) toast.warning(i18n.t('thanhToanDoiTac.bulk.toast.boQua', { count: boQua }));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
