import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn, formatNumberVN, parseFormattedNumber, getLocale } from '../../lib/utils';
import { dinhDangKhiGo } from '../../lib/number-input-format';

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
  /**
   * Khi true: hiển thị "0" đã format (vd. vi-VN "0") khi không focus; mặc định để trống cho 0.
   * Dùng cho form số lượng/tiền cần thấy phân tách hàng nghìn rõ ràng.
   */
  showZeroFormatted?: boolean;
}

/**
 * NumberInput – ô nhập số có phân tách hàng nghìn theo vi-VN, định dạng ngay khi gõ
 * (logic ở lib/number-input-format.ts); blur thì kẹp min/max và chuẩn hoá lại.
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
  showZeroFormatted = false,
}) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const safeNum = Number.isNaN(numValue) ? 0 : numValue;

  const formatDisplay = useCallback(
    (n: number): string => {
      if (n === 0 && !showZeroFormatted) return '';
      return formatNumberVN(n, { maxFractionDigits, minFractionDigits: 0 });
    },
    [maxFractionDigits, showZeroFormatted]
  );

  const [displayValue, setDisplayValue] = useState(() => formatDisplay(safeNum));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatDisplay(safeNum));
    }
  }, [safeNum, isFocused, formatDisplay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { text, caret } = dinhDangKhiGo(e.target.value, e.target.selectionStart ?? e.target.value.length, {
      maxFractionDigits,
      allowNegative: min < 0,
    });
    setDisplayValue(text);
    // Đặt lại con trỏ sau khi React ghi giá trị mới (thêm/bớt dấu chấm làm lệch vị trí).
    requestAnimationFrame(() => {
      if (document.activeElement === inputRef.current) inputRef.current?.setSelectionRange(caret, caret);
    });
    const parsed = parseFormattedNumber(text, getLocale());
    const clamped = max != null && parsed > max ? max : parsed < min ? min : parsed;
    onChange?.(clamped);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Giữ nguyên dạng có phân tách hàng nghìn khi vào ô; chỉ bỏ "0" để gõ đè cho nhanh.
    setDisplayValue(safeNum === 0 ? '' : formatNumberVN(safeNum, { maxFractionDigits, minFractionDigits: 0 }));
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
        <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-foreground">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={inputRef}
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
          compact ? 'h-9 text-body-sm py-1.5 px-2' : 'h-10 py-2 px-3 text-body-sm',
          className
        )}
      />
      {error && <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{error}</p>}
    </div>
  );
};

export default NumberInput;
