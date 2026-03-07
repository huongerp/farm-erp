import React, { useMemo } from 'react';
import { cn } from '../../lib/utils';
import { getDescendantIds } from '../../lib/tree-utils';
import type { GetIdFn, GetParentIdFn } from '../../lib/tree-utils';

export interface ParentSelectOption<T> {
  value: string;
  label: string;
  level: number;
  /** Item gốc (để custom render nếu cần) */
  item: T;
}

export interface ParentSelectProps<T> {
  /** Toàn bộ items (cây) để chọn làm cha */
  items: T[];
  value: string;
  onChange: (value: string) => void;
  /** Id node đang sửa — sẽ loại trừ chính nó và mọi con cháu khỏi options */
  excludeId?: string | null;
  getId: GetIdFn<T>;
  getParentId: GetParentIdFn<T>;
  /** Level/cấp (1 = root) để indent option */
  getLevel: (item: T) => number;
  getOptionLabel: (item: T) => string;
  label?: string;
  /** Icon hiển thị cạnh label (chuẩn generic form) */
  icon?: React.ReactNode;
  /** Text option "Không có" / "None" */
  placeholder?: string;
  /** Hint nhỏ dưới select */
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Ref gắn vào thẻ select */
  selectRef?: React.Ref<HTMLSelectElement>;
  name?: string;
}

const INDENT_CHAR = '\u00A0'; // non-breaking space
const INDENT_PER_LEVEL = 3;
const PREFIX_CHILD = '└─ ';

/**
 * Select chọn "cha" cho entity dạng cây. Option có indent theo level,
 * tự loại trừ bản thân và con cháu (tránh vòng).
 */
function ParentSelectInner<T>(
  {
    items,
    value,
    onChange,
    excludeId,
    getId,
    getParentId,
    getLevel,
    getOptionLabel,
    label,
    icon,
    placeholder = '',
    hint,
    error,
    required,
    disabled,
    className,
    selectRef,
    name,
  }: ParentSelectProps<T>,
  ref: React.Ref<HTMLSelectElement>
) {
  const validOptions = useMemo(() => {
    const excluded = new Set<string>();
    if (excludeId) {
      excluded.add(excludeId);
      const descendantIds = getDescendantIds(excludeId, items, { getId, getParentId });
      descendantIds.forEach((id) => excluded.add(id));
    }
    return items
      .filter((item) => !excluded.has(getId(item)))
      .map((item) => ({
        value: getId(item),
        label: getOptionLabel(item),
        level: getLevel(item),
        item,
      }));
  }, [items, excludeId, getId, getParentId, getLevel, getOptionLabel]);

  const displayRef = ref ?? selectRef;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="text-xs font-medium text-foreground/80 flex items-center gap-1.5 mb-1.5 block">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        ref={displayRef}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${name ?? 'parent'}-error` : undefined}
        className={cn(
          'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-foreground text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive' : 'border-border'
        )}
      >
        <option value="">{placeholder}</option>
        {validOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {Array(opt.level - 1)
              .fill(INDENT_CHAR.repeat(INDENT_PER_LEVEL))
              .join('')}
            {opt.level > 1 ? PREFIX_CHILD : ''}
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      {error && (
        <p id={name ? `${name}-error` : undefined} className="text-xs text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

const ParentSelect = React.forwardRef(ParentSelectInner) as <T>(
  props: ParentSelectProps<T> & { ref?: React.Ref<HTMLSelectElement> }
) => React.ReactElement;

export { ParentSelect };
export default ParentSelect;
