import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import {
  getTaiSanList,
  createTaiSan,
  updateTaiSan,
  deleteTaiSan,
  updateTaiSanStatus,
  getNextMaTaiSan,
  checkMaTaiSanExists,
  getDistinctThuongHieu,
  getDistinctModel,
  getDistinctXuatXu,
  getDistinctNhaCungCap,
} from '../services/danh-muc-tai-san-service';
import { TaiSanFormValues } from '../core/schema';

/**
 * Phạm vi tài sản user được phép xem (tab Danh sách).
 * - null = xem tất cả (admin hoặc chưa áp dụng phân quyền).
 * - Set<string> = chỉ các id trong set (sau này: theo phòng ban / nhân viên dưới quyền).
 */
export function useAllowedTaiSanIds(): Set<string> | null {
  const user = useAuthStore((s) => s.user);
  return useMemo(() => {
    if (!user) return new Set();
    if (user.role === 'admin') return null;
    // Sau này: lấy danh sách id tài sản user được quyền (API hoặc id_phong_ban, cây quản lý)
    return null;
  }, [user]);
}

export const useTaiSanList = () => {
  return useQuery({
    queryKey: ['taiSanList'],
    queryFn: getTaiSanList,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateTaiSan = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaiSan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
      queryClient.invalidateQueries({ queryKey: ['taiSanDistinctThuongHieu'] });
      queryClient.invalidateQueries({ queryKey: ['taiSanDistinctModel'] });
      queryClient.invalidateQueries({ queryKey: ['taiSanDistinctXuatXu'] });
      queryClient.invalidateQueries({ queryKey: ['taiSanDistinctNhaCungCap'] });
      toast.success(i18n.t('danhSachTaiSan.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateTaiSan = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaiSanFormValues }) => updateTaiSan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
      queryClient.invalidateQueries({ queryKey: ['taiSanDistinctThuongHieu'] });
      queryClient.invalidateQueries({ queryKey: ['taiSanDistinctModel'] });
      queryClient.invalidateQueries({ queryKey: ['taiSanDistinctXuatXu'] });
      queryClient.invalidateQueries({ queryKey: ['taiSanDistinctNhaCungCap'] });
      toast.success(i18n.t('danhSachTaiSan.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateTaiSanStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 0 | 1 }) => updateTaiSanStatus(ids, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
      toast.success(i18n.t('danhSachTaiSan.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteTaiSan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTaiSan(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ['taiSanList'] });
      toast.success(i18n.t('danhSachTaiSan.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

/** Mã tài sản tiếp theo (TS00001, TS00002...) – dùng khi mở form tạo mới. */
export const useGetNextMaTaiSan = (enabled: boolean) => {
  return useQuery({
    queryKey: ['taiSanNextMa'],
    queryFn: getNextMaTaiSan,
    enabled,
    staleTime: 1000 * 30,
  });
};

/** Kiểm tra mã tài sản trùng (async). */
export const checkMaTaiSanExistsAsync = checkMaTaiSanExists;

/** Danh sách giá trị distinct thương hiệu – cho combobox enum có thể thêm mới. */
export const useDistinctThuongHieu = () =>
  useQuery({
    queryKey: ['taiSanDistinctThuongHieu'],
    queryFn: getDistinctThuongHieu,
    staleTime: 1000 * 60 * 2,
  });

/** Danh sách giá trị distinct model – cho combobox enum có thể thêm mới. */
export const useDistinctModel = () =>
  useQuery({
    queryKey: ['taiSanDistinctModel'],
    queryFn: getDistinctModel,
    staleTime: 1000 * 60 * 2,
  });

/** Danh sách giá trị distinct xuất xứ – cho combobox enum có thể thêm mới. */
export const useDistinctXuatXu = () =>
  useQuery({
    queryKey: ['taiSanDistinctXuatXu'],
    queryFn: getDistinctXuatXu,
    staleTime: 1000 * 60 * 2,
  });

/** Danh sách giá trị distinct nhà cung cấp – cho combobox enum có thể thêm mới. */
export const useDistinctNhaCungCap = () =>
  useQuery({
    queryKey: ['taiSanDistinctNhaCungCap'],
    queryFn: getDistinctNhaCungCap,
    staleTime: 1000 * 60 * 2,
  });
