import React, { useState, useEffect, useCallback } from 'react';
import { cn, formatNumberVN, parseFormattedNumber, getLocale } from '../../lib/utils';

export interface NumberInputProps {
  value?: number | string;
  onChange?: (value: number) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  /** Số chữ số thập phân tối đa khi hiển thị */
  maxFractionDigits?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  required?: boolean;
  label?: string;
  icon?: React.ReactNode;
  /** Cho ô nhập trong bảng (compact) */
  compact?: boolean;
}

/**
 * NumberInput – ô nhập số có format phân tách hàng nghìn theo locale (vi-VN / en-US).
 */
const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  onBlur,
  min = 0,
  max,
  maxFractionDigits = 4,
  placeholder = '0',
  disabled = false,
  className,
  error,
  required,
  label,
  icon,
  compact = false,
}) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const safeNum = Number.isNaN(numValue) ? 0 : numValue;

  const formatDisplay = useCallback(
    (n: number): string => {
      if (n === 0) return '';
      return formatNumberVN(n, { maxFractionDigits, minFractionDigits: 0 });
    },
    [maxFractionDigits]
  );

  const [displayValue, setDisplayValue] = useState(() => formatDisplay(safeNum));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplay(safeNum));
    }
  }, [safeNum, isFocused, formatDisplay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDisplayValue(raw);
    const parsed = parseFormattedNumber(raw, getLocale());
    const clamped = max != null && parsed > max ? max : parsed < min ? min : parsed;
    onChange?.(clamped);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(safeNum === 0 ? '' : String(safeNum).replace('.', getLocale().startsWith('vi') ? ',' : '.'));
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFormattedNumber(displayValue, getLocale());
    const clamped = max != null && parsed > max ? max : parsed < min ? min : parsed;
    setDisplayValue(formatDisplay(clamped));
    onChange?.(clamped);
    onBlur?.();
  };

  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-foreground">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground transition-colors tabular-nums',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus:ring-destructive',
          icon && 'pl-9',
          compact ? 'h-9 text-sm py-1.5 px-2' : 'h-10 py-2 px-3 text-sm',
          className
        )}
      />
      {error && <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{error}</p>}
    </div>
  );
};

export default NumberInput;
