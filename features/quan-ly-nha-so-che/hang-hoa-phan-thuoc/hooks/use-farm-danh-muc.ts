import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllFarmDanhMuc,
  getFarmDanhMucById,
  getFarmDanhMucCap2WithParent,
  createFarmDanhMuc,
  updateFarmDanhMuc,
  deleteFarmDanhMuc,
  deleteFarmDanhMucMany,
  importFarmDanhMuc,
} from '../services/farm-danh-muc-service';
import type { FarmDanhMucFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { FARM_HANG_HOA_QUERY_KEY } from './use-farm-hang-hoa';
import { invalidateRefCache } from '../../../../lib/ref-cache';
import type { ImportMode } from '../../../../lib/import-types';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';

const QUERY_KEY = ['farmDanhMucHangHoa'] as const;

export const useFarmDanhMucList = () => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY, bt.key],
    queryFn: () => getAllFarmDanhMuc(bt),
    staleTime: 1000 * 60 * 30,
  });
};

export const useFarmDanhMucById = (id: string | undefined) => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY, bt.key, id],
    queryFn: () => getFarmDanhMucById(bt, id!),
    enabled: !!id,
  });
};

export const useFarmDanhMucCap2WithParent = () => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY, bt.key, 'cap2WithParent'],
    queryFn: () => getFarmDanhMucCap2WithParent(bt),
    staleTime: 1000 * 60 * 30,
  });
};

export const useCreateFarmDanhMuc = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: Parameters<typeof createFarmDanhMuc>[1]) => createFarmDanhMuc(bt, arg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateFarmDanhMuc = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FarmDanhMucFormValues }) => updateFarmDanhMuc(bt, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteFarmDanhMuc = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: Parameters<typeof deleteFarmDanhMuc>[1]) => deleteFarmDanhMuc(bt, arg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteFarmDanhMucMany = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: Parameters<typeof deleteFarmDanhMucMany>[1]) => deleteFarmDanhMucMany(bt, arg),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/** Import hàng loạt danh mục (cây 2 cấp) — làm mới cả danh sách hàng hóa vì tên danh mục là cột suy ra. */
export const useImportFarmDanhMuc = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, mode }: { rows: Record<string, unknown>[]; mode: ImportMode }) =>
      importFarmDanhMuc(bt, rows, { mode }),
    onSuccess: (result) => {
      invalidateRefCache('farmHangHoa');
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      const msgs: string[] = [];
      if (result.created > 0) msgs.push(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.importCreated', { count: result.created }));
      if (result.updated > 0) msgs.push(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.importUpdated', { count: result.updated }));
      if (msgs.length > 0) toast.success(msgs.join('. '));
      if (result.errors.length > 0) {
        toast.warning(i18n.t('farmHangHoaPhanThuoc.danhMuc.toast.importErrors', { count: result.errors.length }));
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
