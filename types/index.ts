export interface User {
  id: string;
  email: string;
  full_name?: string;
  /** Tên đầy đủ nhân viên (ho_va_ten từ fp_var_nhan_vien) */
  ho_va_ten?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  created_at: string;
  /** Id phòng ban (phong_ban_id từ fp_var_nhan_vien) */
  id_phong_ban?: string | null;
  /** Id chức vụ (chuc_vu_id từ fp_var_nhan_vien) */
  id_chuc_vu?: string | null;
  /** Id chi nhánh (chi_nhanh_id từ fp_var_nhan_vien) */
  id_chi_nhanh?: string | null;
  /** Cấp bậc số (cap_bac từ fp_var_nhan_vien) */
  cap_bac?: number | null;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isLoading?: boolean;
}

export interface ProfileFormValues {
  fullName: string;
  email: string;
  bio?: string;
}

/** In-app notification (bell dropdown list) */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: NotificationType;
  read: boolean;
  createdAt: string; // ISO
  link?: string; // optional route or URL
}

export * from './crud';