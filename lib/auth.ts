import { db } from './db';
import { AUTH_URL } from './api-config';
import { setMatKhauHash } from './mat-khau';
import { tatTuChonGoogle } from './google-signin';
import {
  docPhien,
  emailPhienHienTai,
  layAccessToken,
  luuPhien,
  nhanVienIdPhienHienTai,
  phaiDoiMatKhau,
  xoaCoPhaiDoiMatKhau,
  xoaPhien,
} from './token-store';
import type { User } from '../types';
import type { Employee } from '../features/he-thong/nhan-vien/core/types';
import { getEmployeeByEmail, normalizeChiNhanhIdsFromRow } from '../features/he-thong/nhan-vien/services/nhan-vien-service';
import { TRANG_THAI_NV, type TrangThaiNV } from './constants';
import type { ModulePermission, ActionType } from '../features/he-thong/phan-quyen/core/types';
import type { CurrentRoleContextData } from '../features/he-thong/phan-quyen/services/phan-quyen-service';
import { getModuleName } from '../features/he-thong/phan-quyen/services/phan-quyen-service';
import type { CompanyInfoPayload } from '../features/he-thong/thong-tin-cong-ty/services/thong-tin-cong-ty-service';

/** Ném khi nhân viên `trang_thai === Nghỉ việc` — UI map sang i18n `page.login.accountLocked`. */
export class ResignedEmployeeAuthError extends Error {
  constructor() {
    super('ResignedEmployeeAuth');
    this.name = 'ResignedEmployeeAuthError';
  }
}

/** Sai email/mật khẩu. Không phân biệt "email không tồn tại" để khỏi tiết lộ email nào có trong hệ thống. */
export class WrongCredentialsError extends Error {
  constructor() {
    super('WrongCredentials');
    this.name = 'WrongCredentialsError';
  }
}

/** Quá 10 lần sai trong 15 phút — bị chặn tạm (chống dò mật khẩu). */
export class TooManyAttemptsError extends Error {
  constructor() {
    super('TooManyAttempts');
    this.name = 'TooManyAttemptsError';
  }
}

/** Email Google hợp lệ nhưng không có hồ sơ nhân viên nào trùng. */
export class GoogleNoEmployeeError extends Error {
  constructor() {
    super('GoogleNoEmployee');
    this.name = 'GoogleNoEmployeeError';
  }
}

/** Phản hồi của auth-service khi tạo phiên thành công. */
type PhanHoiDangNhap = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  email: string;
  nhan_vien_id: number;
  phai_doi_mat_khau: boolean;
};

/**
 * Gọi auth-service và đổi `ly_do` thành lỗi có kiểu để UI hiển thị đúng thông báo.
 */
async function goiAuth(duongDan: string, body: unknown): Promise<PhanHoiDangNhap> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}${duongDan}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Không kết nối được tới máy chủ xác thực. Kiểm tra kết nối mạng.');
  }

  if (res.ok) return (await res.json()) as PhanHoiDangNhap;

  const lyDo = await res
    .json()
    .then((j: { ly_do?: string }) => j?.ly_do ?? '')
    .catch(() => '');

  switch (lyDo) {
    case 'sai_thong_tin':
      throw new WrongCredentialsError();
    case 'bi_chan':
      throw new TooManyAttemptsError();
    case 'nghi_viec':
      throw new ResignedEmployeeAuthError();
    case 'khong_co_ho_so':
      throw new GoogleNoEmployeeError();
    case 'google_khong_hop_le':
      throw new Error('Không xác minh được tài khoản Google. Thử lại.');
    case 'google_chua_cau_hinh':
      throw new Error('Đăng nhập Google chưa được cấu hình trên máy chủ.');
    default:
      throw new Error(`Đăng nhập thất bại (HTTP ${res.status}).`);
  }
}

function luuPhienTuPhanHoi(res: PhanHoiDangNhap): void {
  luuPhien({
    access_token: res.access_token,
    het_han_luc: Date.now() + res.expires_in * 1000,
    refresh_token: res.refresh_token,
    email: res.email,
    nhan_vien_id: res.nhan_vien_id,
    phai_doi_mat_khau: res.phai_doi_mat_khau,
  });
}

