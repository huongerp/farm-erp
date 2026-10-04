/** URL trang in phiếu bảo trì / sửa chữa (tab mới từ drawer chi tiết). */
export function getPhieuBaoTriPreviewUrl(id: string): string {
  return `/hanh-chinh/chi-phi-tai-san/preview/${encodeURIComponent(id)}`;
}
