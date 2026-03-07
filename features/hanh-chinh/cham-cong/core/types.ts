export interface AttendanceLog {
  id: string;
  user_id: string;
  user_name: string;
  department_id?: string | null;
  department_name?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  date: string; // YYYY-MM-DD
  check_in?: string | null; // HH:mm
  check_out?: string | null; // HH:mm
  ip_address?: string | null;
  is_late: boolean;
}

export interface AttendanceTodayState {
  user_id: string;
  date: string;
  current_ip: string;
  can_check_in: boolean;
  can_check_out: boolean;
  check_in?: string | null;
  check_out?: string | null;
  is_late: boolean;
}

export interface AttendanceSummary {
  total_days: number;
  total_hours: number;
  late_count: number;
}

export interface RealtimePresenceRow {
  user_id: string;
  user_name: string;
  department_name?: string | null;
  branch_name?: string | null;
  check_in?: string | null;
  status: 'present' | 'absent' | 'checked_out';
}

export interface EmployeeAttendanceRow {
  user_id: string;
  user_name: string;
  department_name?: string | null;
  branch_name?: string | null;
  total_days: number;
  total_hours: number;
  late_count: number;
}
