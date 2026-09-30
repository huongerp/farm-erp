import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

import { cn } from '../../../lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Số dòng đang hiện / tổng — chỉ hiện khi đang lọc. */
  shown?: number;
  total?: number;
  className?: string;
}

/** Ô tìm nhanh trên bảng con trong drawer (lọc tại chỗ, không gọi server). */
const SubTableSearchBox: React.FC<Props> = ({ value, onChange, shown, total, className }) => {
  const { t } = useTranslation();
  const filtering = shown != null && total != null && shown !== total;
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1 min-w-0">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('common.searchPlaceholder')}
          aria-label={t('common.searchPlaceholder')}
          className="w-full h-11 md:h-9 pl-9 pr-9 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={t('common.clearFilter')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 md:h-7 md:w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {filtering && (
        <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
          {t('shared.subTable.countFiltered', { shown, total })}
        </span>
      )}
    </div>
  );
};

export default SubTableSearchBox;
