import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import FilterChipMultiSelect from './FilterChipMultiSelect';
import type { FilterGroup } from '../ui/MobileFilterSheet';

/**
 * Nút Filter (desktop) gom các filter chip dư ra khi toolbar có quá nhiều chip.
 * Bấm mở dropdown liệt kê từng nhóm dưới dạng FilterChipMultiSelect; badge = số nhóm đang lọc.
 */
interface FilterOverflowDropdownProps {
  groups: FilterGroup[];
  /** Xoá lọc của riêng các nhóm trong dropdown. Mặc định: gọi onChange([]) cho từng nhóm. */
  onClear?: () => void;
}

const FilterOverflowDropdown: React.FC<FilterOverflowDropdownProps> = ({ groups, onClear }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  /** Căn popup theo mép phải nút khi bên phải không đủ chỗ cho 280px. */
  const [canPhai, setCanPhai] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCount = groups.filter((g) => g.value.length > 0).length;
  const handleClear = onClear ?? (() => groups.forEach((g) => g.onChange([])));

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Element;
      if (containerRef.current?.contains(target)) return;
      // Dropdown của MultiSelect render qua portal — click trong đó không tính là click ra ngoài.
      if (target.closest?.('[data-multiselect-dropdown]')) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  if (groups.length === 0) return null;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          const r = containerRef.current?.getBoundingClientRect();
          setCanPhai(!!r && r.left + 288 > window.innerWidth);
          setOpen((v) => !v);
        }}
        aria-label={t('common.openFiltersAria')}
        aria-expanded={open}
        className={cn(
          'h-8 px-2.5 flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all',
          open || activeCount > 0
            ? 'bg-primary/5 border-primary/40 text-primary'
            : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <Filter size={14} />
        {activeCount > 0 && (
          <span className="min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center bg-primary text-white text-2xs font-bold rounded-full tabular-nums">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full',
            canPhai ? 'right-0' : 'left-0',
            'mt-1.5 z-40 w-[280px] max-w-[calc(100vw-1rem)] bg-card rounded-xl shadow-xl border border-border p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">{t('shared.mobileFilter.title')}</span>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="h-6 px-1.5 flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-all"
              >
                <X size={11} className="stroke-[2.5px]" />
                {t('shared.mobileFilter.clear')}
              </button>
            )}
          </div>
          {groups.map((g) => (
            <FilterChipMultiSelect
              key={g.key}
              options={g.options}
              value={g.value}
              onChange={g.onChange}
              placeholder={g.label}
              icon={g.icon}
              className="w-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterOverflowDropdown;
