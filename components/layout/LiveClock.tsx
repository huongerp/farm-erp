import { useEffect, useState, type FC } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../store/useStore';

/** Pad number to 2 digits (cho giờ, phút, giây) */
const pad = (n: number) => String(n).padStart(2, '0');

export type LiveClockDisplay = { time: string; date: string };

/**
 * Format ngày giờ theo IANA timezone.
 * time: "14:35:08", date: "Thứ 2, 10/02/2026"
 */
const formatDateWithDayNames = (date: Date, tz: string, dayNames: string[]): LiveClockDisplay => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const dayOfWeek = dayNames[tzDate.getDay()];

  const time = `${pad(Number(hour))}:${pad(Number(minute))}:${pad(Number(second))}`;
  const dateStr = `${dayOfWeek}, ${pad(Number(day))}/${pad(Number(month))}/${year}`;
  return { time, date: dateStr };
};

/**
 * Đồng hồ realtime trên header: cập nhật mỗi giây, có đủ giờ:phút:giây.
 * Dùng timezone từ Cài đặt. Component duy nhất hiển thị thời gian realtime toàn app.
 */
const LiveClock: FC = () => {
  const { t } = useTranslation();
  const timezone = useUIStore((s) => s.timezone);

  const dayNames = [
    t('clock.sunday'),
    t('clock.monday'),
    t('clock.tuesday'),
    t('clock.wednesday'),
    t('clock.thursday'),
    t('clock.friday'),
    t('clock.saturday'),
  ];

  const [display, setDisplay] = useState<LiveClockDisplay>(() =>
    formatDateWithDayNames(new Date(), timezone, dayNames)
  );

  useEffect(() => {
    setDisplay(formatDateWithDayNames(new Date(), timezone, dayNames));
    const timer = setInterval(() => {
      setDisplay(formatDateWithDayNames(new Date(), timezone, dayNames));
    }, 1_000);
    return () => clearInterval(timer);
  }, [timezone, t]);

  return (
    <div className="hidden md:flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border shadow-sm select-none">
      <Clock size={14} className="text-primary shrink-0" />
      <span className="text-xs font-semibold text-foreground tabular-nums whitespace-nowrap">
        {display.time}
      </span>
      <div className="w-px h-4 bg-border mx-1 shrink-0" aria-hidden />
      <Calendar size={14} className="text-primary shrink-0" />
      <span className="text-xs font-medium text-muted-foreground capitalize whitespace-nowrap">
        {display.date}
      </span>
    </div>
  );
};

export default LiveClock;
