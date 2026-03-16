import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check, X, Search, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Option {
  label: string;
  value: string;
  icon?: React.ElementType;
  /** Số lượng record tương ứng (cross-filter count) */
  count?: number;
}

/**
 * MultiSelect – component generic cho chọn nhiều.
 * Quy chuẩn filter chip: trong dropdown luôn có (1) "Chọn tất cả" bên trái và (2) "Xóa chọn" bên phải.
 * Dùng chung cho desktop; FilterChipMultiSelect/FilterChipSingleSelect wrap component này.
 * Creatable: truyền onCreateOption + createOptionLabel thì khi gõ text không trùng option sẽ hiện "Tạo mới: ...", chọn sẽ gọi onCreateOption(label) và thêm id trả về vào value.
 */
interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  icon?: React.ElementType;
  size?: 'sm' | 'md' | 'lg';
  /** Hiển thị label phía trên ô chọn (giống Combobox), không in label trong ô trigger */
  labelAbove?: boolean;
  error?: string;
  required?: boolean;
  /** Creatable: (label) => Promise<newOptionValue | null>. Khi có, hiện hàng "Tạo mới" nếu search không khớp option nào. */
  onCreateOption?: (label: string) => Promise<string | null>;
  /** Label cho hàng tạo mới, dùng %s thay cho searchTerm. VD: "Tạo mới: %s" */
  createOptionLabel?: string;
  /** Render dropdown qua portal vào body để tránh bị cắt và đảm bảo cuộn được. Mặc định true. */
  dropdownInPortal?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  label,
  className,
  icon: Icon,
  size = 'sm',
  labelAbove = false,
  error,
  required,
  onCreateOption,
  createOptionLabel = "Tạo mới: %s",
  dropdownInPortal = true,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const updateDropdownRect = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const listHeight = 280;
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : listHeight;
    const openAbove = spaceBelow < Math.min(listHeight, 200);
    setDropdownRect({
      top: openAbove ? rect.top - listHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 200),
    });
  };

  useEffect(() => {
    if (!isOpen) return;
    if (dropdownInPortal) {
      updateDropdownRect();
    }
  }, [isOpen, dropdownInPortal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownInPortal && (target as Element).closest?.('[data-multiselect-dropdown]')) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownInPortal]);

  useEffect(() => {
    if (!isOpen || !dropdownInPortal) return;
    const onScroll = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest?.('[data-multiselect-dropdown]')) return;
      if (containerRef.current?.contains(target as Node)) return;
      setIsOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [isOpen, dropdownInPortal]);

  const handleSelect = (optionValue: string) => {
    const isSelected = value.includes(optionValue);
    if (isSelected) {
      onChange(value.filter((item) => item !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      onChange([]);
    } else {
      onChange(filteredOptions.map((opt) => opt.value));
    }
  };

  const filteredOptions = options.filter((option) => {
    const label = option?.label ?? option?.value ?? '';
    return String(label).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const searchTrim = searchTerm.trim();
  const hasExactMatch = searchTrim && options.some((o) => (o.label ?? '').toLowerCase() === searchTrim.toLowerCase());
  const showCreateOption = !!onCreateOption && searchTrim.length > 0 && !hasExactMatch;

  const handleCreateOption = async () => {
    if (!onCreateOption || !searchTrim || isCreating) return;
    setIsCreating(true);
    try {
      const newId = await onCreateOption(searchTrim);
      if (typeof newId === 'string' && !value.includes(newId)) {
        onChange([...value, newId]);
      }
      setSearchTerm('');
    } finally {
      setIsCreating(false);
    }
  };

  const hasValue = value.length > 0;
  const firstName = value.length > 0 ? options.find(o => o.value === value[0])?.label : null;
  const extraCount = value.length - 1;

  const heightClass = size === 'sm' ? 'h-7' : size === 'md' ? 'h-8' : 'h-10';
  const textSizeClass = size === 'lg' ? 'text-sm' : 'text-xs';
  const showLabelAbove = labelAbove && label;

  const dropdownContent = (
    <>
      <div className="p-1.5 border-b border-border">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            className="w-full pl-7 pr-3 py-1.5 text-xs text-foreground border border-border rounded-lg bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1">
        {filteredOptions.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border mb-0.5">
            <div
              className="flex items-center flex-1 min-w-0 hover:bg-muted/50 rounded-lg cursor-pointer py-0.5 -my-0.5 px-1 -mx-1"
              onClick={handleSelectAll}
            >
              <div className={cn(
                "w-3.5 h-3.5 rounded border flex items-center justify-center mr-2 transition-colors shrink-0",
                value.length === filteredOptions.length && filteredOptions.length > 0 ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card"
              )}>
                {value.length === filteredOptions.length && filteredOptions.length > 0 ? <Check size={9} /> : null}
              </div>
              <span className="truncate">{t('common.selectAll')}</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="shrink-0 text-xs font-medium text-primary hover:underline py-0.5 px-1"
            >
              {t('common.clearSelection')}
            </button>
          </div>
        )}
        {filteredOptions.length === 0 && !showCreateOption ? (
          <div className="py-3 text-center text-xs text-muted-foreground">Không tìm thấy</div>
        ) : (
          <>
            {filteredOptions.map((option) => {
              const isSelected = value.includes(option.value);
              const hasCount = option.count !== undefined;
              const isZeroCount = hasCount && option.count === 0 && !isSelected;
              return (
                <div
                  key={option.value}
                  onClick={() => !isZeroCount && handleSelect(option.value)}
                  className={cn(
                    "flex items-center px-2 py-1.5 text-xs rounded-lg transition-colors",
                    isZeroCount ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
                    isSelected ? "bg-primary/10 text-foreground font-medium border border-primary/20" : !isZeroCount && "text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-3.5 h-3.5 rounded border flex items-center justify-center mr-2 transition-colors shrink-0",
                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card"
                  )}>
                    {isSelected && <Check size={9} />}
                  </div>
                  {option.icon && <option.icon size={13} className="mr-1.5 text-muted-foreground" />}
                  <span className="truncate text-gray-900 dark:text-gray-100">{option.label ?? option.value}</span>
                  {hasCount && (
                    <span className={cn("ml-auto shrink-0 text-2xs font-medium tabular-nums pl-2", isSelected ? "text-foreground/80" : "text-muted-foreground")}>
                      {option.count}
                    </span>
                  )}
                </div>
              );
            })}
            {showCreateOption && (
              <div
                onClick={isCreating ? undefined : handleCreateOption}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-colors",
                  isCreating ? "opacity-60 cursor-wait" : "cursor-pointer text-primary hover:bg-primary/10"
                )}
              >
                {isCreating ? <Loader2 size={14} className="animate-spin shrink-0" /> : <Plus size={14} className="shrink-0" />}
                <span className="truncate">{createOptionLabel.replace(/%s/g, searchTrim)}</span>
              </div>
            )}
          </>
        )}
      </div>
      {hasValue && (
        <div className="px-2 py-1.5 bg-muted/30 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
          <span className="tabular-nums">{value.length} / {options.length} đã chọn</span>
          <button type="button" onClick={() => setIsOpen(false)} className="text-primary font-medium hover:underline text-xs">Xong</button>
        </div>
      )}
    </>
  );

  const dropdownClassName = "bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[200px]";

  return (
    <div className={cn("relative w-full", !showLabelAbove && "min-w-[140px]", className)} ref={containerRef}>
      {showLabelAbove && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-foreground">
          {Icon && <span className="text-muted-foreground shrink-0"><Icon size={14} /></span>}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded-lg border bg-background py-2 px-3 transition-all text-left",
          size === 'lg' ? "min-h-10" : "px-2",
          textSizeClass,
          heightClass,
          "border",
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-border/80 focus-within:border-border/80",
          hasValue ? "text-foreground" : "text-muted-foreground",
          error ? "border-destructive focus-visible:ring-destructive" : "",
          !showLabelAbove && label && "font-medium"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
          {!showLabelAbove && Icon && <Icon size={size === 'lg' ? 14 : 12} className={cn("shrink-0", hasValue ? "text-primary" : "text-muted-foreground")} />}
          {!showLabelAbove && label && <span className="text-foreground shrink-0">{label}:</span>}

          {!hasValue ? (
            <span className="truncate">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              <span className={cn("truncate font-medium text-gray-900 dark:text-gray-100", size === 'lg' ? "text-sm" : "text-xs")}>{firstName ?? placeholder}</span>
              {extraCount > 0 && (
                <span className="shrink-0 bg-primary/10 text-primary text-2xs font-bold px-1.5 py-0.5 rounded-full tabular-nums" title={value.map(v => options.find(o => o.value === v)?.label).filter(Boolean).join(', ')}>
                  +{extraCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasValue && (
            <div
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
            >
              <X size={size === 'lg' ? 14 : 10} />
            </div>
          )}
          <ChevronDown size={size === 'lg' ? 16 : 11} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>
      {error && <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{error}</p>}

      {isOpen &&
        (dropdownInPortal && dropdownRect && typeof document !== 'undefined'
          ? createPortal(
              <div
                id={listboxId}
                role="listbox"
                data-multiselect-dropdown
                className={cn(dropdownClassName, "fixed z-[9999]")}
                style={{
                  top: dropdownRect.top,
                  left: dropdownRect.left,
                  width: dropdownRect.width,
                }}
              >
                {dropdownContent}
              </div>,
              document.body
            )
          : (
              <div id={listboxId} role="listbox" data-multiselect-dropdown className={cn("absolute top-full left-0 mt-1 w-full z-50", dropdownClassName)}>
                {dropdownContent}
              </div>
            ))}
    </div>
  );
};

export default MultiSelect;
