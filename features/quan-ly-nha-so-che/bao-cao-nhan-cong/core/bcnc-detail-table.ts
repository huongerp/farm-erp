/** Class viền dọc & độ rộng cột bảng chuyền — detail / form / dòng con dùng chung. */

export const bcncTableClass = 'w-full text-sm min-w-[70rem] table-fixed';

export const bcncColTt = 'w-14 min-w-14 max-w-14 shrink-0';
export const bcncColChuyen = 'w-[13.5rem] min-w-[12rem] max-w-[15rem]';
export const bcncColNum = 'w-[3.35rem] min-w-[3rem] max-w-[3.75rem]';
export const bcncColQuyDoi = 'w-[3.85rem] min-w-[3.5rem] max-w-[4.25rem]';
export const bcncColTongGio = 'w-[4rem] min-w-[3.75rem] max-w-[4.5rem]';
export const bcncColGhiChu = 'w-[11rem] min-w-[7rem] max-w-[14rem]';

export const bcncThGroup =
  'border-r border-border/70 last:border-r-0';

export const bcncThSub =
  'border-r border-border/50 last:border-r-0';

/** Dòng chuyền / IV / tổng */
export const bcncTrMain = 'border-b border-border/80 font-semibold text-foreground';

/** Dòng chi tiết con */
export const bcncTrSub = 'border-b border-border/40 bg-muted/25 text-muted-foreground';

export const bcncTdTt =
  `${bcncColTt} px-1 py-1.5 text-center border-r border-border/50 align-middle`;

export const bcncTdChuyen =
  `${bcncColChuyen} px-2 py-1.5 border-r border-border/50 align-middle`;

export const bcncTdNum =
  `${bcncColNum} px-1 py-1.5 text-right text-sm tabular-nums border-r border-border/50 align-middle`;

export const bcncTdMainNum = `${bcncTdNum} font-semibold`;

export const bcncTdQuyDoi =
  `${bcncColQuyDoi} px-1 py-1.5 text-right text-sm tabular-nums border-r border-border/50 align-middle bg-primary/[0.06] dark:bg-primary/10 font-bold text-primary`;

export const bcncTdTongGio =
  `${bcncColTongGio} px-1 py-1.5 text-right text-sm tabular-nums border-r border-border/50 align-middle bg-primary/[0.08] dark:bg-primary/12 font-bold text-primary`;

export const bcncTdTongGioTc = bcncTdTongGio;

export const bcncTdGhiChu = `${bcncColGhiChu} px-2 py-1.5 align-top`;

export const bcncTdSubNum =
  `${bcncColNum} px-1 py-1 text-right text-xs tabular-nums border-r border-border/40 text-muted-foreground align-middle`;

export const bcncTdSubLabel =
  'w-[4.5rem] min-w-[4rem] max-w-[5rem] px-1.5 py-1 text-caption leading-tight text-muted-foreground border-r border-border/40 align-middle';

export const bcncTdSubDash =
  `${bcncColQuyDoi} px-1 py-1 text-center text-xs text-muted-foreground/70 border-r border-border/40 align-middle bg-muted/10`;

export const bcncTdSubHighlightDash =
  `${bcncColTongGio} px-1 py-1 text-center text-xs text-muted-foreground/70 border-r border-border/40 align-middle bg-muted/10`;

/** Ô nhập số trên dòng chi tiết (form). */
export const bcncTdInput =
  `${bcncColNum} px-0.5 py-0.5 text-right border-r border-border/50 align-middle bg-muted/20`;

/**
 * Cố định 2 cột trái (STT + Chuyền) khi cuộn ngang. STT rộng 3.5rem (w-14) nên Chuyền `left-14`.
 * Ô sticky PHẢI có nền đặc (không dùng bg-xxx/10) — dùng color-mix trộn lên bg-card.
 */
export const bcncScrollWrapClass =
  'overflow-x-auto rounded-lg border border-border [container-type:inline-size]';

export const bcncStickyTt = 'sticky left-0 z-10';
export const bcncStickyChuyen =
  'sticky left-14 z-10 shadow-[2px_0_0_0_hsl(var(--border))]';
export const bcncStickyHeadZ = 'z-20';

/** Nền đặc theo loại dòng (khớp màu trong suốt cũ). Viết literal để Tailwind quét được. */
export const bcncBgHead = 'bg-[color-mix(in_srgb,hsl(var(--muted))_50%,hsl(var(--card)))]';
export const bcncBgMain = 'bg-card';
export const bcncBgExpanded = 'bg-[color-mix(in_srgb,hsl(var(--primary))_3%,hsl(var(--card)))]';
export const bcncBgSub = 'bg-[color-mix(in_srgb,hsl(var(--muted))_25%,hsl(var(--card)))]';
export const bcncBgIv =
  'bg-[color-mix(in_srgb,hsl(var(--primary))_10%,hsl(var(--card)))] dark:bg-[color-mix(in_srgb,hsl(var(--primary))_15%,hsl(var(--card)))]';
export const bcncBgTong =
  'bg-[color-mix(in_srgb,hsl(var(--primary))_15%,hsl(var(--card)))] dark:bg-[color-mix(in_srgb,hsl(var(--primary))_20%,hsl(var(--card)))]';

/** Panel mở rộng (danh sách nhân sự): dính trái, rộng bằng vùng nhìn thấy → không bị cuộn khỏi màn hình. */
export const bcncExpandPanelClass = 'sticky left-0 w-[100cqw] min-w-0';
/** Ô «Tổng ngày» gộp 2 cột (STT + Chuyền) — dính trái từ mép. */
export const bcncStickyTong = 'sticky left-0 z-10 shadow-[2px_0_0_0_hsl(var(--border))]';
