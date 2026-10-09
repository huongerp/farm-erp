import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllDeXuatMuaHang,
  getDeXuatMuaHangPage,
  getDeXuatMuaHangById,
  getAllDeXuatMuaHangChiTiet,
  getDeXuatMuaHangChiTietPage,
  createDeXuatMuaHang,
  updateDeXuatMuaHang,
  deleteDeXuatMuaHang,
  deleteDeXuatMuaHangMany,
  updateDeXuatMuaHangTrangThai,
  updateDeXuatMuaHangTrangThaiMany,
} from '../services/de-xuat-mua-hang-service';
import type { DeXuatMuaHangChiTietListServerQuery, DeXuatMuaHangListServerQuery } from '../services/de-xuat-mua-hang-list-query';
import type { DeXuatMuaHangFormValues } from '../core/schema';
import type { DeXuatMuaHang } from '../core/types';
import type { TrangThaiDeXuatMuaHang } from '../core/constants';
import i18n from '../../../../lib/i18n';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';

const QUERY_KEY = ['deXuatMuaHang'] as const;
const QUERY_KEY_CHI_TIET = [...QUERY_KEY, 'chiTiet'] as const;

const DE_XUAT_PAGE_SIZE = 50;
const DE_XUAT_CHI_TIET_PAGE_SIZE = 100;

/** @deprecated Tab Thống kê: dùng fetchDeXuatMuaHangStatsFromRpc. List tab: useDeXuatMuaHangListPaged. */
export const useDeXuatMuaHangList = () => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY, bt.key],
    queryFn: () => getAllDeXuatMuaHang(bt),
    enabled: false,
    staleTime: 1000 * 60 * 15,
  });
};

export const useDeXuatMuaHangListPaged = (pageIndex: number, listQuery: DeXuatMuaHangListServerQuery) => {
  const bt = useKhoBienThe();
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'paged', pageIndex, DE_XUAT_PAGE_SIZE, qPart, bt.key] as const,
    queryFn: () => getDeXuatMuaHangPage(bt, pageIndex, DE_XUAT_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });
};

/** @deprecated Dùng useDeXuatMuaHangChiTietPaged. */
export const useDeXuatMuaHangChiTietAll = () => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY_CHI_TIET, bt.key],
    queryFn: () => getAllDeXuatMuaHangChiTiet(bt),
    enabled: false,
    staleTime: 1000 * 60 * 15,
  });
};

export const useDeXuatMuaHangChiTietPaged = (pageIndex: number, listQuery: DeXuatMuaHangChiTietListServerQuery) => {
  const bt = useKhoBienThe();
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY_CHI_TIET, 'paged', pageIndex, DE_XUAT_CHI_TIET_PAGE_SIZE, qPart, bt.key] as const,
    queryFn: () => getDeXuatMuaHangChiTietPage(bt, pageIndex, DE_XUAT_CHI_TIET_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });
};

export const useDeXuatMuaHangById = (id: string | undefined) => {
  const bt = useKhoBienThe();
  return useQuery({
    queryKey: [...QUERY_KEY, id, bt.key],
    queryFn: () => getDeXuatMuaHangById(bt, id!),
    enabled: !!id,
  });
};

export const useCreateDeXuatMuaHang = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DeXuatMuaHangFormValues) => createDeXuatMuaHang(bt, data),
    onSuccess: (created) => {
      qc.setQueryData([...QUERY_KEY, bt.key], (old: DeXuatMuaHang[] | undefined) => (old ? [created, ...old] : [created]));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      toast.success(i18n.t('deXuatMuaHang.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateDeXuatMuaHang = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeXuatMuaHangFormValues }) =>
      updateDeXuatMuaHang(bt, id, data),
    onSuccess: (updated) => {
      qc.setQueryData([...QUERY_KEY, bt.key], (old: DeXuatMuaHang[] | undefined) =>
        old?.map((p) => (p.id === updated.id ? updated : p)) ?? [updated]
      );
      qc.setQueryData([...QUERY_KEY, updated.id, bt.key], updated);
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      toast.success(i18n.t('deXuatMuaHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/** Đổi riêng trạng thái duyệt — không ghi lại cả phiếu + chi tiết như useUpdateDeXuatMuaHang. */
export const useUpdateDeXuatMuaHangTrangThai = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      trang_thai,
      ghi_chu,
      notePrefix,
      id_nguoi_duyet,
    }: {
      id: string;
      trang_thai: TrangThaiDeXuatMuaHang;
      ghi_chu?: string;
      notePrefix?: string;
      id_nguoi_duyet?: string | null;
    }) => updateDeXuatMuaHangTrangThai(bt, id, trang_thai, { ghi_chu, notePrefix, id_nguoi_duyet }),
    onSuccess: (_void, { id }) => {
      qc.removeQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      toast.success(i18n.t('deXuatMuaHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/**
 * Duyệt hàng loạt. Lỗi một phần không làm hỏng cả lô: service trả danh sách thành công / thất bại
 * để toast báo rõ số phiếu đã chạy.
 */
export const useUpdateDeXuatMuaHangTrangThaiMany = (onSuccess?: () => void) => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      trang_thai,
      ghi_chu,
      notePrefix,
      id_nguoi_duyet,
    }: {
      ids: string[];
      trang_thai: TrangThaiDeXuatMuaHang;
      ghi_chu?: string;
      notePrefix?: string;
      id_nguoi_duyet?: string | null;
    }) => updateDeXuatMuaHangTrangThaiMany(bt, ids, trang_thai, { ghi_chu, notePrefix, id_nguoi_duyet }),
    onSuccess: (result, { ids }) => {
      result.okIds.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });

      if (result.failed.length === 0) {
        toast.success(
          i18n.t('deXuatMuaHang.toast.bulkApproveSuccess', { count: result.okIds.length })
        );
      } else {
        toast.warning(
          i18n.t('deXuatMuaHang.toast.bulkApprovePartial', {
            ok: result.okIds.length,
            total: ids.length,
            failed: result.failed.length,
          })
        );
        toast.error(result.failed[0].message);
      }
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDeXuatMuaHang = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: Parameters<typeof deleteDeXuatMuaHang>[1]) => deleteDeXuatMuaHang(bt, arg),
    onSuccess: (_void, id) => {
      qc.setQueryData([...QUERY_KEY, bt.key], (old: DeXuatMuaHang[] | undefined) => old?.filter((p) => p.id !== id) ?? []);
      qc.removeQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      toast.success(i18n.t('deXuatMuaHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDeXuatMuaHangMany = () => {
  const bt = useKhoBienThe();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: Parameters<typeof deleteDeXuatMuaHangMany>[1]) => deleteDeXuatMuaHangMany(bt, arg),
    onSuccess: (_void, ids) => {
      const set = new Set(ids);
      qc.setQueryData([...QUERY_KEY, bt.key], (old: DeXuatMuaHang[] | undefined) => old?.filter((p) => !set.has(p.id)) ?? []);
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      toast.success(i18n.t('deXuatMuaHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
