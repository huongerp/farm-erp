import type { ImageItem } from '../../../../components/ui/MultiImageInput';
import { uploadImageToCloudinary } from '../../../../lib/cloudinary';
import { nenAnh } from '../../../../lib/nen-anh';

/** Chưa cấu hình Cloudinary thì ẩn chọn ảnh — không để MultiImageInput lưu base64 vào DB. */
export const CLOUDINARY_READY =
  Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) && Boolean(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

export const MAX_ANH_THUNG = 6;

/** Giới hạn ảnh gốc (trước khi nén) — ảnh điện thoại thường 3–8 MB. */
export const MAX_MB_ANH_GOC = 15;

export async function uploadAnhThung(file: File): Promise<string> {
  return uploadImageToCloudinary(await nenAnh(file), 'farm-erp/giam-sat-chat-luong');
}

export function urlsToImageItems(urls: string[]): ImageItem[] {
  return urls.map((src) => ({ id: src, src }));
}

export function imageItemsToUrls(items: ImageItem[]): string[] {
  return items.map((i) => i.src).filter((s) => s.trim().length > 0);
}
