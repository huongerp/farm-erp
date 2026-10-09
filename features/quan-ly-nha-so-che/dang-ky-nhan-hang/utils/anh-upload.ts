import type { ImageItem } from '../../../../components/ui/MultiImageInput';
import { uploadAnh } from '../../../../lib/media-upload';

export const MAX_ANH_PHIEU = 20;

export function urlsToImageItems(urls: string[]): ImageItem[] {
  return urls.map((src) => ({ id: src, src }));
}

export function imageItemsToUrls(items: ImageItem[]): string[] {
  return items.map((i) => i.src).filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
}

/** Lưu ảnh lên kho ảnh trên VPS (services/media). */
export const uploadAnhDangKyNhanHang = (file: File) => uploadAnh(file, 'dang-ky-nhan-hang');
