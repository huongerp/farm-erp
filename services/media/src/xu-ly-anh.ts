/**
 * Chuẩn hoá ảnh trước khi lưu: xoay theo EXIF, thu cạnh dài về CANH_MAX, bỏ metadata
 * (vị trí GPS trong ảnh chụp điện thoại), PNG nếu có nền trong suốt, còn lại JPEG.
 */
import sharp from 'sharp';
import { chonDinhDang, type DinhDangLuu } from './core/duong-dan.ts';

export const CANH_MAX = 1600;

export class KhongPhaiAnhLoi extends Error {}

export async function chuanHoaAnh(input: Buffer): Promise<{ data: Buffer; duoi: DinhDangLuu }> {
  let meta: sharp.Metadata;
  try {
    meta = await sharp(input, { failOn: 'error' }).metadata();
  } catch {
    throw new KhongPhaiAnhLoi('File gửi lên không phải ảnh hợp lệ.');
  }
  const duoi = chonDinhDang(Boolean(meta.hasAlpha));
  const anh = sharp(input, { failOn: 'error' })
    .rotate()
    .resize({ width: CANH_MAX, height: CANH_MAX, fit: 'inside', withoutEnlargement: true });
  const data =
    duoi === 'png'
      ? await anh.png({ compressionLevel: 9, palette: true }).toBuffer()
      : await anh.flatten({ background: '#ffffff' }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return { data, duoi };
}
