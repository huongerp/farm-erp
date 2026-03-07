/**
 * Trả về class Tailwind cho badge trạng thái ứng viên (màu ổn định theo id).
 */
const BADGE_VARIANTS = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  'bg-muted/80 text-muted-foreground border-border',
] as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return Math.abs(h);
}

export function getTrangThaiBadgeClass(idTrangThai: string): string {
  if (!idTrangThai) return BADGE_VARIANTS[5];
  const index = hashId(idTrangThai) % (BADGE_VARIANTS.length - 1);
  return BADGE_VARIANTS[index];
}

/** Màu badge nguồn tuyển dụng (ổn định theo id). */
export function getNguonBadgeClass(idKenh: string): string {
  if (!idKenh) return BADGE_VARIANTS[5];
  const index = hashId('nguon-' + idKenh) % (BADGE_VARIANTS.length - 1);
  return BADGE_VARIANTS[index];
}

export const TRANG_THAI_BADGE_BASE =
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border';
