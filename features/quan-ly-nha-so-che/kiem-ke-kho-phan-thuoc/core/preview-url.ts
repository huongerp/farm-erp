/** Đường dẫn trang in phiếu kiểm kê phân thuốc (route khai ở App.tsx). */
export const getPhieuKiemKePTPreviewUrl = (id: string) =>
  `/quan-ly-nha-so-che/kiem-ke-kho-phan-thuoc/preview/${encodeURIComponent(id)}`;

/** Phiếu kho phân thuốc sinh ra khi điều chỉnh tồn. */
export const getPhieuKhoPTPreviewUrl = (id: string) =>
  `/quan-ly-nha-so-che/phieu-kho-phan-thuoc/preview/${encodeURIComponent(id)}`;
