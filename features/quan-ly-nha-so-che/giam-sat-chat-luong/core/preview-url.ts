/** URL trang in phiếu giám sát chất lượng (route trong App.tsx). */
export function taoUrlInPhieu(id: string): string {
  return `/quan-ly-nha-so-che/giam-sat-chat-luong/preview/${encodeURIComponent(id)}`;
}
