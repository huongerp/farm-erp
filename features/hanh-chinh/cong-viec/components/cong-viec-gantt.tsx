import React, { useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import EmptyState from '../../../../components/shared/EmptyState';
import type { CongViec } from '../core/types';

const ROW_HEIGHT = 40;
const LABEL_WIDTH = 220;
const PX_PER_DAY = 24;
const MIN_BAR_PX = 8;

interface Props {
  data: CongViec[];
  onView: (item: CongViec) => void;
}

function getRange(data: CongViec[]): { minStart: dayjs.Dayjs; maxEnd: dayjs.Dayjs; days: number } {
  if (data.length === 0) {
    const minStart = dayjs().startOf('month');
    const maxEnd = dayjs().add(1, 'month').endOf('month');
    return { minStart, maxEnd, days: maxEnd.diff(minStart, 'day') + 1 };
  }
  let minStart = dayjs(data[0].tg_tao);
  let maxEnd = dayjs(data[0].ngay_het_han);
  for (const item of data) {
    const s = dayjs(item.tg_tao);
    const e = dayjs(item.ngay_het_han);
    if (s.isBefore(minStart)) minStart = s;
    if (e.isAfter(maxEnd)) maxEnd = e;
  }
  const days = maxEnd.diff(minStart, 'day') + 1;
  return { minStart, maxEnd, days };
}

function getBarStyle(
  tgTao: string,
  ngayHetHan: string,
  minStart: dayjs.Dayjs,
  pxPerDay: number
): { left: number; width: number } {
  const start = dayjs(tgTao);
  const end = dayjs(ngayHetHan);
  const left = Math.max(0, start.diff(minStart, 'day') * pxPerDay);
  const width = Math.max(MIN_BAR_PX, end.diff(start, 'day') * pxPerDay);
  return { left, width };
}

const CongViecGantt: React.FC<Props> = ({ data, onView }) => {
  const { t } = useTranslation();
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const { minStart, maxEnd, days } = useMemo(() => getRange(data), [data]);
  const timelineWidth = Math.max(days * PX_PER_DAY, 400);
  const dayLabels = useMemo(() => {
    const labels: { date: dayjs.Dayjs; isWeekend: boolean }[] = [];
    let d = minStart.startOf('day');
    while (!d.isAfter(maxEnd)) {
      labels.push({ date: d, isWeekend: d.day() === 0 || d.day() === 6 });
      d = d.add(1, 'day');
    }
    return labels;
  }, [minStart, maxEnd]);

  const syncHeaderToBody = useCallback(() => {
    if (syncingRef.current || !headerScrollRef.current || !bodyScrollRef.current) return;
    syncingRef.current = true;
    headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  const syncBodyToHeader = useCallback(() => {
    if (syncingRef.current || !headerScrollRef.current || !bodyScrollRef.current) return;
    syncingRef.current = true;
    bodyScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden border border-border rounded-lg bg-card">
      <div className="flex shrink-0 border-b border-border bg-muted/50">
        <div
          className="shrink-0 border-r border-border py-2 px-3 text-xs font-medium text-muted-foreground bg-muted/50"
          style={{ width: LABEL_WIDTH }}
        >
          {t('congViec.tabs.list')}
        </div>
        <div
          ref={headerScrollRef}
          onScroll={syncBodyToHeader}
          className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar"
          style={{ minWidth: 0 }}
        >
          <div
            className="flex h-8 min-w-full"
            style={{ width: timelineWidth }}
          >
            {dayLabels.map(({ date, isWeekend }) => (
              <div
                key={date.valueOf()}
                className={`shrink-0 border-r border-border/50 text-center text-xs text-muted-foreground flex items-center justify-center ${isWeekend ? 'bg-muted/30' : ''}`}
                style={{ width: PX_PER_DAY }}
              >
                {date.date()}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        ref={bodyScrollRef}
        onScroll={syncHeaderToBody}
        className="flex-1 min-h-0 overflow-auto custom-scrollbar"
      >
        <div style={{ minWidth: LABEL_WIDTH + timelineWidth, width: LABEL_WIDTH + timelineWidth }}>
          {data.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <EmptyState title={t('congViec.empty')} description={t('congViec.emptyHint')} />
            </div>
          ) : (
            data.map((item) => {
              const { left, width } = getBarStyle(
                item.tg_tao,
                item.ngay_het_han ?? item.tg_tao,
                minStart,
                PX_PER_DAY
              );
              return (
                <div
                  key={item.id}
                  className="flex border-b border-border/50 hover:bg-muted/30 cursor-pointer group"
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => onView(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onView(item);
                    }
                  }}
                >
                  <div
                    className="shrink-0 border-r border-border/50 py-1.5 px-2 flex flex-col justify-center truncate sticky left-0 z-[1] bg-card group-hover:bg-muted/30"
                    style={{ width: LABEL_WIDTH }}
                  >
                    <span className="text-xs font-medium truncate" title={item.tieu_de}>
                      {item.ma_cong_viec}
                    </span>
                    <span className="text-xs text-muted-foreground truncate" title={item.tieu_de}>
                      {item.tieu_de}
                    </span>
                  </div>
                  <div
                    className="relative flex-1 min-w-0"
                    style={{ width: timelineWidth }}
                  >
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-6 rounded bg-primary/80 group-hover:bg-primary"
                      style={{ left, width, minWidth: MIN_BAR_PX }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CongViecGantt;
