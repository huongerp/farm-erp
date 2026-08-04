import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, icon, required, options, placeholder, id: externalId, ...props }, ref) => {
    const autoId = useId();
    const selectId = externalId || autoId;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 block text-foreground">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
              {icon}
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              'flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-body-sm text-foreground ring-offset-background appearance-none transition-colors',
              'hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
              icon ? 'pl-10' : '',
              error ? 'border-destructive focus-visible:ring-destructive' : '',
              className
            )}
            {...props}
          >
            {placeholder != null && (
              <option value="">{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <ChevronDown size={18} strokeWidth={2} />
          </div>
        </div>
        {error && <p id={errorId} role="alert" className="text-xs font-medium text-destructive mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export default Select;