/**
 * Nhân viên bị chuyển sang Nghỉ việc trong lúc đang có phiên: server đã thu hồi
 * refresh token (trigger trong docs/vps-04-auth-schema.sql), nhưng access token
 * cũ còn hạn tới 15 phút nên vẫn phải chặn ở client.
 */
async function resolveEmployeeOrSignOutIfResigned(
  employee: Employee | null
): Promise<{ employee: Employee | null; lockoutReason: 'resigned' | null }> {
  if (employee?.trang_thai === TRANG_THAI_NV.NGHI_VIEC) {
    await signOut();
    return { employee: null, lockoutReason: 'resigned' };
  }
  return { employee, lockoutReason: null };
}

/**
 * Chuyển bản ghi nhân viên (fp_var_nhan_vien) sang User để lưu store.
 * App nhận diện user bằng email so với Supabase Auth; sau đăng nhập lưu id, ho_va_ten, phong_ban_id, chuc_vu_id, id_chi_nhanh (chi nhánh mặc định = phần tử đầu của chi_nhanh_ids), cap_bac.
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
    id_chi_nhanh: emp.id_chi_nhanh?.[0] ?? null,
    cap_bac: emp.cap_bac ?? (emp.id_cap_bac != null ? Number(emp.id_cap_bac) : null),
  };
}

/** Kết quả đăng nhập: hồ sơ nhân viên + có phải bắt đổi mật khẩu ngay không. */
export type KetQuaDangNhap = {
  employee: Employee;
  phaiDoiMatKhau: boolean;
};

/** Sau khi có phiên, lấy hồ sơ nhân viên theo email và chặn nếu đã nghỉ việc. */
async function layHoSoSauDangNhap(email: string): Promise<KetQuaDangNhap> {
  let employee: Employee | null;
  try {
    employee = await getEmployeeByEmail(email);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    throw new Error(msg || 'Không thể tải hồ sơ nhân viên.', { cause: e });
  }

  if (!employee) {
    // Server đã đối chiếu email với fp_var_nhan_vien trước khi cấp token, nên
    // tới đây mà rỗng thì gần như chắc là RLS/quyền đọc, không phải thiếu dòng.
    throw new Error(
      `Không đọc được hồ sơ nhân viên của "${email}" dù đăng nhập thành công. ` +
        'Kiểm tra policy SELECT cho role `authenticated` trên fp_var_nhan_vien.'
    );
  }

  const gated = await resolveEmployeeOrSignOutIfResigned(employee);
  if (gated.lockoutReason === 'resigned') throw new ResignedEmployeeAuthError();
  return { employee: gated.employee!, phaiDoiMatKhau: phaiDoiMatKhau() };
}

/**
 * Đăng nhập bằng email/mật khẩu qua auth-service, rồi lấy nhân viên theo email.
 * Mật khẩu được kiểm bằng bcrypt trong Postgres (`rpc_verify_mat_khau`).
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<KetQuaDangNhap> {
  const res = await goiAuth('/dang-nhap', { email: email.trim(), mat_khau: password });
  luuPhienTuPhanHoi(res);
  return layHoSoSauDangNhap(res.email);
}

/**
 * Đăng nhập bằng ID token của Google (lấy từ nút GIS — xem lib/google-signin.ts).
 * Chữ ký RS256 được xác minh ở auth-service, không phải ở đây.
 */
export async function signInWithGoogleIdToken(idToken: string): Promise<KetQuaDangNhap> {
  const res = await goiAuth('/dang-nhap-google', { id_token: idToken });
  luuPhienTuPhanHoi(res);
  return layHoSoSauDangNhap(res.email);
}

