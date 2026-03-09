import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllDanhMucHangHoa,
  getDanhMucHangHoaById,
  getDanhMucCap2WithParent,
  createDanhMucHangHoa,
  updateDanhMucHangHoa,
  deleteDanhMucHangHoa,
  deleteDanhMucHangHoaMany,
} from '../services/danh-muc-hang-hoa-service';
import type { DanhMucHangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';

const QUERY_KEY = ['danhMucHangHoa'] as const;

export const useDanhMucHangHoaList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllDanhMucHangHoa,
    staleTime: 1000 * 60 * 5,
  });
};

export const useDanhMucHangHoaById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getDanhMucHangHoaById(id!),
    enabled: !!id,
  });
};

/** Danh mục cấp 2 (chỉ các mục có cha), kèm tên cha – dùng cho form Danh sách hàng hóa. */
export const useDanhMucCap2WithParent = () => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'cap2WithParent'],
    queryFn: getDanhMucCap2WithParent,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateDanhMucHangHoa = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDanhMucHangHoa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('danhMucHangHoa.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateDanhMucHangHoa = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DanhMucHangHoaFormValues }) =>
      updateDanhMucHangHoa(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('danhMucHangHoa.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDanhMucHangHoa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDanhMucHangHoa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('danhMucHangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDanhMucHangHoaMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDanhMucHangHoaMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('danhMucHangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
