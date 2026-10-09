import { z } from 'zod';

/** Đường dẫn ảnh do service media trên VPS trả về (lib/media-upload.ts). */
const LA_ANH_VPS = /^\/media\/f\/[a-z0-9-]+\/\d{4}\/\d{2}\/[0-9a-f]{32}\.(jpg|png)$/;

/**
 * Ảnh lưu trên VPS (`/media/f/...`) hoặc URL http(s) cũ. KHÔNG nhận base64 `data:` nữa —
 * ảnh base64 trong DB từng chiếm ~200 MB (đã chuyển hết về VPS bằng scripts/chuyen-anh-ve-vps.sh).
 */
export const hinhAnhUrlItemSchema = z
  .string()
  .min(1)
  .refine(
    (raw) => {
      const s = raw.trim();
      if (LA_ANH_VPS.test(s)) return true;
      try {
        const u = new URL(s);
        return u.protocol === 'https:' || u.protocol === 'http:';
      } catch {
        return false;
      }
    },
    { message: 'invalid_image_url' }
  );

export const hinhAnhUrlsSchema = z.array(hinhAnhUrlItemSchema).max(20).default([]);
