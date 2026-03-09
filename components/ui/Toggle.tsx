import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Trạng thái bật (pressed) – dùng khi control từ parent (vd: toggle group) */
  pressed?: boolean;
  /** Callback khi trạng thái pressed thay đổi (optional, có thể dùng onClick) */
  onPressedChange?: (pressed: boolean) => void;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

const toggleVariants = {
  variant: {
    default:
      'bg-transparent hover:bg-muted hover:text-muted-foreground data-[state=on]:bg-muted data-[state=on]:text-foreground',
    outline:
      'border border-input bg-transparent hover:bg-muted hover:text-foreground data-[state=on]:bg-muted data-[state=on]:text-foreground',
  },
  size: {
    sm: 'h-9 min-w-9 px-2.5 text-sm',
    default: 'h-10 min-w-10 px-3 text-sm',
    lg: 'h-11 min-w-11 px-5 text-sm',
  },
};

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      pressed,
      onPressedChange,
      variant = 'default',
      size = 'default',
      disabled,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const isControlled = pressed !== undefined;
    const [internalPressed, setInternalPressed] = React.useState(false);
    const isOn = isControlled ? pressed : internalPressed;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isControlled) {
        setInternalPressed((prev) => !prev);
        onPressedChange?.(!internalPressed);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="button"
        aria-pressed={isOn}
        data-state={isOn ? 'on' : 'off'}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
          toggleVariants.variant[variant],
          toggleVariants.size[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Toggle.displayName = 'Toggle';

export { Toggle };
