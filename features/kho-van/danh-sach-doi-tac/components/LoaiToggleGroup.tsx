import React from 'react';
import { cn } from '../../../../lib/utils';
import { Toggle } from '../../../../components/ui/Toggle';
import type { LoaiDoiTac } from '../core/types';

/** Option: value + label */
export interface LoaiToggleOption {
  value: LoaiDoiTac;
  label: string;
}

export interface LoaiToggleGroupProps {
  label?: string;
  options: LoaiToggleOption[];
  value: LoaiDoiTac;
  onChange: (value: LoaiDoiTac) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  /** Kích thước nút: sm | default | lg */
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Toggle group cho chọn Loại (Nhà cung cấp / Khách hàng).
 * Dùng component Toggle (shadcn-style) với variant="outline".
 */
const LoaiToggleGroup: React.FC<LoaiToggleGroupProps> = ({
  label,
  options,
  value,
  onChange,
  disabled = false,
  required,
  error,
  className,
  size = 'default',
}) => {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="text-sm font-medium leading-none mb-2 block text-foreground">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div
        role="group"
        aria-label={label}
        className={cn(
          'flex flex-wrap items-center gap-2',
          disabled && 'opacity-50 pointer-events-none'
        )}
      >
        {options.map((opt) => (
          <Toggle
            key={opt.value}
            variant="outline"
            size={size}
            pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            aria-label={opt.label}
          >
            {opt.label}
          </Toggle>
        ))}
      </div>
      {error && <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{error}</p>}
    </div>
  );
};

export default LoaiToggleGroup;
