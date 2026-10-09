/**
 * Nén ảnh trước khi upload: thu cạnh dài về `canhMax` px rồi xuất JPEG. Ảnh điện thoại
 * (4000px, 3–8 MB) còn ~200–400 KB — up nhanh qua 4G và đỡ dung lượng lưu trữ.
 */

export interface TuyChonNenAnh {
  /** Cạnh dài tối đa (px). */
  canhMax?: number;
  /** Chất lượng JPEG 0–1. */
  chatLuong?: number;
}

/** Kích thước sau khi thu nhỏ giữ tỉ lệ; ảnh đã nhỏ hơn `canhMax` thì giữ nguyên. */
export function kichThuocNen(rong: number, cao: number, canhMax: number): { rong: number; cao: number } {
  const dai = Math.max(rong, cao);
  if (dai <= canhMax || dai <= 0) return { rong, cao };
  const k = canhMax / dai;
  return { rong: Math.max(1, Math.round(rong * k)), cao: Math.max(1, Math.round(cao * k)) };
}

/**
 * Trình duyệt không hỗ trợ (thiếu createImageBitmap / canvas) hoặc nén ra file lớn hơn
 * bản gốc → trả lại file gốc. Ảnh GIF giữ nguyên (nén mất chuyển động).
 */
export async function nenAnh(file: File, { canhMax = 1600, chatLuong = 0.8 }: TuyChonNenAnh = {}): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || typeof createImageBitmap !== 'function') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }
  try {
    const { rong, cao } = kichThuocNen(bitmap.width, bitmap.height, canhMax);
    const canvas = document.createElement('canvas');
    canvas.width = rong;
    canvas.height = cao;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, rong, cao);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', chatLuong));
    if (!blob || blob.size >= file.size) return file;
    const ten = file.name.replace(/\.[^.]+$/, '') || 'anh';
    return new File([blob], `${ten}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}
