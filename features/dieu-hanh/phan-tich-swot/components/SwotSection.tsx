import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import type { SwotItem } from '../core/types';
import type { Quadrant } from '../constants/suggested-criteria';
import { cn } from '../../../../lib/utils';

interface SwotSectionProps {
  quadrant: Quadrant;
  items: SwotItem[];
  icon: React.ReactNode;
  /** Border/icon accent (e.g. emerald, amber, sky, rose) */
  accentClass?: string;
  emptyLabel: string;
  onOpenSettings: () => void;
  className?: string;
}

const SwotSection: React.FC<SwotSectionProps> = ({
  quadrant,
  items,
  icon,
  accentClass = 'border-primary/20',
  emptyLabel,
  onOpenSettings,
  className,
}) => {
  const { t } = useTranslation();
  const isEmpty = !items?.length;

  return (
    <div
      className={cn(
        'w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3 border-l-4 h-full min-h-0',
        accentClass,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-2 sm:pb-2.5 border-b border-primary/20">
        <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 text-primary font-bold min-w-0">
          {icon}
          <span className="truncate">{t(`phanTichSwot.${quadrant}`)}</span>
        </h4>
        <Tooltip content={t('phanTichSwot.settings')} placement="left">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
            onClick={onOpenSettings}
            aria-label={t('phanTichSwot.settings')}
          >
            <Settings size={16} />
          </Button>
        </Tooltip>
      </div>
      <p className="text-xs italic text-muted-foreground">
        {t(`phanTichSwot.${quadrant}Desc`)}
      </p>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed border-border bg-muted/20">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id}
              className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="flex-1 min-w-0 pt-0.5">{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SwotSection;
