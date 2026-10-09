import { khoPreviewUrl, type KhoBienThe } from '../../kho-bien-the/bien-the';

/** Đường dẫn trang in phiếu kiểm kê (route khai ở App.tsx, theo submenu của biến thể). */
export const getPhieuKiemKePTPreviewUrl = (bt: KhoBienThe, id: string) =>
  khoPreviewUrl(bt, 'kiem-ke-kho-phan-thuoc', id);

/** Phiếu kho sinh ra khi điều chỉnh tồn. */
export const getPhieuKhoPTPreviewUrl = (bt: KhoBienThe, id: string) => khoPreviewUrl(bt, 'phieu-kho-phan-thuoc', id);
