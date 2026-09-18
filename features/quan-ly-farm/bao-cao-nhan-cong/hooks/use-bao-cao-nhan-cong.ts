import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import type { BaoCaoNhanCongListServerQuery } from '../services/bao-cao-nhan-cong-list-query';
import {
  getAllBaoCaoNhanCong,
  getBaoCaoNhanCongPage,
  getBaoCaoNhanCongTomTat,
  getBaoCaoNhanCongById,
  createBaoCaoNhanCong,
  updateBaoCaoNhanCong,
  deleteBaoCaoNhanCong,
  deleteBaoCaoNhanCongMany,
  updateBaoCaoNhanCongTrangThai,
  updateBaoCaoNhanCongTrangThaiMany,
} from '../services/bao-cao-nhan-cong-service';
import {
  findBaoCaoDuplicateByBranchAndDate,
  farmBaoCaoNhanCongToFormNextDay,
  type PhieuTomTatTrung,
} from '../core/form-mappers';
import type { BaoCaoNhanCongFormValues } from '../core/schema';
import type { FarmBaoCaoNhanCong, TrangThaiBaoCaoNhanCongPhieu } from '../core/types';

export const QUERY_KEY_BAO_CAO_NHAN_CONG = ['baoCaoNhanCong'] as const;

export function useBaoCaoNhanCongList() {
  return useQuery({
    queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG,
    queryFn: getAllBaoCaoNhanCong,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Một trang danh sách — lọc / sắp xếp / phân trang chạy ở PostgREST.
 *
 * `placeholderData: keepPreviousData` để chuyển trang hoặc gõ tìm kiếm không
 * nháy skeleton: bảng giữ dữ liệu cũ tới khi trang mới về.
 */
export function useBaoCaoNhanCongPage(query: BaoCaoNhanCongListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, 'page', query],
    queryFn: () => getBaoCaoNhanCongPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Danh sách tóm tắt (6 cột): chip lọc + số đếm, chi nhánh gợi ý khi thêm phiếu,
 * và chặn trùng ngày × chi nhánh trong form.
 */
export function useBaoCaoNhanCongTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getBaoCaoNhanCongTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBaoCaoNhanCongById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, id],
    queryFn: () => getBaoCaoNhanCongById(id!),
    enabled: !!id,
  });
}

export function useCreateBaoCaoNhanCong(onSuccess?: () => void) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: BaoCaoNhanCongFormValues) => createBaoCaoNhanCong(data, user?.id ?? null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      toast.success(i18n.t('baoCaoNhanCong.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Tạo phiếu mới cho ngày kế tiếp (cùng chi nhánh + copy số liệu; không copy ghi chú / ảnh). */
export function useCopyBaoCaoNhanCongToNextDay() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async ({
      source,
      existingList,
    }: {
      source: FarmBaoCaoNhanCong;
      /** Danh sách tóm tắt (id / ngày / chi nhánh) — đủ để biết ngày kế đã có phiếu chưa. */
      existingList: PhieuTomTatTrung[];
    }) => {
      const values = farmBaoCaoNhanCongToFormNextDay(source);
      const dup = findBaoCaoDuplicateByBranchAndDate(
        existingList,
        values.ngay,
        values.id_chi_nhanh,
        null
      );
      if (dup) {
        throw new Error(i18n.t('baoCaoNhanCong.validation.duplicateNgayChiNhanh'));
      }
      return createBaoCaoNhanCong(values, user?.id ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      toast.success(i18n.t('baoCaoNhanCong.toast.copyNextDaySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBaoCaoNhanCong(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BaoCaoNhanCongFormValues }) =>
      updateBaoCaoNhanCong(id, data),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, id] });
      toast.success(i18n.t('baoCaoNhanCong.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBaoCaoNhanCong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBaoCaoNhanCong,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      toast.success(i18n.t('baoCaoNhanCong.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBaoCaoNhanCongMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBaoCaoNhanCongMany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      toast.success(i18n.t('baoCaoNhanCong.toast.deleteManySuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Khóa / mở khóa hàng loạt — một UPDATE ... IN, không có trạng thái dở dang từng phiếu. */
export function useUpdateBaoCaoNhanCongTrangThaiMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, trang_thai }: { ids: string[]; trang_thai: TrangThaiBaoCaoNhanCongPhieu }) =>
      updateBaoCaoNhanCongTrangThaiMany(ids, trang_thai),
    onSuccess: (_void, { ids }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, id] }));
      toast.success(i18n.t('baoCaoNhanCong.toast.trangThaiUpdatedMany', { count: ids.length }));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBaoCaoNhanCongTrangThai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, trang_thai }: { id: string; trang_thai: TrangThaiBaoCaoNhanCongPhieu }) =>
      updateBaoCaoNhanCongTrangThai(id, trang_thai),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_BAO_CAO_NHAN_CONG });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_BAO_CAO_NHAN_CONG, id] });
      toast.success(i18n.t('baoCaoNhanCong.toast.trangThaiUpdated'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
