/**
 * Upload ảnh lên Cloudinary (public, unsigned preset).
 * Cần cấu hình: VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.
 * Trong Cloudinary Dashboard: Settings → Upload → Add upload preset → Signing Mode: Unsigned.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
}

/**
 * Upload file ảnh lên Cloudinary, trả về URL public (secure_url).
 * @param file File ảnh
 * @param folder Thư mục trên Cloudinary (optional, ví dụ: "farm-erp/hang-hoa")
 */
export async function uploadImageToCloudinary(
  file: File,
  folder?: string
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Thiếu cấu hình Cloudinary: VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET. Tạo Upload preset (unsigned) trong Cloudinary Dashboard.'
    );
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Chỉ chấp nhận file ảnh.');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (folder?.trim()) {
    formData.append('folder', folder.trim());
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message || response.statusText;
    if (msg.toLowerCase().includes('preset') || response.status === 400) {
      throw new Error(
        `Cloudinary: "${msg}". Kiểm tra Dashboard → Settings → Upload → Upload presets: tạo preset Unsigned và ghi đúng tên vào .env (VITE_CLOUDINARY_UPLOAD_PRESET). Tên phân biệt hoa thường.`
      );
    }
    throw new Error(`Cloudinary: ${msg}`);
  }

  const result = (await response.json()) as CloudinaryUploadResult;
  if (!result.secure_url) {
    throw new Error('Cloudinary không trả về URL ảnh.');
  }
  return result.secure_url;
}
