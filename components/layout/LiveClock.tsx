import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Calendar, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { duongSangAm, soTuanIso } from '../../lib/am-lich';

/**
 * Panel lịch nằm chunk riêng: đồng hồ có mặt trên MỌI trang, còn panel chỉ cần
 * khi người dùng bấm vào.
 */
const LichPopover = lazy(() => import('./LichPopover'));
const napSanLich = () => void import('./LichPopover');

/** Pad number to 2 digits (cho giờ, phút, giây) */
const pad = (n: number) => String(n).padStart(2, '0');

export type LiveClockDisplay = { time: string; date: string; y: number; m: number; d: number };

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
  return { time, date: dateStr, y: Number(year), m: Number(month), d: Number(day) };
};

/**
 * Đồng hồ realtime trên header: cập nhật mỗi giây, có đủ giờ:phút:giây, số tuần ISO
 * và ngày âm lịch. Bấm vào mở panel lịch âm dương + sinh nhật trong tuần.
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

  const { y, m, d } = display;
  // Chỉ tính lại khi sang ngày mới, không phải mỗi giây.
  const homNay = useMemo(() => ({ y, m, d }), [y, m, d]);
  const { tuan, am } = useMemo(
    () => ({ tuan: soTuanIso(y, m, d).tuan, am: duongSangAm(d, m, y) }),
    [y, m, d]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [viTri, setViTri] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cùng lý do với NotificationBell: panel đi qua portal vì <main> overflow sẽ cắt
  // panel neo `absolute`; toạ độ đo ngay trong handler bấm.
  const doViTri = useCallback(() => {
    const nut = buttonRef.current;
    if (!nut) return null;
    const o = nut.getBoundingClientRect();
    return { top: o.bottom + 8, right: Math.max(8, window.innerWidth - o.right) };
  }, []);

  const doiTrangThaiMo = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setViTri(doViTri());
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;
    const capNhat = () => setViTri(doViTri());
    const onPhim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const onBamNgoai = (e: MouseEvent) => {
      const dich = e.target as Node;
      if (buttonRef.current?.contains(dich) || panelRef.current?.contains(dich)) return;
      setIsOpen(false);
    };
    window.addEventListener('resize', capNhat);
    window.addEventListener('scroll', capNhat, true);
    document.addEventListener('keydown', onPhim);
    document.addEventListener('mousedown', onBamNgoai);
    return () => {
      window.removeEventListener('resize', capNhat);
      window.removeEventListener('scroll', capNhat, true);
      document.removeEventListener('keydown', onPhim);
      document.removeEventListener('mousedown', onBamNgoai);
    };
  }, [isOpen, doViTri]);

  const ngayAm = `${am.ngay}/${am.thang}${am.nhuan ? t('clock.leapShort') : ''} ${t('clock.lunarShort')}`;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={doiTrangThaiMo}
        onPointerEnter={napSanLich}
        onFocus={napSanLich}
        aria-label={t('clock.openCalendar')}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'hidden md:flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border shadow-sm select-none',
          'hover:bg-muted/60 transition-colors',
          isOpen && 'bg-muted/60'
        )}
      >
        <Clock size={14} className="text-primary shrink-0" />
        <span className="text-xs font-semibold text-foreground tabular-nums whitespace-nowrap">
          {display.time}
        </span>
        <div className="w-px h-4 bg-border mx-1 shrink-0" aria-hidden />
        <Calendar size={14} className="text-primary shrink-0" />
        <span className="text-xs font-medium text-muted-foreground capitalize whitespace-nowrap">
          {display.date}
        </span>
        <span className="text-xs font-semibold text-primary whitespace-nowrap">
          {t('clock.week', { n: tuan })}
        </span>
        <span className="hidden lg:flex items-center gap-1 text-xs font-medium text-muted-foreground whitespace-nowrap">
          <Moon size={12} className="text-primary shrink-0" />
          {ngayAm}
        </span>
      </button>

      {isOpen &&
        viTri &&
        createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] w-[min(calc(100vw-2rem),340px)]"
            style={{ top: viTri.top, right: viTri.right }}
          >
            <Suspense fallback={null}>
              <LichPopover homNay={homNay} />
            </Suspense>
          </div>,
          document.body
        )}
    </>
  );
};

export default LiveClock;
