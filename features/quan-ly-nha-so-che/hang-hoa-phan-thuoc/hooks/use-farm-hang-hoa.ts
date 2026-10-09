import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllFarmHangHoa,
  getFarmHangHoaRef,
  getFarmHangHoaById,
  createFarmHangHoa,
  updateFarmHangHoa,
  deleteFarmHangHoa,
  deleteFarmHangHoaMany,
  importFarmHangHoa,
} from '../services/farm-hang-hoa-service';
import type { FarmHangHoaFormValues } from '../core/schema';
import type { FarmHangHoa } from '../core/types';
import i18n from '../../../../lib/i18n';
import { FARM_TON_KHO_PT_QUERY_KEY } from '../../ton-kho-phan-thuoc/hooks/use-farm-ton-kho-pt';
import { invalidateRefCache } from '../../../../lib/ref-cache';
import type { ImportMode } from '../../../../lib/import-types';
import type { HangHoaRefColumn } from '../utils/import-hang-hoa';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';

export const FARM_HANG_HOA_QUERY_KEY = ['farmHangHoaPhanThuoc'] as const;

/** Đồng bộ dropdown danh mục (cap2) khi hàng hóa đổi danh_muc_id / danh_muc_cha_id */
const FARM_DANH_MUC_QUERY_KEY = ['farmDanhMucHangHoa'] as const;

export const useFarmHangHoaList = () => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...FARM_HANG_HOA_QUERY_KEY, bt.key],
    queryFn: () => getAllFarmHangHoa(bt),
    staleTime: 1000 * 60 * 15,
  });
};

export const FARM_HANG_HOA_REF_QUERY_KEY = [...FARM_HANG_HOA_QUERY_KEY, 'ref'] as const;

/** Ref rút gọn cho combobox (Đề xuất mua hàng) — nhẹ hơn danh sách đầy đủ. */
export const useFarmHangHoaRefQuery = () => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...FARM_HANG_HOA_REF_QUERY_KEY, bt.key],
    queryFn: () => getFarmHangHoaRef(bt),
    staleTime: 1000 * 60 * 15,
  });
};

export const useFarmHangHoaById = (id: string | undefined) => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...FARM_HANG_HOA_QUERY_KEY, bt.key, id],
    queryFn: () => getFarmHangHoaById(bt, id!),
    enabled: !!id,
  });
};

export const useCreateFarmHangHoa = (onSuccess?: (created?: FarmHangHoa) => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: Parameters<typeof createFarmHangHoa>[1]) => createFarmHangHoa(bt, arg),
    onSuccess: (created) => {
      invalidateRefCache('farmHangHoa');
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateFarmHangHoa = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FarmHangHoaFormValues }) => updateFarmHangHoa(bt, id, data),
    onSuccess: () => {
      invalidateRefCache('farmHangHoa');
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteFarmHangHoa = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: Parameters<typeof deleteFarmHangHoa>[1]) => deleteFarmHangHoa(bt, arg),
    onSuccess: () => {
      invalidateRefCache('farmHangHoa');
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteFarmHangHoaMany = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: Parameters<typeof deleteFarmHangHoaMany>[1]) => deleteFarmHangHoaMany(bt, arg),
    onSuccess: () => {
      invalidateRefCache('farmHangHoa');
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/**
 * Import hàng loạt. `onSuccess` invalidate đúng bộ key như các mutation khác —
 * thiếu bước này thì combobox ở Đề xuất mua hàng / Phiếu kho / Tồn kho còn cũ tới 15 phút.
 */
export const useImportFarmHangHoa = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rows,
      mode,
      refColumn,
    }: {
      rows: Record<string, unknown>[];
      mode: ImportMode;
      refColumn: HangHoaRefColumn;
    }) => importFarmHangHoa(bt, rows, { mode, refColumn }),
    onSuccess: (result) => {
      invalidateRefCache('farmHangHoa');
      qc.invalidateQueries({ queryKey: FARM_HANG_HOA_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_DANH_MUC_QUERY_KEY });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      const msgs: string[] = [];
      if (result.created > 0) msgs.push(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.importCreated', { count: result.created }));
      if (result.updated > 0) msgs.push(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.importUpdated', { count: result.updated }));
      if (msgs.length > 0) toast.success(msgs.join('. '));
      if (result.errors.length > 0) {
        toast.warning(i18n.t('farmHangHoaPhanThuoc.hangHoa.toast.importErrors', { count: result.errors.length }));
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
