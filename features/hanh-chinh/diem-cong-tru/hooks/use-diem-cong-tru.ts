import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getDiemCongTruRecords,
  createDiemCongTruRecord,
  updateDiemCongTruRecord,
  deleteDiemCongTruRecords,
  getPayrollPointGroupsForModule,
} from '../services/diem-cong-tru-service';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { useAuthStore } from '../../../../store/useStore';
import { DiemCongTruFormValues } from '../core/schema';

export const useDiemCongTruRecords = () =>
  useQuery({
    queryKey: ['diemCongTruRecords'],
    queryFn: getDiemCongTruRecords,
  });

export const usePayrollPointGroupsForDiemCongTru = () =>
  useQuery({
    queryKey: ['payrollPointGroups'],
    queryFn: getPayrollPointGroupsForModule,
  });

/**
 * Dùng danh sách ref (nhẹ, không kéo phòng ban/chức vụ/chi nhánh) cho dropdown.
 * Trước đây dùng `queryKey: ['employees']` + `getEmployees` (60+ cột, base64 avatar) — trùng
 * key với useEmployees trang admin gây refetch chéo. Đổi sang `['employees','ref']` + `getEmployeesRef`.
 */
export const useEmployeesForDiemCongTru = () =>
  useQuery({
    queryKey: ['employees', 'ref'],
    queryFn: getEmployeesRef,
  });

export const useCreateDiemCongTruRecord = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  return useMutation({
    mutationFn: (data: DiemCongTruFormValues) => createDiemCongTruRecord(data, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diemCongTruRecords'] });
      toast.success(i18n.t('diemCongTru.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateDiemCongTruRecord = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DiemCongTruFormValues }) =>
      updateDiemCongTruRecord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diemCongTruRecords'] });
      toast.success(i18n.t('diemCongTru.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteDiemCongTruRecords = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDiemCongTruRecords(ids),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['diemCongTruRecords'] });
      toast.success(i18n.t('diemCongTru.toast.deleteSuccess', { count: variables.length }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
