import type { ImageItem } from '../../../../components/ui/MultiImageInput';
import { uploadAnh } from '../../../../lib/media-upload';

export const MAX_ANH_THUNG = 6;

/** Giới hạn ảnh gốc (trước khi nén) — ảnh điện thoại thường 3–8 MB. */
export const MAX_MB_ANH_GOC = 15;

/** Lưu lên kho ảnh trên VPS (services/media) — uploadAnh tự nén trước khi gửi. */
export function uploadAnhThung(file: File): Promise<string> {
  return uploadAnh(file, 'giam-sat-chat-luong');
}

export function urlsToImageItems(urls: string[]): ImageItem[] {
  return urls.map((src) => ({ id: src, src }));
}

export function imageItemsToUrls(items: ImageItem[]): string[] {
  return items.map((i) => i.src).filter((s) => s.trim().length > 0);
}
