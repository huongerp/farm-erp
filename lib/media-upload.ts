/**
 * Tải ảnh lên service media trên VPS (`/media/*`, services/media) — thay Cloudinary.
 * Nén ở trình duyệt trước (đỡ tốn 4G), service còn chuẩn hoá lại lần nữa (xoay EXIF,
 * bỏ GPS, cạnh dài 1600px). Trả về đường dẫn TƯƠNG ĐỐI `/media/f/...` để lưu vào DB.
 */
import { MEDIA_URL } from './api-config';
import { nenAnh } from './nen-anh';
import { layAccessToken } from './token-store';

/** Phải khớp THU_MUC_HOP_LE của services/media/src/core/duong-dan.ts. */
export type ThuMucAnh =
  | 'hang-hoa'
  | 'tai-san'
  | 'nhan-vien'
  | 'hop-dong'
  | 'dang-ky-nhan-hang'
  | 'dang-ky-tham-quan'
  | 'bao-cao-nhan-cong'
  | 'giam-sat-chat-luong'
  | 'cong-ty';

export async function uploadAnh(file: File, thuMuc: ThuMucAnh): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Chỉ chấp nhận file ảnh.');
  const form = new FormData();
  form.append('thu_muc', thuMuc);
  form.append('file', await nenAnh(file));
  const token = await layAccessToken();
  let res: Response;
  try {
    res = await fetch(`${MEDIA_URL}/upload`, {
      method: 'POST',
      body: form,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error('Không kết nối được máy chủ ảnh. Kiểm tra mạng rồi thử lại.');
  }
  const json = (await res.json().catch(() => ({}))) as { url?: unknown; thongDiep?: unknown };
  if (!res.ok || typeof json.url !== 'string') {
    throw new Error(typeof json.thongDiep === 'string' ? json.thongDiep : `Tải ảnh lên thất bại (mã ${res.status}).`);
  }
  return json.url;
}

/** Đường dẫn ảnh tương đối → tuyệt đối, cho file xuất ra ngoài app (Word/HTML tải về). */
export function urlAnhTuyetDoi(src: string): string {
  if (!src.startsWith('/')) return src;
  try {
    return new URL(src, window.location.origin).href;
  } catch {
    return src;
  }
}
