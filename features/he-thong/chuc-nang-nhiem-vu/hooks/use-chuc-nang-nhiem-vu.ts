import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getMissions,
  getMissionsByDepartment,
  getOneMissionByDepartment,
  createMission,
  updateMission,
  deleteMissions,
  getFunctions,
  getFunctionsByDepartment,
  createFunction,
  updateFunction,
  deleteFunctions,
  updateFunctionStatus,
  getTasks,
  getTasksByDepartment,
  getTasksByFunction,
  createTask,
  updateTask,
  deleteTasks,
  updateTaskStatus,
} from '../services/chuc-nang-nhiem-vu-service';
import type { MissionFormValues, FunctionFormValues, TaskFormValues } from '../core/schema';

const t = (key: string) => i18n.t(key);

export const useMissions = () =>
  useQuery({ queryKey: ['missions'], queryFn: getMissions, staleTime: 1000 * 60 * 5 });

export const useMissionsByDepartment = (idPhongBan: string | null) =>
  useQuery({
    queryKey: ['missions', idPhongBan],
    queryFn: () => (idPhongBan ? getMissionsByDepartment(idPhongBan) : Promise.resolve([])),
    enabled: !!idPhongBan,
  });

/** Mỗi phòng ban chỉ 1 sứ mệnh */
export const useOneMissionByDepartment = (idPhongBan: string | null) =>
  useQuery({
    queryKey: ['mission', idPhongBan],
    queryFn: () => (idPhongBan ? getOneMissionByDepartment(idPhongBan) : Promise.resolve(null)),
    enabled: !!idPhongBan,
  });

export const useCreateMission = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createMission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] });
      toast.success(t('chucNangNhiemVu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useUpdateMission = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MissionFormValues }) => updateMission(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] });
      toast.success(t('chucNangNhiemVu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useDeleteMissions = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteMissions,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['missions'] });
      toast.success(t('chucNangNhiemVu.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

// --- Chức năng ---
export const useFunctions = () =>
  useQuery({ queryKey: ['functions'], queryFn: getFunctions, staleTime: 1000 * 60 * 5 });

export const useFunctionsByDepartment = (idPhongBan: string | null) =>
  useQuery({
    queryKey: ['functions', idPhongBan],
    queryFn: () => (idPhongBan ? getFunctionsByDepartment(idPhongBan) : Promise.resolve([])),
    enabled: !!idPhongBan,
  });

export const useCreateFunction = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFunction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['functions'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('chucNangNhiemVu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useUpdateFunction = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FunctionFormValues }) => updateFunction(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['functions'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('chucNangNhiemVu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useDeleteFunctions = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFunctions,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['functions'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('chucNangNhiemVu.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useUpdateFunctionStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: import('../../../../lib/constants').TrangThaiHoatDong }) => updateFunctionStatus(ids, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['functions'] });
      toast.success(t('chucNangNhiemVu.toast.statusUpdate'));
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

// --- Nhiệm vụ ---
export const useTasks = () =>
  useQuery({ queryKey: ['tasks'], queryFn: getTasks, staleTime: 1000 * 60 * 5 });

export const useTasksByDepartment = (idPhongBan: string | null) =>
  useQuery({
    queryKey: ['tasks', idPhongBan],
    queryFn: () => (idPhongBan ? getTasksByDepartment(idPhongBan) : Promise.resolve([])),
    enabled: !!idPhongBan,
  });

export const useTasksByFunction = (idChucNang: string | null) =>
  useQuery({
    queryKey: ['tasks', 'byFunction', idChucNang],
    queryFn: () => (idChucNang ? getTasksByFunction(idChucNang) : Promise.resolve([])),
    enabled: !!idChucNang,
  });

export const useCreateTask = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('chucNangNhiemVu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useUpdateTask = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskFormValues }) => updateTask(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('chucNangNhiemVu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useDeleteTasks = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTasks,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['kpi'] });
      toast.success(t('chucNangNhiemVu.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message),
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: import('../../../../lib/constants').TrangThaiHoatDong }) => updateTaskStatus(ids, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(t('chucNangNhiemVu.toast.statusUpdate'));
    },
    onError: (err: any) => toast.error(err?.message),
  });
};
