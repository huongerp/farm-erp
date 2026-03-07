import { AttendanceLog, AttendanceSummary, AttendanceTodayState, EmployeeAttendanceRow, RealtimePresenceRow } from '../core/types';
import { MOCK_EMPLOYEES, MOCK_BRANCHES } from '@/mocks/he-thong';
import { getPayrollWifiIps } from '../../thiet-lap-cong-luong/services/payroll-wifi-ip-service';
import { createAdminFormSystem } from '../../phieu-hanh-chinh/services/admin-form-service';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const attendanceByMonth = new Map<string, AttendanceLog[]>();

const pad = (n: number) => String(n).padStart(2, '0');
const toDateString = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toMonthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
const minutesToTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

const getBranchSchedule = (branchId?: string | null) => {
  const branch = MOCK_BRANCHES.find((b) => b.id === branchId);
  return {
    checkInStart: branch?.gio_vao_sang ?? '08:00',
    checkInEnd: minutesToTime(toMinutes(branch?.gio_vao_sang ?? '08:00') + 60),
    checkOutStart: branch?.gio_ra_chieu ?? '17:00',
    checkOutEnd: minutesToTime(toMinutes(branch?.gio_ra_chieu ?? '17:00') + 60),
  };
};

/** Tạo hash nhẹ từ chuỗi để random ổn định theo (empId, dateStr) */
const simpleHash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
};

const generateMonthLogs = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const logs: AttendanceLog[] = [];
  const today = toDateString(new Date());

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month - 1, day);
    const dateStr = toDateString(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) continue;

    MOCK_EMPLOYEES.forEach((emp, idx) => {
      const schedule = getBranchSchedule(emp.id_chi_nhanh);
      const baseIn = toMinutes(schedule.checkInStart) + (idx % 4) * 5;
      const baseOut = toMinutes(schedule.checkOutStart) + (idx % 3) * 15;
      const seed = simpleHash(`${emp.id}-${dateStr}`);
      const shouldLate = (seed % 5) === 0 || (idx % 4 === 0);
      const shouldMissing = false;
      const shouldEarlyLeave = false;
      const checkIn = shouldLate ? baseIn + 15 + (seed % 20) : baseIn;
      const checkOut = shouldEarlyLeave ? baseOut - 30 - (seed % 60) : baseOut;

      let log: AttendanceLog = {
        id: `att-${emp.id}-${dateStr}`,
        user_id: emp.id,
        user_name: emp.ho_ten,
        department_id: emp.id_phong_ban ?? null,
        department_name: emp.ten_phong_ban ?? null,
        branch_id: emp.id_chi_nhanh ?? null,
        branch_name: emp.ten_chi_nhanh ?? null,
        date: dateStr,
        check_in: shouldMissing ? null : minutesToTime(checkIn),
        check_out: shouldMissing || shouldEarlyLeave ? null : minutesToTime(checkOut),
        ip_address: shouldMissing ? null : '192.168.1.100',
        is_late: !shouldMissing && checkIn > toMinutes(schedule.checkInStart),
      };

      if (dateStr === today) {
        if (idx % 4 === 0) {
          log = { ...log, check_in: null, check_out: null, is_late: false };
        } else if (idx % 4 === 1) {
          log = { ...log, check_in: minutesToTime(baseIn), check_out: null, is_late: false };
        } else if (idx % 4 === 2) {
          log = { ...log, check_in: minutesToTime(baseIn + 5), check_out: null, is_late: true };
        }
      }

      logs.push(log);
    });
  }

  attendanceByMonth.set(monthKey, logs);
};

/** Pre-generate data cho 3 tháng gần nhất để test */
const prewarmMonths = () => {
  const now = new Date();
  for (let i = -2; i <= 0; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = toMonthKey(d);
    if (!attendanceByMonth.has(key)) generateMonthLogs(key);
  }
};

const ensureMonthLogs = (monthKey: string) => {
  prewarmMonths();
  if (!attendanceByMonth.has(monthKey)) {
    generateMonthLogs(monthKey);
  }
};

const getCurrentIp = async () => {
  const wifiIps = await getPayrollWifiIps();
  return wifiIps.find((ip) => ip.trang_thai === 1)?.ip_wifi ?? '0.0.0.0';
};

const isValidWifi = async (currentIp: string) => {
  const wifiIps = await getPayrollWifiIps();
  return wifiIps.some((ip) => ip.trang_thai === 1 && ip.ip_wifi === currentIp);
};

