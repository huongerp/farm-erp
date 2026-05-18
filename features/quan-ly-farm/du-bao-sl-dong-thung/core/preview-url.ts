/** URL trang in phiếu dự báo SL đóng thùng (tab mới từ detail). */
export function getDuBaoSlDongThungPreviewUrl(id: string): string {
  return `/quan-ly-farm/du-bao-sl-dong-thung/preview/${encodeURIComponent(id)}`;
}
