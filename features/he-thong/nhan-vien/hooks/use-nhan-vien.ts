import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchEmployeeRows,
  fetchEmployeeRowsPage,
  fetchEmployeeRowsLiteForCounts,
  enrichEmployeesWithRefData,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployees,
  updateEmployeeStatus,
  bulkUpdateEmployees,
  restoreEmployees,
  type EmployeeListQuery,
  type EmployeeMutationResult,
} from "../services/nhan-vien-service";
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import { EmployeeFormValues } from "../core/schema";
import { Employee } from "../core/types";
import { toast } from "sonner";
import i18n from '../../../../lib/i18n';
import { EMPLOYEES_REF_QUERY_KEY } from '../../../../lib/hooks/use-supabase-ref-queries';
import { invalidateRefCache } from '../../../../lib/ref-cache';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import { useBranches } from '../../chi-nhanh/hooks/use-chi-nhanh';

export const EMPLOYEES_QUERY_KEY = ['employees'] as const;

/** Query key cho bản lite phục vụ đếm filter chip — không dùng cho bảng chính. */
export const EMPLOYEES_LITE_COUNTS_QUERY_KEY = ['employees', 'lite-for-filter-counts'] as const;

/**
 * Chỉ các cột tối thiểu để đếm filter (phòng ban/chức vụ/trạng thái) — tránh refetch full list khi gõ search.
 */
export const useEmployeesLiteForCounts = () =>
  useQuery({
    queryKey: EMPLOYEES_LITE_COUNTS_QUERY_KEY,
    queryFn: fetchEmployeeRowsLiteForCounts,
    staleTime: 1000 * 60 * 5,
  });

/**
 * Danh sách nhân viên: tải rows một lần, gộp tên từ cache React Query (phòng ban/chức vụ/chi nhánh) — tránh gọi trùng API với toolbar/form.
 * Dùng `enabled: false` khi không cần (vd chỉ tab thống kê mới tải full).
 */
export const useEmployees = (options?: { enabled?: boolean }) => {
  const rowsQuery = useQuery({
    queryKey: EMPLOYEES_QUERY_KEY,
    queryFn: fetchEmployeeRows,
    staleTime: 1000 * 60 * 15,
    enabled: options?.enabled !== false,
  });
  const { data: positions = [] } = usePositions();
  const { data: departments = [] } = useDepartments();
  const { data: branches = [] } = useBranches();

  const data = useMemo(() => {
    if (!rowsQuery.data) return undefined;
    const emps = rowsQuery.data.map((e) => ({ ...e }));
    enrichEmployeesWithRefData(emps, positions, departments, branches);
    return emps;
  }, [rowsQuery.data, positions, departments, branches]);

  return {
    ...rowsQuery,
    data,
  };
};

/**
 * Server-side pagination cho danh sách nhân viên: chỉ tải đúng 1 trang từ Supabase
 * (dùng `.range` + `count: 'exact'`) — giảm egress tuyệt đối so với `useEmployees()`
 * fetch toàn bộ bảng.
 *
 * Query key chứa params → đổi `page/pageSize/q/trangThai` sẽ tạo cache entry mới,
 * không đụng cache của `useEmployees()`.
 */
export const useEmployeesPage = (query: EmployeeListQuery) => {
  const rowsQuery = useQuery({
    queryKey: ['employees', 'page', stableListQueryKeyPart(query)] as const,
    queryFn: () => fetchEmployeeRowsPage(query),
    staleTime: 1000 * 60 * 5,
    // Giữ trang cũ khi chuyển page để tránh nhấp nháy UI (React Query v5 `placeholderData`).
    placeholderData: (previous) => previous,
  });
  const { data: positions = [] } = usePositions();
  const { data: departments = [] } = useDepartments();
  const { data: branches = [] } = useBranches();

  const enriched = useMemo(() => {
    if (!rowsQuery.data) return undefined;
    const emps = rowsQuery.data.data.map((e) => ({ ...e }));
    enrichEmployeesWithRefData(emps, positions, departments, branches);
    return {
      ...rowsQuery.data,
      data: emps,
    };
  }, [rowsQuery.data, positions, departments, branches]);

  return {
    ...rowsQuery,
    data: enriched,
  };
};

export const useEmployee = (id: string | null) => {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => getEmployeeById(id!),
    enabled: !!id,
  });
};

