import React from 'react';
import { cn } from '../../lib/utils';

export interface DetailToolbarAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?:
        | 'primary'
        | 'secondary'
        | 'danger'
        | 'ghost'
        | 'success'
        | 'warning'
        | 'info'
        | 'default'
        | 'outline';
    disabled?: boolean;
}

interface DetailToolbarProps {
    actions: DetailToolbarAction[];
    /** Số cột: 2 cho sidebar hẹp, mặc định 3 (mobile) / 6 (desktop) */
    columns?: 2 | 3 | 6;
    className?: string;
}

/**
 * Toolbar hiển thị các hành động trong màn detail
 * Action được thiết kế hình tròn với text ở dưới
 */
const DetailToolbar: React.FC<DetailToolbarProps> = ({ actions, columns, className }) => {
    if (!actions || actions.length === 0) return null;

    const gridColsClass =
        columns === 2 ? "grid-cols-2" :
        columns === 6 ? "grid-cols-3 sm:grid-cols-6" :
        "grid-cols-3 sm:grid-cols-6";

    return (
        <div className={cn("grid gap-3 p-3.5 min-w-0", gridColsClass, className)}>
            {actions.map((action, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                        "flex flex-col items-center gap-1.5 transition-all outline-none min-w-0 w-full",
                        action.disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-0.5 active:scale-95"
                    )}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border",
                        action.variant === 'primary' ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white" :
                            action.variant === 'danger' ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-100 dark:border-rose-900 hover:bg-rose-500 hover:text-white" :
                                action.variant === 'success' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-100 dark:border-emerald-900 hover:bg-emerald-500 hover:text-white" :
                                    action.variant === 'warning' ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-100 dark:border-amber-900 hover:bg-amber-500 hover:text-white" :
                                        action.variant === 'info' ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white" :
                                            action.variant === 'ghost' ? "bg-transparent text-muted-foreground hover:bg-muted" :
                                                action.variant === 'outline' ? "bg-background text-foreground border-border hover:bg-muted" :
                                                    action.variant === 'secondary' ? "bg-secondary/40 text-secondary-foreground border-border hover:bg-secondary/70" :
                                                        "bg-muted/50 text-foreground hover:bg-muted"
                    )}>
                        {React.cloneElement(action.icon as React.ReactElement, { size: 16, strokeWidth: 2 })}
                    </div>
                    <span className={cn(
                        "text-xs font-medium text-center transition-colors break-words w-full px-1 leading-tight",
                        action.variant === 'primary' ? "text-primary" :
                            action.variant === 'danger' ? "text-rose-500" :
                                action.variant === 'success' ? "text-emerald-600" :
                                    action.variant === 'warning' ? "text-amber-600" :
                                        action.variant === 'info' ? "text-primary" :
                                            action.variant === 'outline' || action.variant === 'secondary' ? "text-foreground" :
                                                "text-muted-foreground"
                    )}>
                        {action.label}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default DetailToolbar;