const findLog = (userId: string, dateStr: string) => {
  const monthKey = dateStr.slice(0, 7);
  ensureMonthLogs(monthKey);
  const list = attendanceByMonth.get(monthKey)!;
  let log = list.find((l) => l.user_id === userId && l.date === dateStr);
  if (!log) {
    const emp = MOCK_EMPLOYEES.find((e) => e.id === userId);
    log = {
      id: `att-${userId}-${dateStr}`,
      user_id: userId,
      user_name: emp?.ho_ten ?? 'Unknown',
      department_id: emp?.id_phong_ban ?? null,
      department_name: emp?.ten_phong_ban ?? null,
      branch_id: emp?.id_chi_nhanh ?? null,
      branch_name: emp?.ten_chi_nhanh ?? null,
      date: dateStr,
      check_in: null,
      check_out: null,
      ip_address: null,
      is_late: false,
    };
    list.push(log);
  }
  return log;
};

export const getTodayAttendance = async (userId: string): Promise<AttendanceTodayState> => {
  await delay(300);
  const now = new Date();
  const dateStr = toDateString(now);
  const log = findLog(userId, dateStr);
  const schedule = getBranchSchedule(log.branch_id);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const canCheckIn = !log.check_in && currentMinutes >= toMinutes(schedule.checkInStart) && currentMinutes <= toMinutes(schedule.checkInEnd);
  const canCheckOut = !!log.check_in && !log.check_out && currentMinutes >= toMinutes(schedule.checkOutStart) && currentMinutes <= toMinutes(schedule.checkOutEnd);
  const currentIp = await getCurrentIp();
  return {
    user_id: userId,
    date: dateStr,
    current_ip: currentIp,
    can_check_in: canCheckIn,
    can_check_out: canCheckOut,
    check_in: log.check_in,
    check_out: log.check_out,
    is_late: log.is_late,
  };
};

export const checkIn = async (userId: string): Promise<AttendanceTodayState> => {
  await delay(500);
  const now = new Date();
  const dateStr = toDateString(now);
  const log = findLog(userId, dateStr);
  const currentIp = await getCurrentIp();
  if (!(await isValidWifi(currentIp))) {
    throw new Error('attendance.errors.invalidWifi');
  }
  const schedule = getBranchSchedule(log.branch_id);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const inStart = toMinutes(schedule.checkInStart);
  const inEnd = toMinutes(schedule.checkInEnd);
  if (currentMinutes < inStart || currentMinutes > inEnd) {
    throw new Error('attendance.errors.invalidCheckInTime');
  }
  log.check_in = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  log.ip_address = currentIp;
  log.is_late = currentMinutes > inStart;
  if (log.is_late) {
    await createAdminFormSystem({
      userId,
      date: dateStr,
      shift: 'morning',
      reason: `Check-in muộn lúc ${log.check_in}`,
    });
  }
  return getTodayAttendance(userId);
};

export const checkOut = async (userId: string): Promise<AttendanceTodayState> => {
  await delay(500);
  const now = new Date();
  const dateStr = toDateString(now);
  const log = findLog(userId, dateStr);
  const currentIp = await getCurrentIp();
  if (!(await isValidWifi(currentIp))) {
    throw new Error('attendance.errors.invalidWifi');
  }
  const schedule = getBranchSchedule(log.branch_id);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const outStart = toMinutes(schedule.checkOutStart);
  const outEnd = toMinutes(schedule.checkOutEnd);
  if (currentMinutes < outStart || currentMinutes > outEnd) {
    throw new Error('attendance.errors.invalidCheckOutTime');
  }
  log.check_out = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  log.ip_address = currentIp;
  return getTodayAttendance(userId);
};

export const getMyAttendanceHistory = async (userId: string, monthKey: string): Promise<AttendanceLog[]> => {
  await delay(400);
  ensureMonthLogs(monthKey);
  return (attendanceByMonth.get(monthKey) ?? []).filter((l) => l.user_id === userId);
};

export const getMySummary = async (userId: string, monthKey: string): Promise<AttendanceSummary> => {
  await delay(300);
  const logs = await getMyAttendanceHistory(userId, monthKey);
  let totalMinutes = 0;
  let lateCount = 0;
  let totalDays = 0;
  logs.forEach((l) => {
    if (l.check_in) totalDays += 1;
    if (l.check_in && l.check_out) {
      totalMinutes += Math.max(0, toMinutes(l.check_out) - toMinutes(l.check_in));
    }
    if (l.is_late) lateCount += 1;
  });
  return {
    total_days: totalDays,
    total_hours: Math.round((totalMinutes / 60) * 10) / 10,
    late_count: lateCount,
  };
};

export const getRealtimePresence = async (): Promise<RealtimePresenceRow[]> => {
  await delay(300);
  const today = toDateString(new Date());
  const monthKey = today.slice(0, 7);
  ensureMonthLogs(monthKey);
  const list = attendanceByMonth.get(monthKey) ?? [];
  const todayLogs = list.filter((l) => l.date === today);
  return todayLogs.map((l) => ({
    user_id: l.user_id,
    user_name: l.user_name,
    department_name: l.department_name ?? null,
    branch_name: l.branch_name ?? null,
    check_in: l.check_in ?? null,
    status: l.check_in ? (l.check_out ? 'checked_out' : 'present') : 'absent',
  }));
};

