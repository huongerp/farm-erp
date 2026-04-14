import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllHangHoa,
  getHangHoaById,
  createHangHoa,
  updateHangHoa,
  updateHangHoaStatus,
  deleteHangHoa,
  deleteHangHoaMany,
  importHangHoa,
} from '../services/hang-hoa-service';
import type { HangHoaFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { HANG_HOA_REF_QUERY_KEY } from '../../../../lib/hooks/use-supabase-ref-queries';
import { invalidateRefCache } from '../../../../lib/ref-cache';

/** Query key thống nhất cho danh sách hàng hóa đầy đủ (tránh trùng hangHoaList / hangHoaListThemDong). */
export const HANG_HOA_QUERY_KEY = ['hangHoa'] as const;

export const useHangHoaList = () => {
  return useQuery({
    queryKey: HANG_HOA_QUERY_KEY,
    queryFn: getAllHangHoa,
    staleTime: 1000 * 60 * 15,
  });
};

export const useHangHoaById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...HANG_HOA_QUERY_KEY, id],
    queryFn: () => getHangHoaById(id!),
    enabled: !!id,
  });
};

export const useCreateHangHoa = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHangHoa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: HANG_HOA_REF_QUERY_KEY });
      invalidateRefCache('hangHoa');
      toast.success(i18n.t('hangHoa.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateHangHoa = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HangHoaFormValues }) => updateHangHoa(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: HANG_HOA_REF_QUERY_KEY });
      invalidateRefCache('hangHoa');
      toast.success(i18n.t('hangHoa.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateHangHoaStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: import('../core/types').HangHoa['trang_thai'] }) =>
      updateHangHoaStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: HANG_HOA_REF_QUERY_KEY });
      invalidateRefCache('hangHoa');
      toast.success(i18n.t('hangHoa.toast.updateSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteHangHoa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHangHoa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: HANG_HOA_REF_QUERY_KEY });
      invalidateRefCache('hangHoa');
      toast.success(i18n.t('hangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteHangHoaMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHangHoaMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: HANG_HOA_REF_QUERY_KEY });
      invalidateRefCache('hangHoa');
      toast.success(i18n.t('hangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useImportHangHoa = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: import('../services/hang-hoa-service').HangHoaImportRow[]) => importHangHoa(rows, 'create'),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: HANG_HOA_REF_QUERY_KEY });
      invalidateRefCache('hangHoa');
      const msgs: string[] = [];
      if (result.created > 0) msgs.push(i18n.t('hangHoa.toast.importCreated', { count: result.created }));
      if (result.updated > 0) msgs.push(i18n.t('hangHoa.toast.importUpdated', { count: result.updated }));
      if (msgs.length > 0) toast.success(msgs.join('. '));
      if (result.errors.length > 0) {
        toast.warning(i18n.t('hangHoa.toast.importErrors', { count: result.errors.length }));
      }
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
