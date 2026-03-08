import { supabase, fetchAllRows } from '../../../../lib/supabase';
import type { LoginDevice } from '../core/types';
import type { Session } from '@supabase/supabase-js';
import type { Employee } from '../../nhan-vien/core/types';
import { parseUserAgent } from '../utils/parse-user-agent';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG, type TrangThaiHoatDong } from '../../../../lib/constants';

const TABLE = 'fp_var_login_devices';

function normalizeTrangThai(val: unknown): TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return Number(val) === 0 ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

/**
 * Lấy session_id từ JWT access_token (claim session_id trong payload).
 * Supabase Session không có .id; session_id nằm trong JWT.
 */
function getSessionIdFromToken(accessToken: string): string | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64)) as { session_id?: string };
    return decoded.session_id ?? null;
  } catch {
    return null;
  }
}

function rowToLoginDevice(row: Record<string, unknown>, currentSessionId: string | null): LoginDevice {
  const id = String(row.id);
  return {
    id,
    id_user: String(row.user_id ?? ''),
    ten_user: String(row.ten_user ?? ''),
    email_user: String(row.email_user ?? ''),
    ten_thiet_bi: String(row.ten_thiet_bi ?? ''),
    loai_thiet_bi: (row.loai_thiet_bi as LoginDevice['loai_thiet_bi']) ?? 'desktop',
    trinh_duyet: String(row.trinh_duyet ?? ''),
    he_dieu_hanh: String(row.he_dieu_hanh ?? ''),
    dia_chi_ip: String(row.dia_chi_ip ?? ''),
    tg_dang_nhap_cuoi: row.tg_dang_nhap_cuoi ? new Date(row.tg_dang_nhap_cuoi as string).toISOString() : '',
    la_thiet_bi_hien_tai: currentSessionId != null && id === currentSessionId,
    trang_thai: normalizeTrangThai(row.trang_thai),
    tg_tao: row.tg_tao ? new Date(row.tg_tao as string).toISOString() : undefined,
    tg_cap_nhat: row.tg_cap_nhat ? new Date(row.tg_cap_nhat as string).toISOString() : undefined,
  };
}

/**
 * Đồng bộ thiết bị hiện tại lên fp_var_login_devices (gọi khi đã đăng nhập, ví dụ sau useAuthSync).
 * Upsert theo session.id; cập nhật tg_dang_nhap_cuoi và thông tin thiết bị từ User-Agent.
 */
export async function upsertCurrentLoginDevice(session: Session, employee: Employee): Promise<void> {
  const sessionId = getSessionIdFromToken(session.access_token);
  if (!sessionId) {
    console.warn('[LoginDevice] Cannot get session_id from JWT, skip upsert');
    return;
  }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const { ten_thiet_bi, loai_thiet_bi, trinh_duyet, he_dieu_hanh } = parseUserAgent(ua);
  const now = new Date().toISOString();
  const row = {
    id: sessionId,
    user_id: session.user.id,
    email_user: session.user.email ?? employee.email ?? '',
    ten_user: employee.ho_ten ?? session.user.user_metadata?.full_name ?? '',
    ten_thiet_bi,
    loai_thiet_bi,
    trinh_duyet,
    he_dieu_hanh,
    dia_chi_ip: null as string | null,
    tg_dang_nhap_cuoi: now,
    trang_thai: 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  const { error } = await supabase
    .from(TABLE)
    .upsert(row, { onConflict: 'id', ignoreDuplicates: false });
  if (error) {
    console.warn('[LoginDevice] upsert current device failed:', error.message);
  }
}

export async function getLoginDevices(): Promise<LoginDevice[]> {
  const { data: { session } } = await supabase.auth.getSession();
  const currentSessionId = session ? getSessionIdFromToken(session.access_token) : null;
  const data = await fetchAllRows<Record<string, unknown>>((from, to) =>
    supabase.from(TABLE).select('*').order('tg_dang_nhap_cuoi', { ascending: false }).range(from, to)
  );
  return data.map((row) => rowToLoginDevice(row, currentSessionId));
}

/**
 * Đăng xuất thiết bị từ xa: gọi RPC revoke_session (xóa trong auth.sessions) rồi đánh dấu trang_thai = 0 trong bảng.
 */
export async function logoutDevice(id: string): Promise<LoginDevice> {
  const { error: rpcError } = await supabase.rpc('revoke_session', { p_session_id: id });
  if (rpcError) {
    throw new Error(rpcError.message ?? i18n.t('loginDevices.service.notFound'));
  }
  const { data: updated, error: updateError } = await supabase
    .from(TABLE)
    .update({ trang_thai: TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG, tg_cap_nhat: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (updateError) {
    throw new Error(updateError.message ?? i18n.t('loginDevices.service.notFound'));
  }
  return rowToLoginDevice(updated as Record<string, unknown>, null);
}

export async function logoutDevices(ids: string[]): Promise<LoginDevice[]> {
  const result: LoginDevice[] = [];
  for (const id of ids) {
    try {
      const device = await logoutDevice(id);
      result.push(device);
    } catch {
      // Bỏ qua nếu session đã hết hạn hoặc không thuộc user
    }
  }
  return result;
}
