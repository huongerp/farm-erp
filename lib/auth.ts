import { supabase } from './supabase';
import type { User } from '../types';
import type { Employee } from '../features/he-thong/nhan-vien/core/types';
import { getEmployeeByEmail } from '../features/he-thong/nhan-vien/services/nhan-vien-service';

/**
 * Chuyển bản ghi nhân viên (fp_var_nhan_vien) sang User để lưu store.
 * App nhận diện user bằng email so với Supabase Auth; sau đăng nhập lưu id, ho_va_ten, phong_ban_id, chuc_vu_id, chi_nhanh_id, cap_bac.
 */
export function employeeToUser(emp: Employee): User {
  return {
    id: String(emp.id),
    email: emp.email,
    full_name: emp.ho_ten,
    ho_va_ten: emp.ho_ten,
    avatar_url: emp.anh_dai_dien ?? undefined,
    role: 'admin',
    created_at: new Date().toISOString(),
    id_phong_ban: emp.id_phong_ban ?? null,
    id_chuc_vu: emp.id_chuc_vu ?? null,
    id_chi_nhanh: emp.id_chi_nhanh ?? null,
    cap_bac: emp.cap_bac ?? (emp.id_cap_bac != null ? Number(emp.id_cap_bac) : null),
  };
}

/**
 * Đăng nhập bằng email/password (Supabase Auth), sau đó lấy nhân viên theo email từ fp_var_nhan_vien.
 * Trả về Employee nếu thành công; throw nếu sai mật khẩu hoặc không tìm thấy nhân viên.
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<Employee> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (authError) throw new Error(authError.message);
  const authEmail = authData?.user?.email;
  if (!authEmail) throw new Error('Không lấy được email từ phiên đăng nhập.');

  let employee: Employee | null = null;
  try {
    employee = await getEmployeeByEmail(authEmail);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    throw new Error(msg || 'Không thể tải hồ sơ nhân viên.');
  }
  if (!employee) {
    throw new Error(
      'Không tìm thấy hồ sơ nhân viên với email này. Kiểm tra: (1) Bảng fp_var_nhan_vien có dòng nào với cột email = "' +
        authEmail +
        '" không; (2) RLS: nếu bảng bật Row Level Security thì cần policy cho phép user đã đăng nhập được SELECT (xem docs hoặc chạy policy mẫu trong Supabase SQL Editor).'
    );
  }

  return employee;
}

/**
 * Đăng xuất: xóa phiên Supabase Auth.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Kiểm tra phiên hiện tại: nếu có user Auth thì lấy nhân viên theo email.
 * Dùng khi load app để khôi phục trạng thái đăng nhập.
 */
export async function getSessionEmployee(): Promise<Employee | null> {
  const { data: { session } } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (!email) return null;

  return getEmployeeByEmail(email);
}

/** Gửi email đặt lại mật khẩu (Supabase Auth). User nhận link và mở trang /dat-lai-mat-khau để đổi mật khẩu. */
export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/dat-lai-mat-khau`
      : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });
  if (error) throw new Error(error.message);
}

/** Đặt lại mật khẩu (sau khi user mở link từ email trên trang /dat-lai-mat-khau). */
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

/**
 * Đăng nhập bằng Google (Supabase OAuth).
 * Chuyển hướng sang Google, sau khi đăng nhập xong redirect về redirectTo (mặc định: trang chủ).
 * Khi quay lại app, useAuthSync sẽ gọi getSessionEmployee() và đăng nhập nếu có hồ sơ nhân viên trùng email.
 * Cần bật Google provider trong Supabase Dashboard và thêm redirect URL vào allow list.
 */
export async function signInWithGoogle(): Promise<void> {
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw new Error(error.message);
}
