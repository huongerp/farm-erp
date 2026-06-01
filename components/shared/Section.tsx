import React from 'react';
import { cn } from '../../lib/utils';

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Mặc định 'primary' – tiêu đề section luôn màu primary. */
  variant?: 'primary' | 'muted' | 'secondary';
  /** Id cho anchor link (vd. TOC nhảy tới section) */
  id?: string;
  /** Nút/hành động đặt cùng hàng với title (bên phải), chuẩn module Phòng ban. */
  action?: React.ReactNode;
}

/**
 * Section chung cho form và detail: card trắng, tiêu đề uppercase + icon, border-bottom.
 * FormSection và DetailSection dùng chung component này.
 * Quy ước: tiêu đề section luôn màu primary (variant mặc định 'primary'). Xem docs/UI-CONVENTIONS.md.
 */
const Section: React.FC<SectionProps> = ({ title, icon, children, className, variant = 'primary', id, action }) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  return (
    <div
      id={id}
      className={cn(
        'w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3',
        id && 'scroll-mt-24',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2 pb-2 sm:pb-2.5 border-b',
          isPrimary ? 'border-primary/20' : isSecondary ? 'border-secondary/30' : 'border-border'
        )}
      >
        <h4
          className={cn(
            'text-[11px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 min-w-0',
            isPrimary ? 'text-primary font-bold' : isSecondary ? 'text-secondary-foreground' : 'text-muted-foreground'
          )}
        >
          {icon}
          {title}
        </h4>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
};

export default Section;
