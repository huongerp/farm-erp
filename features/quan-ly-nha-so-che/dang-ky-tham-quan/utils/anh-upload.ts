import { uploadAnh } from '../../../../lib/media-upload';

export { MAX_ANH_PHIEU, imageItemsToUrls, urlsToImageItems } from '../../dang-ky-nhan-hang/utils/anh-upload';

/** Lưu ảnh (phiếu giấy đã ký, ảnh đoàn…) lên kho ảnh trên VPS (services/media). */
export const uploadAnhDangKyThamQuan = (file: File) => uploadAnh(file, 'dang-ky-tham-quan');
