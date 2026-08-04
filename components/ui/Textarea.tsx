
import React, { useCallback, useId, useLayoutEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  /** Tự điều chỉnh chiều cao theo nội dung (tối thiểu theo `rows`). */
  autoResize?: boolean;
  /** Kích hoạt tính lại chiều cao khi giá trị đổi từ bên ngoài (vd. `watch()` của react-hook-form). */
  resizeDep?: unknown;
}

/**
 * Textarea – trường nhập nội dung dài, chuẩn hoá style với Input/Select.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      required,
      icon,
      id: externalId,
      autoResize = false,
      resizeDep,
      rows = 3,
      onChange,
      onInput,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const textareaId = externalId || autoId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const adjustHeight = useCallback(() => {
      const el = innerRef.current;
      if (!el || !autoResize) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    useLayoutEffect(() => {
      adjustHeight();
    }, [adjustHeight, value, defaultValue, resizeDep]);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(event);
      if (autoResize) adjustHeight();
    };

    const handleInput: React.InputEventHandler<HTMLTextAreaElement> = (event) => {
      onInput?.(event);
      if (autoResize) adjustHeight();
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 flex items-center gap-1.5 text-foreground">
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={setRefs}
          rows={rows}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onInput={handleInput}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            'flex w-full rounded-lg border border-border bg-background px-3 py-2.5 text-body-sm text-foreground ring-offset-background placeholder:text-muted-foreground transition-colors resize-none',
            autoResize ? 'min-h-0 overflow-hidden' : 'min-h-[100px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive' : '',
            className
          )}
          {...props}
        />
        {error && <p id={errorId} role="alert" className="text-xs font-medium text-destructive mt-1.5 ml-1">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export default Textarea;
