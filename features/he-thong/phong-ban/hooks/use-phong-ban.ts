import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, updateDepartmentStatus, importDepartments } from "../services/phong-ban-service";
import { DepartmentFormValues } from "../core/schema";
import { toast } from "sonner";
import i18n from '../../../../lib/i18n';

export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
    staleTime: 1000 * 60 * 60 * 4,
    gcTime: 1000 * 60 * 60 * 24,
  });
};

export const useCreateDepartment = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(i18n.t('department.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
  });
};

export const useUpdateDepartment = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: DepartmentFormValues }) => updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(i18n.t('department.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
  });
};

export const useUpdateStatusDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: import('../../../../lib/constants').TrangThai }) => updateDepartmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(i18n.t('department.toast.updateSuccess'));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(i18n.t('department.toast.deleteSuccess'));
    },
    onError: (err: any) => toast.error(err.message)
  });
};

export const useImportDepartments = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importDepartments,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      if (result.created > 0) {
        toast.success(i18n.t('department.toast.importSuccess', { count: result.created }));
      }
      if (result.errors.length > 0) {
        toast.warning(result.errors.slice(0, 3).join('; '));
      }
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });
};
