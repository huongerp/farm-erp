/**
 * Giữ phiên đăng nhập thay cho `supabase.auth` (trước đây SDK tự lo việc này).
 *
 * Access token sống 15 phút, refresh token 30 ngày và được luân chuyển mỗi lần
 * làm mới (xem docs/vps-04-auth-schema.sql). Cả hai lưu trong localStorage —
 * giống cách Supabase làm, nên không đổi mức rủi ro so với trước.
 *
 * Ba việc dễ sai mà file này xử lý:
 *   1. Nhiều query song song cùng thấy token hết hạn → chỉ gọi /lam-moi MỘT lần
 *      (single-flight), không thì server nhận N request rotation và N-1 cái sau
 *      thất bại vì token đã bị đổi.
 *   2. Làm mới thất bại (phiên bị thu hồi, nhân viên nghỉ việc) → xoá phiên và
 *      báo cho app đăng xuất.
 *   3. Đăng xuất ở tab này thì tab khác cũng phải thoát → nghe event `storage`.
 */
import { AUTH_URL } from './api-config';

const KHOA_PHIEN = 'farm-erp.phien';

/** Làm mới sớm 60 giây để một request đang bay không rơi vào lúc token vừa hết hạn. */
const LE_LAM_MOI_MS = 60_000;

export type Phien = {
  access_token: string;
  /** Mốc hết hạn của access token, đơn vị ms (Date.now). */
  het_han_luc: number;
  refresh_token: string;
  email: string;
  nhan_vien_id: number;
  /**
   * Cờ buộc đổi mật khẩu, do endpoint đăng nhập trả về.
   *
   * Phải giữ ở client vì `authenticated` không có quyền SELECT cột
   * `phai_doi_mat_khau` (xem docs/vps-03-cleanup-after-restore.sql). Đây là lời
   * nhắc chứ không phải rào bảo mật — người dùng sửa localStorage là bỏ qua được.
   */
  phai_doi_mat_khau: boolean;
};

let phienTrongBoNho: Phien | null | undefined;
let dangLamMoi: Promise<Phien | null> | null = null;
const khiMatPhien = new Set<() => void>();

function docTuLocalStorage(): Phien | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KHOA_PHIEN);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Phien>;
    if (!p.access_token || !p.refresh_token || !p.email || !p.het_han_luc) return null;
    return p as Phien;
  } catch {
    return null;
  }
}

export function docPhien(): Phien | null {
  if (phienTrongBoNho === undefined) phienTrongBoNho = docTuLocalStorage();
  return phienTrongBoNho;
}

export function luuPhien(phien: Phien): void {
  phienTrongBoNho = phien;
  try {
    window.localStorage.setItem(KHOA_PHIEN, JSON.stringify(phien));
  } catch {
    /* chế độ riêng tư có thể chặn ghi — phiên vẫn dùng được trong bộ nhớ */
  }
}

export function xoaPhien(): void {
  phienTrongBoNho = null;
  try {
    window.localStorage.removeItem(KHOA_PHIEN);
  } catch {
    /* bỏ qua */
  }
}

/** Email của người đang đăng nhập, đọc từ phiên (không cần gọi API). */
export function emailPhienHienTai(): string | null {
  return docPhien()?.email ?? null;
}

export function nhanVienIdPhienHienTai(): number | null {
  return docPhien()?.nhan_vien_id ?? null;
}

export function phaiDoiMatKhau(): boolean {
  return docPhien()?.phai_doi_mat_khau ?? false;
}

/** Gọi sau khi người dùng đổi mật khẩu xong để thôi bắt đổi. */
export function xoaCoPhaiDoiMatKhau(): void {
  const phien = docPhien();
  if (phien?.phai_doi_mat_khau) luuPhien({ ...phien, phai_doi_mat_khau: false });
}

/** Đăng ký callback khi phiên mất hiệu lực để app đăng xuất và điều hướng. */
export function dangKyKhiMatPhien(cb: () => void): () => void {
  khiMatPhien.add(cb);
  return () => {
    khiMatPhien.delete(cb);
  };
}

function thongBaoMatPhien(): void {
  for (const cb of khiMatPhien) {
    try {
      cb();
    } catch (err) {
      console.error('[token-store] callback mất phiên lỗi', err);
    }
  }
}

export function phienDaMat(): void {
  xoaPhien();
  thongBaoMatPhien();
}

/**
 * Đổi refresh token lấy cặp token mới. Trả null nếu phiên không còn hợp lệ.
 * Không tự retry: refresh token đã luân chuyển thì gọi lại cũng vô nghĩa.
 */
async function goiLamMoi(refreshToken: string): Promise<Phien | null> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}/lam-moi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch {
    // Mất mạng: KHÔNG xoá phiên, để lần gọi sau thử lại.
    return null;
  }

  if (!res.ok) {
    phienDaMat();
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    email: string;
    nhan_vien_id: number;
  };

  const phien: Phien = {
    access_token: data.access_token,
    het_han_luc: Date.now() + data.expires_in * 1000,
    refresh_token: data.refresh_token,
    email: data.email,
    nhan_vien_id: data.nhan_vien_id,
    // /lam-moi không trả cờ này, giữ lại giá trị đang có để F5 không mất
    // luồng bắt đổi mật khẩu.
    phai_doi_mat_khau: docPhien()?.phai_doi_mat_khau ?? false,
  };
  luuPhien(phien);
  return phien;
}

/**
 * Access token còn hiệu lực, tự làm mới nếu cần. Null = chưa đăng nhập.
 */
export async function layAccessToken(): Promise<string | null> {
  const phien = docPhien();
  if (!phien) return null;

  if (Date.now() < phien.het_han_luc - LE_LAM_MOI_MS) {
    return phien.access_token;
  }

  // Single-flight: mọi caller cùng chờ một lần gọi /lam-moi.
  dangLamMoi ??= goiLamMoi(phien.refresh_token).finally(() => {
    dangLamMoi = null;
  });

  return (await dangLamMoi)?.access_token ?? null;
}

/** Buộc làm mới — dùng khi PostgREST trả 401 dù token trông vẫn còn hạn. */
export async function lamMoiNgay(): Promise<string | null> {
  const phien = docPhien();
  if (!phien) return null;
  dangLamMoi ??= goiLamMoi(phien.refresh_token).finally(() => {
    dangLamMoi = null;
  });
  return (await dangLamMoi)?.access_token ?? null;
}

// Đăng xuất ở tab khác → tab này cũng thoát. Không có phần này thì tab cũ vẫn
// hiển thị dữ liệu và bắn request bằng token đã bị thu hồi.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KHOA_PHIEN) return;
    phienTrongBoNho = docTuLocalStorage();
    if (!phienTrongBoNho) thongBaoMatPhien();
  });
}