/** Đăng xuất: thu hồi phiên phía server rồi xoá token ở máy. */
export async function signOut(): Promise<void> {
  const refreshToken = docPhien()?.refresh_token;
  xoaPhien();
  tatTuChonGoogle();
  if (!refreshToken) return;
  try {
    await fetch(`${AUTH_URL}/dang-xuat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Mất mạng: token ở máy đã xoá nên người dùng vẫn thoát được. Phiên phía
    // server sẽ tự hết hạn.
  }
}

/**
 * Kiểm tra phiên hiện tại: nếu token còn hiệu lực thì lấy nhân viên theo email.
 * Dùng khi load app để khôi phục trạng thái đăng nhập.
 */
export async function getSessionEmployee(): Promise<Employee | null> {
  if (!(await layAccessToken())) return null;
  const email = emailPhienHienTai();
  if (!email) return null;

  const employee = await getEmployeeByEmail(email);
  const gated = await resolveEmployeeOrSignOutIfResigned(employee);
  return gated.employee;
}

/**
 * Đổi mật khẩu của chính người đang đăng nhập.
 *
 * Ghi qua `rpc_set_mat_khau` (bcrypt server-side). Tự đổi thì các phiên khác
 * KHÔNG bị thu hồi — chỉ khi admin đặt lại mật khẩu cho người khác mới cắt phiên
 * (xem docs/vps-04-auth-schema.sql).
 */
export async function changeOwnPassword(newPassword: string): Promise<void> {
  const nhanVienId = nhanVienIdPhienHienTai();
  if (!nhanVienId) throw new Error('Chưa đăng nhập.');
  await setMatKhauHash(nhanVienId, newPassword);
  xoaCoPhaiDoiMatKhau();
}

/**
 * Đổi mật khẩu của chính mình NHƯNG bắt nhập đúng mật khẩu hiện tại trước.
 *
 * `rpc_verify_mat_khau` cố ý không grant cho role `authenticated`
 * (docs/vps-03-cleanup-after-restore.sql), nên cách xác minh duy nhất từ trình
 * duyệt là gọi lại chính endpoint đăng nhập: sai mật khẩu → `WrongCredentialsError`
 * và dính luôn cơ chế chặn thử sai của auth-service. Phiên mới trả về được lưu
 * đè lên phiên cũ để không bỏ rơi cặp token vừa cấp.
 */
export async function changeOwnPasswordVerified(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const email = emailPhienHienTai();
  if (!email) throw new Error('Chưa đăng nhập.');

  const res = await goiAuth('/dang-nhap', { email, mat_khau: currentPassword });
  luuPhienTuPhanHoi(res);

  await changeOwnPassword(newPassword);
}

/**
 * Bootstrap phiên trong 1 request duy nhất (RPC `rpc_get_session_bootstrap`).
 *
 * Thay cho chuỗi: `getEmployeeByEmail` + `prefetch getCurrentRoleContext` (×2 request
 * song song: fp_var_phan_quyen + fp_var_chuc_vu) + `useCompanyInfo` (fp_var_tt_cong_ty).
 * Mỗi F5 trước kia = 3–5 request, nay chỉ còn 1 request JSON tổng hợp.
 *
 * Trả về cả dữ liệu đã "pha" sẵn cho React Query để caller dùng `setQueryData` mà không
 * cần gọi lại các query khác.
 */
export interface SessionBootstrap {
  employee: Employee | null;
  roleContext: CurrentRoleContextData | null;
  company: CompanyInfoPayload | null;
  /** Có khi nhân viên trùng email đang ở trạng thái Nghỉ việc — phiên Auth đã bị xóa. */
  lockoutReason?: 'resigned';
}

/** Chuẩn hoá bản ghi nhân viên trả về từ RPC (JSONB) — chỉ có các cột cần cho auth/guard. */
function bootstrapEmployeeFromRpc(row: Record<string, unknown> | null): Employee | null {
  if (!row) return null;
  return {
    id: String(row.id),
    ma_nhan_vien: 'NV' + String(row.id),
    ho_ten: (row.ho_va_ten as string) ?? '',
    email: (row.email as string) ?? '',
    so_dien_thoai: (row.so_dien_thoai as string) ?? '',
    id_phong_ban: row.phong_ban_id != null ? String(row.phong_ban_id) : null,
    id_chuc_vu: row.chuc_vu_id != null ? String(row.chuc_vu_id) : null,
    id_chi_nhanh: normalizeChiNhanhIdsFromRow(row.chi_nhanh_ids),
    ten_phong_ban: (row.ten_phong_ban as string) ?? undefined,
    ten_chuc_vu: (row.ten_chuc_vu as string) ?? undefined,
    ten_chi_nhanh: (row.ten_chi_nhanh as string) ?? undefined,
    ten_cap_bac: (row.ten_cap_bac as string) ?? undefined,
    id_cap_bac: row.cap_bac_id != null ? String(row.cap_bac_id) : null,
    cap_bac: row.cap_bac != null ? Number(row.cap_bac) : undefined,
    gioi_tinh: ((row.gioi_tinh as string) as 'Nam' | 'Nữ' | 'Khác') ?? 'Khác',
    trang_thai: (row.trang_thai as TrangThaiNV) ?? TRANG_THAI_NV.DANG_LAM_VIEC,
    ngay_vao_lam: (row.ngay_vao_lam as string) ?? '',
    // Avatar chỉ lấy URL (Supabase Storage) — không kéo base64 trong bootstrap.
    anh_dai_dien: (row.hinh_anh_url as string) ?? undefined,
  };
}

function bootstrapCompanyFromRpc(row: Record<string, unknown> | null): CompanyInfoPayload | null {
  if (!row) return null;
  return {
    appName: (row.ten_ung_dung as string) ?? '',
    appDescription: (row.mo_ta as string) ?? '',
    appLogo: (row.logo as string) ?? null,
    companyName: (row.ten_cong_ty as string) ?? '',
    taxId: (row.ma_so_thue as string) ?? '',
    address: (row.dia_chi as string) ?? '',
    phone: (row.so_dien_thoai as string) ?? '',
    email: (row.email as string) ?? '',
    website: (row.trang_web as string) ?? '',
  };
}

/**
 * Gọi RPC gom bootstrap. Fallback: nếu RPC không tồn tại/không có quyền, rơi về
 * `getSessionEmployee()` truyền thống để app không gãy.
 */
export async function getSessionBootstrap(): Promise<SessionBootstrap> {
  // Gọi trước để token được làm mới nếu cần — nếu phiên đã mất thì email cũng bị xoá.
  if (!(await layAccessToken())) return { employee: null, roleContext: null, company: null };
  const email = emailPhienHienTai();
  if (!email) return { employee: null, roleContext: null, company: null };

  try {
    const { data, error } = await db.rpc('rpc_get_session_bootstrap', {
      p_email: email.trim(),
    });
    if (error) throw error;
    const payload = data as {
      employee: Record<string, unknown> | null;
      chuc_vu: { id: number; tt: number | null } | null;
      phan_quyen: Array<{ module_id: string; actions?: string[] }> | null;
      company: Record<string, unknown> | null;
    } | null;

    let employee = bootstrapEmployeeFromRpc(payload?.employee ?? null);
    const gated = await resolveEmployeeOrSignOutIfResigned(employee);
    if (gated.lockoutReason === 'resigned') {
      return { employee: null, roleContext: null, company: null, lockoutReason: 'resigned' };
    }
    employee = gated.employee;
    const company = bootstrapCompanyFromRpc(payload?.company ?? null);
    const roleContext: CurrentRoleContextData | null = employee
      ? {
          quyenHan: (payload?.phan_quyen ?? []).map((r) => ({
            module_id: r.module_id,
            module_name: getModuleName(r.module_id),
            actions: (r.actions ?? []) as ActionType[],
          })) as ModulePermission[],
          thuTuChucVu:
            payload?.chuc_vu?.tt != null && !Number.isNaN(Number(payload.chuc_vu.tt))
              ? Number(payload.chuc_vu.tt)
              : 999,
        }
      : null;
    return { employee, roleContext, company };
  } catch {
    // RPC chưa được tạo hoặc quyền chưa cấp → fallback request truyền thống để app không gãy.
    const employee = await getEmployeeByEmail(email);
    const gated = await resolveEmployeeOrSignOutIfResigned(employee);
    if (gated.lockoutReason === 'resigned') {
      return { employee: null, roleContext: null, company: null, lockoutReason: 'resigned' };
    }
    return { employee: gated.employee, roleContext: null, company: null };
  }
}

// Không còn "quên mật khẩu qua email": self-host không có dịch vụ gửi mail. Admin
// đặt lại mật khẩu trên trang Nhân viên, kèm cờ phai_doi_mat_khau để buộc người
// dùng đổi ở lần đăng nhập kế tiếp. Xem docs/VPS_POSTGREST_PLAN.md.
