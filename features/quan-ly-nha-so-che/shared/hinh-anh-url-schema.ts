import { z } from 'zod';

/** URL https hoặc data URL ảnh (fallback khi chưa cấu hình Cloudinary). */
export const hinhAnhUrlItemSchema = z
  .string()
  .min(1)
  .refine(
    (raw) => {
      const s = raw.trim();
      if (s.startsWith('data:image/')) return s.length <= 8_000_000;
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
