/** URL trang in báo cáo sơ chế (tab mới từ detail). */
export function getBaoCaoSoChePreviewUrl(id: string): string {
  return `/quan-ly-farm/bao-cao-so-che/preview/${encodeURIComponent(id)}`;
}
