import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getAllDonDatHang,
  getDonDatHangPage,
  getChiTietDonDatHangPage,
  getDonDatHangById,
  createDonDatHang,
  updateDonDatHang,
  updateDonDatHangTrangThai,
  deleteDonDatHang,
  deleteDonDatHangMany,
  getPhanLoaiDonDatHangChiTiet,
  getNextSoPoFormatted,
} from '../services/don-dat-hang-service';
import type { DonDatHangListServerQuery } from '../services/don-dat-hang-list-query';
import type { DonDatHangFormValues } from '../core/schema';
import type { DonDatHang } from '../core/types';
import i18n from '../../../../lib/i18n';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';

const QUERY_KEY = ['donDatHang'] as const;
const PHAN_LOAI_CHI_TIET_QUERY_KEY = [...QUERY_KEY, 'phanLoaiChiTiet'] as const;

/** Số PO tiếp theo khi tạo mới (format PO-YYYY-NNNNN). Chỉ gọi khi mở form tạo đơn (enabled = true). Có thể sửa mã trên form. */
export const useNextSoPoDonDatHang = (enabled: boolean) => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'nextSoPo'],
    queryFn: getNextSoPoFormatted,
    enabled,
    staleTime: 0,
  });
};

export const useDonDatHangList = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getAllDonDatHang,
    staleTime: 1000 * 60 * 15,
  });
};

export const usePhanLoaiDonDatHangChiTiet = () => {
  return useQuery({
    queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY,
    queryFn: getPhanLoaiDonDatHangChiTiet,
    staleTime: 1000 * 60 * 15,
  });
};

const DON_DAT_HANG_PAGE_SIZE = 50;
const CHI_TIET_DON_DAT_HANG_PAGE_SIZE = 100;

/** Danh sách đơn đặt hàng theo trang (server-side). `pageIndex` 0-based. */
export const useDonDatHangListPaged = (pageIndex: number, listQuery: DonDatHangListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'paged', pageIndex, DON_DAT_HANG_PAGE_SIZE, qPart] as const,
    queryFn: () => getDonDatHangPage(pageIndex, DON_DAT_HANG_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });
};

/** Chi tiết phẳng (mỗi dòng = một dòng hàng trên đơn), server-side. `pageIndex` 0-based. */
export const useChiTietDonDatHangListPaged = (pageIndex: number, listQuery: DonDatHangListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'chiTietPaged', pageIndex, CHI_TIET_DON_DAT_HANG_PAGE_SIZE, qPart] as const,
    queryFn: () => getChiTietDonDatHangPage(pageIndex, CHI_TIET_DON_DAT_HANG_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });
};

export const useDonDatHangById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getDonDatHangById(id!),
    enabled: !!id,
  });
};

export const useCreateDonDatHang = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DonDatHangFormValues) => createDonDatHang(data),
    onSuccess: (created) => {
      qc.setQueryData(QUERY_KEY, (old: DonDatHang[] | undefined) => (old ? [created, ...old] : [created]));
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateDonDatHang = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DonDatHangFormValues }) =>
      updateDonDatHang(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, (old: DonDatHang[] | undefined) =>
        old?.map((d) => (d.id === updated.id ? updated : d)) ?? [updated]
      );
      qc.setQueryData([...QUERY_KEY, updated.id], updated);
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/** Duyệt / chuyển trạng thái PO — chỉ đổi trang_thai + ghi_chu, không đụng chi_tiet. */
export const useUpdateDonDatHangTrangThai = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      trangThai,
      ghiChu,
      notePrefix,
    }: {
      id: string;
      trangThai: DonDatHang['trang_thai'];
      ghiChu?: string;
      notePrefix?: string;
    }) => updateDonDatHangTrangThai(id, trangThai, { ghi_chu: ghiChu, notePrefix }),
    onSuccess: async (_void, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      toast.success(i18n.t('donDatHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDonDatHang = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDonDatHang,
    onSuccess: (_void, id) => {
      qc.setQueryData(QUERY_KEY, (old: DonDatHang[] | undefined) => old?.filter((d) => d.id !== id) ?? []);
      qc.removeQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDonDatHangMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDonDatHangMany,
    onSuccess: (_void, ids) => {
      const set = new Set(ids);
      qc.setQueryData(QUERY_KEY, (old: DonDatHang[] | undefined) => old?.filter((d) => !set.has(d.id)) ?? []);
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
