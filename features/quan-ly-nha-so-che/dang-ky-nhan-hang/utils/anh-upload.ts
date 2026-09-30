import type { ImageItem } from '../../../../components/ui/MultiImageInput';
import { uploadImageToCloudinary } from '../../../../lib/cloudinary';

export const CLOUDINARY_READY =
  Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) && Boolean(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

export const MAX_ANH_PHIEU = 20;

export function urlsToImageItems(urls: string[]): ImageItem[] {
  return urls.map((src) => ({ id: src, src }));
}

export function imageItemsToUrls(items: ImageItem[]): string[] {
  return items.map((i) => i.src).filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
}

/** Upload Cloudinary; chưa cấu hình thì MultiImageInput tự fallback base64. */
export const uploadAnhDangKyNhanHang = CLOUDINARY_READY
  ? (file: File) => uploadImageToCloudinary(file, 'farm-erp/dang-ky-nhan-hang')
  : undefined;
