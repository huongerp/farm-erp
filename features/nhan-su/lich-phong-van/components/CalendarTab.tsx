import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarDays } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
import { useLichPhongVans } from '../hooks/use-lich-phong-van';
import type { LichPhongVan } from '../core/types';
import { cn } from '../../../../lib/utils';

interface CalendarTabProps {
  onViewDetail?: (item: LichPhongVan) => void;
}

/** Monday = 1 .. Sunday = 0 for header order (Mon–Sun) */
const WEEKDAYS_MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

/** Màu ô lịch theo trạng thái: 0 Chờ, 1 Đã diễn ra, 2 Hoãn, 3 Hủy */
const TRANG_THAI_EVENT_CLASS: Record<number, string> = {
  0: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25',
  1: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
  2: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/25',
  3: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/25',
};

function normalizeNgayToKey(ngay: string): string {
  if (!ngay || typeof ngay !== 'string') return '';
  const d = dayjs(ngay);
  if (d.isValid()) return d.format('YYYY-MM-DD');
  const iso = ngay.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : ngay;
}

const CalendarTab: React.FC<CalendarTabProps> = ({ onViewDetail }) => {
  const { t, i18n } = useTranslation();
  const { data: list = [], isLoading } = useLichPhongVans();
  const [viewDate, setViewDate] = useState(() => dayjs());

  useEffect(() => {
    const lang = i18n.language?.startsWith('en') ? 'en' : 'vi';
    dayjs.locale(lang);
  }, [i18n.language]);

  const yearMonth = viewDate.format('YYYY-MM');
  const todayKey = dayjs().format('YYYY-MM-DD');

  const eventsByDate = useMemo(() => {
    const map = new Map<string, LichPhongVan[]>();
    list.forEach((item) => {
      const key = normalizeNgayToKey(item.ngay);
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return map;
  }, [list]);

  const startOfMonth = viewDate.startOf('month');
  const endOfMonth = viewDate.endOf('month');
  const daysInMonth = endOfMonth.date();
  /** Monday-first: 0 = Sunday in dayjs, so padding = (day - 1 + 7) % 7 */
  const startPad = (startOfMonth.day() - 1 + 7) % 7;

  const calendarDays = useMemo(() => {
    const days: { date: string; isCurrentMonth: boolean; dayNum: number }[] = [];
    for (let i = 0; i < startPad; i++) {
      const d = startOfMonth.subtract(startPad - i, 'day');
      days.push({
        date: d.format('YYYY-MM-DD'),
        isCurrentMonth: false,
        dayNum: d.date(),
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: `${yearMonth}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: true,
        dayNum: d,
      });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = endOfMonth.add(i, 'day');
      days.push({
        date: d.format('YYYY-MM-DD'),
        isCurrentMonth: false,
        dayNum: d.date(),
      });
    }
    return days;
  }, [yearMonth, startPad, daysInMonth, startOfMonth, endOfMonth]);

  const hasAnyEventInView = useMemo(() => {
    return list.some((item) => {
      const key = normalizeNgayToKey(item.ngay);
      if (!key) return false;
      const [y, m] = key.split('-').map(Number);
      return y === viewDate.year() && m === viewDate.month() + 1;
    });
  }, [list, viewDate]);

  const goPrev = () => setViewDate((d) => d.subtract(1, 'month'));
  const goNext = () => setViewDate((d) => d.add(1, 'month'));
  const goToday = () => setViewDate(dayjs());

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  const isEmptyMonth = list.length === 0;
  const noEventsThisMonth = !isEmptyMonth && !hasAnyEventInView;

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CalendarIcon size={20} className="text-primary" />
          {viewDate.format('MMMM YYYY')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToday}
            className="p-2 rounded-lg border border-border hover:bg-muted/60 text-foreground text-sm font-medium"
            aria-label={t('lichPhongVan.calendar.today')}
          >
            {t('lichPhongVan.calendar.today')}
          </button>
          <button
            type="button"
            onClick={goPrev}
            className="p-2 rounded-lg border border-border hover:bg-muted/60 text-foreground"
            aria-label={t('lichPhongVan.calendar.prevMonth')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="p-2 rounded-lg border border-border hover:bg-muted/60 text-foreground"
            aria-label={t('lichPhongVan.calendar.nextMonth')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[320px] rounded-xl border border-border bg-card overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 shrink-0">
          {WEEKDAYS_MON_FIRST.map((d) => (
            <div
              key={d}
              className="p-2 text-center text-xs font-semibold text-muted-foreground border-r border-border last:border-r-0"
            >
              {dayjs().day(d).format('dd')}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr flex-1 min-h-0">
          {calendarDays.map(({ date, isCurrentMonth, dayNum }) => {
            const events = eventsByDate.get(date) ?? [];
            const isToday = date === todayKey;
            return (
              <div
                key={date}
                className={cn(
                  'min-h-[80px] p-1.5 border-b border-r border-border last:border-r-0 flex flex-col',
                  !isCurrentMonth && 'bg-muted/20',
                  isToday && 'bg-primary/10 border-primary/30 ring-inset'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums',
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground',
                    isToday && 'font-bold text-primary'
                  )}
                >
                  {dayNum}
                </span>
                <div className="flex-1 overflow-y-auto space-y-1 mt-1 min-h-0">
                  {events.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onViewDetail?.(ev)}
                      className={cn(
                        'w-full text-left px-2 py-1 rounded text-xs border truncate',
                        TRANG_THAI_EVENT_CLASS[ev.trang_thai] ?? TRANG_THAI_EVENT_CLASS[0]
                      )}
                      title={`${ev.ten_ung_vien ?? '—'} – ${t('lichPhongVan.detail.lichColVong')} ${ev.so_vong} ${ev.gio}`}
                    >
                      <span className="truncate block">
                        {ev.ten_ung_vien ?? '—'} · V{ev.so_vong}
                      </span>
                      <span className="text-[10px] opacity-80">{ev.gio}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isEmptyMonth && (
        <div className="mt-4 p-4 rounded-xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <CalendarDays size={32} className="opacity-60" />
          <p className="font-medium">{t('lichPhongVan.calendar.emptyMonth')}</p>
          <p className="text-xs">{t('lichPhongVan.calendar.emptyMonthHint')}</p>
        </div>
      )}

      {noEventsThisMonth && (
        <div className="mt-4 p-3 rounded-lg border border-dashed border-border bg-muted/10 text-center text-xs text-muted-foreground">
          {t('lichPhongVan.calendar.emptyMonth')}
        </div>
      )}
    </div>
  );
};

export default CalendarTab;
