import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  addOrUpdateAttendanceLog,
  checkIn,
  checkOut,
  confirmAttendance,
  deleteAttendanceLog,
  getCompanyMonthlyReport,
  getEmployeeAttendance,
  getEmployeeAttendanceLogs,
  getMyAttendanceHistory,
  getMySummary,
  getRealtimePresence,
  getTodayAttendance,
  updateAttendanceLog,
} from '../services/attendance-service';

const resolveError = (err: any) => {
  const msg = err?.message;
  if (msg && typeof msg === 'string' && msg.startsWith('attendance.errors.')) {
    return i18n.t(msg);
  }
  return msg || i18n.t('attendance.errors.generic');
};

export const useTodayAttendance = (userId: string) =>
  useQuery({
    queryKey: ['attendanceToday', userId],
    queryFn: () => getTodayAttendance(userId),
  });

export const useCheckIn = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => checkIn(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceToday', userId] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory', userId] });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary', userId] });
      toast.success(i18n.t('attendance.toast.checkInSuccess'));
    },
    onError: (err: any) => toast.error(resolveError(err)),
  });
};

export const useCheckOut = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => checkOut(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceToday', userId] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory', userId] });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary', userId] });
      toast.success(i18n.t('attendance.toast.checkOutSuccess'));
    },
    onError: (err: any) => toast.error(resolveError(err)),
  });
};

export const useMyAttendanceHistory = (userId: string, monthKey: string) =>
  useQuery({
    queryKey: ['attendanceHistory', userId, monthKey],
    queryFn: () => getMyAttendanceHistory(userId, monthKey),
    enabled: !!monthKey,
  });

export const useMySummary = (userId: string, monthKey: string) =>
  useQuery({
    queryKey: ['attendanceSummary', userId, monthKey],
    queryFn: () => getMySummary(userId, monthKey),
    enabled: !!monthKey,
  });

export const useRealtimePresence = () =>
  useQuery({
    queryKey: ['attendanceRealtime'],
    queryFn: getRealtimePresence,
  });

export const useEmployeeAttendance = (monthKey: string) =>
  useQuery({
    queryKey: ['attendanceEmployee', monthKey],
    queryFn: () => getEmployeeAttendance(monthKey),
    enabled: !!monthKey,
  });

export const useCompanyMonthlyReport = (monthKey: string) =>
  useQuery({
    queryKey: ['attendanceCompany', monthKey],
    queryFn: () => getCompanyMonthlyReport(monthKey),
    enabled: !!monthKey,
  });

export const useEmployeeAttendanceLogs = (userId: string, monthKey: string, enabled = true) =>
  useQuery({
    queryKey: ['attendanceEmployeeLogs', userId, monthKey],
    queryFn: () => getEmployeeAttendanceLogs(userId, monthKey),
    enabled: !!userId && !!monthKey && enabled,
  });

export const useConfirmAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userIds, monthKey }: { userIds: string[]; monthKey: string }) =>
      confirmAttendance(userIds, monthKey),
    onSuccess: (_, { monthKey }) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceEmployee', monthKey] });
      queryClient.invalidateQueries({ queryKey: ['attendanceCompany', monthKey] });
      toast.success(i18n.t('attendance.bulk.confirmSuccess'));
    },
    onError: () => toast.error(i18n.t('attendance.bulk.confirmError')),
  });
};

export const useUpdateAttendanceLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      logId,
      check_in,
      check_out,
    }: {
      logId: string;
      check_in?: string | null;
      check_out?: string | null;
    }) => updateAttendanceLog(logId, { check_in, check_out }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceEmployeeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceEmployee'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceCompany'] });
      toast.success(i18n.t('attendance.form.updateSuccess'));
    },
    onError: (err: any) => toast.error(err?.message || i18n.t('attendance.form.updateError')),
  });
};

export const useAddAttendanceLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      dateStr,
      check_in,
      check_out,
    }: {
      userId: string;
      dateStr: string;
      check_in?: string | null;
      check_out?: string | null;
    }) => addOrUpdateAttendanceLog(userId, dateStr, { check_in, check_out }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceEmployeeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceEmployee'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceCompany'] });
      toast.success(i18n.t('attendance.form.updateSuccess'));
    },
    onError: (err: any) => toast.error(err?.message || i18n.t('attendance.form.updateError')),
  });
};

export const useDeleteAttendanceLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => deleteAttendanceLog(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceEmployeeLogs'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceEmployee'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceCompany'] });
      toast.success(i18n.t('attendance.form.deleteSuccess'));
    },
    onError: (err: any) => toast.error(err?.message || i18n.t('attendance.form.deleteError')),
  });
};