export const useCreateEmployee = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: (emp: EmployeeMutationResult) => {
      queryClient.setQueryData(EMPLOYEES_QUERY_KEY, (old: Employee[] | undefined) =>
        old ? [emp, ...old] : [emp]
      );
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_REF_QUERY_KEY });
      invalidateRefCache('employees');
      toast.success(i18n.t('employee.toast.createSuccess'));
      if (emp.email) {
        toast.info(
          emp._passwordSet
            ? i18n.t('employee.toast.customPasswordSet', { email: emp.email })
            : i18n.t('employee.toast.defaultPasswordSet', { email: emp.email })
        );
      }
      if (emp._passwordError) {
        toast.warning(i18n.t('employee.toast.passwordSetFailed', { error: emp._passwordError }));
      }
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
  });
};

export const useUpdateEmployee = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: EmployeeFormValues }) => updateEmployee(id, data),
    onSuccess: (emp: EmployeeMutationResult) => {
      queryClient.setQueryData(EMPLOYEES_QUERY_KEY, (old: Employee[] | undefined) =>
        old?.map((e) => (String(e.id) === String(emp.id) ? emp : e)) ?? [emp]
      );
      queryClient.setQueryData(['employee', String(emp.id)], emp);
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_REF_QUERY_KEY });
      invalidateRefCache('employees');
      toast.success(i18n.t('employee.toast.updateSuccess'));
      if (emp._passwordSet) {
        toast.info(i18n.t('employee.toast.passwordSet', { email: emp.email }));
      }
      if (emp._passwordError) {
        toast.warning(i18n.t('employee.toast.passwordSetFailed', { error: emp._passwordError }));
      }
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
  });
};

export const useUpdateStatusEmployee = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ ids, status }: { ids: string[], status: string }) => updateEmployeeStatus(ids, status),
      onSuccess: (_, variables) => {
        queryClient.setQueryData(EMPLOYEES_QUERY_KEY, (old: Employee[] | undefined) => {
          if (!old) return old;
          const idSet = new Set(variables.ids.map(String));
          return old.map((e) =>
            idSet.has(String(e.id)) ? { ...e, trang_thai: variables.status as Employee['trang_thai'] } : e
          );
        });
        queryClient.invalidateQueries({ queryKey: EMPLOYEES_REF_QUERY_KEY });
        invalidateRefCache('employees');
        toast.success(i18n.t('employee.toast.statusUpdateSuccess', { count: variables.ids.length }));
      },
      onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
    });
};

export const useBulkUpdateEmployees = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, fields }: { ids: string[]; fields: Record<string, any> }) =>
      bulkUpdateEmployees(ids, fields),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_REF_QUERY_KEY });
      invalidateRefCache('employees');
      toast.success(i18n.t('employee.toast.bulkUpdateSuccess', { count: variables.ids.length }));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`),
  });
};

export const useDeleteEmployees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteEmployees(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData(EMPLOYEES_QUERY_KEY, (old: Employee[] | undefined) =>
        old?.filter((e) => !ids.includes(String(e.id))) ?? []
      );
      ids.forEach((id) => queryClient.removeQueries({ queryKey: ['employee', id] }));
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_REF_QUERY_KEY });
      invalidateRefCache('employees');
      toast.success(i18n.t('employee.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: any) => toast.error(err.message)
  });
};

/**
 * Hook xóa có thể hoàn tác (undo).
 * Xóa trước → hiện toast có nút "Hoàn tác" → nếu nhấn thì restore lại.
 */
export const useDeleteWithUndo = () => {
  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: (ids: string[]) => deleteEmployees(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_REF_QUERY_KEY });
      invalidateRefCache('employees');
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : String(err)),
  });

  const restoreMut = useMutation({
    mutationFn: (employees: Employee[]) => restoreEmployees(employees),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_REF_QUERY_KEY });
      invalidateRefCache('employees');
      toast.success(i18n.t('employee.toast.undoSuccess'));
    },
  });

  const deleteWithUndo = async (
    employees: Employee[],
    callbacks?: { onDone?: () => void }
  ) => {
    const ids = employees.map(e => e.id);
    const snapshot = [...employees]; // lưu bản sao để restore

    await deleteMut.mutateAsync(ids);
    callbacks?.onDone?.();

    toast(i18n.t('employee.toast.deleteCount', { count: ids.length }), {
      duration: 6000,
      action: {
        label: i18n.t('employee.toast.undo'),
        onClick: () => restoreMut.mutate(snapshot),
      },
    });
  };

  return { deleteWithUndo, isPending: deleteMut.isPending };
};
