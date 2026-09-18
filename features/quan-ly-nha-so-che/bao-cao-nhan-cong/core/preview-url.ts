/** URL trang in báo cáo nhân công (tab mới từ detail). */
export function getBaoCaoNhanCongPreviewUrl(id: string): string {
  return `/quan-ly-nha-so-che/bao-cao-nhan-cong/preview/${encodeURIComponent(id)}`;
}