export const getEmployeeAttendance = async (monthKey: string): Promise<EmployeeAttendanceRow[]> => {
  await delay(400);
  ensureMonthLogs(monthKey);
  const list = attendanceByMonth.get(monthKey) ?? [];
  const byUser = new Map<string, EmployeeAttendanceRow>();
  list.forEach((l) => {
    if (!byUser.has(l.user_id)) {
      byUser.set(l.user_id, {
        user_id: l.user_id,
        user_name: l.user_name,
        department_name: l.department_name ?? null,
        branch_name: l.branch_name ?? null,
        total_days: 0,
        total_hours: 0,
        late_count: 0,
      });
    }
    const row = byUser.get(l.user_id)!;
    if (l.check_in) row.total_days += 1;
    if (l.check_in && l.check_out) {
      row.total_hours += Math.max(0, toMinutes(l.check_out) - toMinutes(l.check_in)) / 60;
    }
    if (l.is_late) row.late_count += 1;
  });
  return Array.from(byUser.values()).map((r) => ({
    ...r,
    total_hours: Math.round(r.total_hours * 10) / 10,
  }));
};

export const getCompanyMonthlyReport = async (monthKey: string): Promise<EmployeeAttendanceRow[]> => {
  return getEmployeeAttendance(monthKey);
};

/** Lấy chi tiết chấm công theo ngày của một nhân viên (dùng cho modal duyệt) */
export const getEmployeeAttendanceLogs = async (userId: string, monthKey: string): Promise<AttendanceLog[]> => {
  return getMyAttendanceHistory(userId, monthKey);
};

/** Xác nhận công (mock - dùng cho chốt công tháng, tính lương) */
export const confirmAttendance = async (userIds: string[], monthKey: string): Promise<void> => {
  await delay(400);
  // Mock: ghi nhận đã xác nhận, thực tế sẽ gọi API
};

/** Thêm/cập nhật bản ghi chấm công (admin) */
export const addOrUpdateAttendanceLog = async (
  userId: string,
  dateStr: string,
  payload: { check_in?: string | null; check_out?: string | null }
): Promise<AttendanceLog> => {
  const log = findLog(userId, dateStr);
  return updateAttendanceLog(log.id, payload);
};

/** Cập nhật bản ghi chấm công (admin chỉnh sửa) */
export const updateAttendanceLog = async (
  logId: string,
  payload: { check_in?: string | null; check_out?: string | null }
): Promise<AttendanceLog> => {
  await delay(400);
  const parts = logId.split('-');
  const monthKey = parts.length >= 4 ? `${parts[parts.length - 3]}-${parts[parts.length - 2]}` : '';
  if (!monthKey) throw new Error('attendance.errors.logNotFound');
  ensureMonthLogs(monthKey);
  const list = attendanceByMonth.get(monthKey) ?? [];
  const log = list.find((l) => l.id === logId);
  if (!log) throw new Error('attendance.errors.logNotFound');
  if (payload.check_in !== undefined) log.check_in = payload.check_in;
  if (payload.check_out !== undefined) log.check_out = payload.check_out;
  const schedule = getBranchSchedule(log.branch_id);
  log.is_late = !!(log.check_in && toMinutes(log.check_in) > toMinutes(schedule.checkInStart));
  return { ...log };
};

/** Xóa bản ghi chấm công */
export const deleteAttendanceLog = async (logId: string): Promise<void> => {
  await delay(300);
  const parts = logId.split('-');
  const monthKey = parts.length >= 4 ? `${parts[parts.length - 3]}-${parts[parts.length - 2]}` : '';
  if (!monthKey) throw new Error('attendance.errors.logNotFound');
  ensureMonthLogs(monthKey);
  const list = attendanceByMonth.get(monthKey)!;
  const idx = list.findIndex((l) => l.id === logId);
  if (idx === -1) throw new Error('attendance.errors.logNotFound');
  list.splice(idx, 1);
};

/** Lấy 1 bản ghi chấm công theo id */
export const getAttendanceLogById = async (logId: string): Promise<AttendanceLog | null> => {
  const parts = logId.split('-');
  if (parts.length < 4) return null;
  const dateParts = parts.slice(-3);
  const monthKey = `${dateParts[0]}-${dateParts[1]}`;
  ensureMonthLogs(monthKey);
  const list = attendanceByMonth.get(monthKey) ?? [];
  return list.find((l) => l.id === logId) ?? null;
};
