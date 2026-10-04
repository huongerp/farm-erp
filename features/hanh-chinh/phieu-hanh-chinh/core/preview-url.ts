/** URL trang in phiếu hành chính (tab mới từ drawer chi tiết). */
export function getPhieuHanhChinhPreviewUrl(id: string): string {
  return `/hanh-chinh/phieu-hanh-chinh/preview/${encodeURIComponent(id)}`;
}
