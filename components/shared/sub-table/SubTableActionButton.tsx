import React from 'react';

import { cn } from '../../../lib/utils';
import Tooltip from '../../ui/Tooltip';
import { useSubTableLayout } from './SubTable';

type Tone = 'primary' | 'warning' | 'danger' | 'neutral';

const ICON_TONE: Record<Tone, string> = {
  primary: 'text-primary hover:bg-primary/10',
  warning: 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30',
  danger: 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30',
  neutral: 'text-muted-foreground hover:bg-muted hover:text-foreground',
};

const CARD_TONE: Record<Tone, string> = {
  primary: 'border-primary/30 bg-primary/10 text-primary active:bg-primary/20',
  warning:
    'border-amber-200 bg-amber-50 text-amber-700 active:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400',
  danger:
    'border-rose-200 bg-rose-50 text-rose-600 active:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400',
  neutral: 'border-border bg-card text-foreground active:bg-muted',
};

interface Props {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: Tone;
  disabled?: boolean;
  /** Trên card mobile: nút chính giãn hết chiều ngang còn lại. */
  primary?: boolean;
}

/**
 * Nút thao tác của một dòng trong `SubTable`.
 * Trong bảng: icon 28px + tooltip (khớp cột Thao tác của `GenericTable`).
 * Trên card mobile: nút cao 44px có chữ — icon trơn khó đoán và khó chạm.
 */
const SubTableActionButton: React.FC<Props> = ({ label, icon, onClick, tone = 'primary', disabled, primary }) => {
  const layout = useSubTableLayout();
  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  if (layout === 'card') {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-lg border text-sm font-medium touch-manipulation transition-colors disabled:opacity-50',
          primary && 'flex-1',
          CARD_TONE[tone]
        )}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Tooltip content={label} placement="left">
      <button
        type="button"
        onClick={handle}
        disabled={disabled}
        aria-label={label}
        className={cn('p-1.5 rounded-md transition-colors disabled:opacity-40', ICON_TONE[tone])}
      >
        {icon}
      </button>
    </Tooltip>
  );
};

export default SubTableActionButton;
