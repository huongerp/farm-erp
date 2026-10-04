import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DateRangePreset {
  id: string;
  label: string;
}

export interface DateRangeValue {
  preset: string;
  /** YYYY-MM-DD or '' */
  customStart: string;
  /** YYYY-MM-DD or '' */
  customEnd: string;
}

interface DateRangePickerProps {
  /** Available presets (e.g. "Tháng này", "Quý này", "Năm nay", …) */
  presets: DateRangePreset[];
  /** Current value */
  value: DateRangeValue;
  /** Called when value changes */
  onChange: (value: DateRangeValue) => void;
  /** Display label for the currently selected range */
  displayLabel?: string;
  /** Placeholder when nothing selected */
  placeholder?: string;
  /** Additional classes on the trigger button */
  className?: string;
  /** ID of the "custom" preset, default = 'custom' */
  customPresetId?: string;
  /** Chiều cao trigger — 'md' (h-8, mặc định, khớp filter chip khác) hoặc 'sm' (h-7). */
  size?: 'sm' | 'md';
  /**
   * Hiện thẳng bảng chọn (không có nút bấm / popup) — dùng trong bảng lọc của điện thoại,
   * nơi popup 380px không vừa và bị cắt bởi vùng cuộn của bảng.
   */
  inline?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  presets,
  value,
  onChange,
  displayLabel,
  placeholder = 'Khoảng thời gian',
  className,
  customPresetId = 'custom',
  size = 'md',
  inline = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isCustom = value.preset === customPresetId;

  const triggerLabel = useMemo(() => {
    if (displayLabel) return displayLabel;
    if (isCustom && value.customStart && value.customEnd) {
      return `${formatDisplay(value.customStart)} – ${formatDisplay(value.customEnd)}`;
    }
    const found = presets.find((p) => p.id === value.preset);
    return found?.label ?? placeholder;
  }, [displayLabel, value, presets, placeholder, isCustom]);

  const handlePreset = (id: string) => {
    if (id === customPresetId) {
      onChange({ ...value, preset: customPresetId });
    } else {
      onChange({ preset: id, customStart: '', customEnd: '' });
      setOpen(false);
    }
  };

  const oNgay = (label: string, v: string, doi: (x: string) => DateRangeValue) => (
    <div>
      <label className="text-2xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <input
        type="date"
        value={v}
        onChange={(e) => onChange(doi(e.target.value))}
        className={cn(
          'w-full rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40',
          inline ? 'h-10' : 'h-8'
        )}
      />
    </div>
  );

  const tuNgay = oNgay('Từ ngày', value.customStart, (x) => ({
    preset: customPresetId,
    customStart: x,
    customEnd: value.customEnd,
  }));
  const denNgay = oNgay('Đến ngày', value.customEnd, (x) => ({
    preset: customPresetId,
    customStart: value.customStart,
    customEnd: x,
  }));

  const chonNhanh = (cot: 2 | 3) => (
    <>
      <p className="text-2xs font-semibold text-muted-foreground px-1.5 mb-1.5">Chọn nhanh</p>
      <div className={cn('grid gap-1', cot === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {presets
          .filter((p) => p.id !== customPresetId)
          .map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePreset(p.id)}
              className={cn(
                inline ? 'h-9' : 'h-7',
                'px-2 rounded-lg text-xs font-medium transition-all text-left truncate',
                value.preset === p.id
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-foreground hover:bg-muted border border-transparent'
              )}
            >
              {p.label}
            </button>
          ))}
      </div>
    </>
  );

  if (inline) {
    return (
      <div className={cn('space-y-3', className)}>
        <div>{chonNhanh(3)}</div>
        <div className="grid grid-cols-2 gap-2">
          {tuNgay}
          {denNgay}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={ref}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          size === 'sm' ? 'h-7' : 'h-8',
          'pl-2.5 pr-2 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all whitespace-nowrap',
          open
            ? 'border-primary/40 bg-primary/5 text-primary'
            : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Calendar size={13} className="shrink-0" />
        <span className="truncate max-w-[140px]">{triggerLabel}</span>
        <ChevronDown size={12} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex">
            {/* Left column: From / To */}
            <div className="w-[180px] p-3 space-y-2.5 border-r border-border">
              {tuNgay}
              {denNgay}
              {isCustom && value.customStart && value.customEnd && (
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full h-7 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  Áp dụng
                </button>
              )}
            </div>

            {/* Right column: Preset grid (2 cols) */}
            <div className="w-[200px] p-2">{chonNhanh(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

function formatDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default DateRangePicker;
