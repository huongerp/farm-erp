import React from 'react';

export interface BcscMetricListItem {
  key: string;
  stt: number;
  label: string;
  value: React.ReactNode;
  /** ĐVT hiện ngay sau giá trị. */
  dvt?: string;
  /** Ghi chú theo dòng — rỗng hoặc "—" thì ẩn. */
  ghiChu?: string | null;
  /** `value` là ô nhập (NumberInput) → cho độ rộng cố định. */
  input?: boolean;
}

function hasNote(s: string | null | undefined): s is string {
  const v = s?.trim();
  return !!v && v !== '—';
}

/** Danh sách chỉ số dọc cho điện thoại (thay bảng TT / Chỉ số / Giá trị / ĐVT / Ghi chú). */
const BcscMetricListMobile: React.FC<{ items: BcscMetricListItem[] }> = ({ items }) => (
  <ul className="divide-y divide-border/70">
    {items.map((it) => (
      <li key={it.key} className="py-2 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex gap-2">
            <span className="mt-0.5 text-xs text-muted-foreground tabular-nums shrink-0">{it.stt}.</span>
            <span className="text-sm text-foreground leading-snug">{it.label}</span>
          </div>
          <div className={it.input ? 'w-32 shrink-0' : 'shrink-0 text-right'}>
            {it.input ? (
              it.value
            ) : (
              <>
                <span className="text-sm font-semibold tabular-nums">{it.value}</span>
                {it.dvt ? <span className="ml-1 text-xs text-muted-foreground">{it.dvt}</span> : null}
              </>
            )}
          </div>
        </div>
        {it.input && it.dvt ? <p className="text-xs text-muted-foreground text-right">{it.dvt}</p> : null}
        {hasNote(it.ghiChu) ? (
          <p className="pl-5 text-xs text-muted-foreground leading-snug whitespace-pre-wrap">{it.ghiChu.trim()}</p>
        ) : null}
      </li>
    ))}
  </ul>
);

export default BcscMetricListMobile;
