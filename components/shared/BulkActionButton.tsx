import React from 'react';
import type { LucideIcon } from 'lucide-react';

type Tone = 'primary' | 'warning' | 'success' | 'danger' | 'muted';

const TONE_CLASS: Record<Tone, string> = {
  primary: 'text-primary bg-primary/10 hover:bg-primary/20 border-primary/20',
  warning: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/25',
  success: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25',
  danger: 'text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/15 border-red-500/25',
  muted: 'text-muted-foreground bg-muted/50 hover:bg-muted border-border',
};

interface Props {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: Tone;
  disabled?: boolean;
}

/**
 * Nút trong slot `bulkActions` của GenericToolbar: điện thoại chỉ hiện icon (vùng bấm 44px),
 * desktop hiện cả nhãn.
 */
const BulkActionButton: React.FC<Props> = ({ icon: Icon, label, onClick, tone = 'primary', disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 px-2 md:px-3 flex items-center justify-center gap-1.5 rounded-lg border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${TONE_CLASS[tone]}`}
  >
    <Icon size={14} className="stroke-[2.5px] shrink-0" />
    <span className="hidden md:inline text-xs font-medium whitespace-nowrap">{label}</span>
  </button>
);

export default BulkActionButton;
