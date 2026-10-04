/**
 * Mã hoá token Google trước khi ghi DB (AES-256-GCM). Lộ bảng `fp_var_google_ket_noi`
 * (backup rò, SQL tay) cũng không dùng được token khi không có `SHEETS_TOKEN_KEY`.
 *
 * Định dạng: `v1:<base64(iv 12 byte | tag 16 byte | ciphertext)>` — tiền tố phiên
 * bản để sau này đổi thuật toán vẫn đọc được bản cũ.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const PHIEN_BAN = 'v1:';

export function maHoa(banRo: string, khoa: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', khoa, iv);
  const ct = Buffer.concat([cipher.update(banRo, 'utf8'), cipher.final()]);
  return PHIEN_BAN + Buffer.concat([iv, cipher.getAuthTag(), ct]).toString('base64');
}

/** Sai khoá / dữ liệu bị sửa → ném lỗi (GCM kiểm tag), không trả rác. */
export function giaiMa(banMa: string, khoa: Buffer): string {
  if (!banMa.startsWith(PHIEN_BAN)) throw new Error('Token mã hoá không đúng định dạng.');
  const buf = Buffer.from(banMa.slice(PHIEN_BAN.length), 'base64');
  if (buf.length < 29) throw new Error('Token mã hoá bị cắt cụt.');
  const decipher = createDecipheriv('aes-256-gcm', khoa, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}
