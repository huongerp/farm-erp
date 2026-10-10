import { cn } from '../../../lib/utils';

/** Nút gạt nhỏ chọn một trong vài giá trị (khổ giấy, hướng…). */
export function NutGatNho<T extends string>({
  options,
  value,
  onChange,
  labelOf,
  className,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf: (v: T) => string;
  className?: string;
}) {
  return (
    <div className={cn('inline-flex rounded-lg border border-border p-0.5 bg-muted/40', className)}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={cn(
            'flex-1 px-2.5 py-1 text-xs font-medium rounded-md transition',
            value === o ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  );
}
