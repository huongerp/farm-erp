
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Search, X, Check, Trash2, Power, Filter, LayoutTemplate,
    ArrowLeft, MoreVertical, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { ColumnConfig } from '../../store/createGenericStore';
import ColumnManager from './ColumnManager';
import Tooltip from '../ui/Tooltip';
import MobileFilterSheet from '../ui/MobileFilterSheet';
import MobileActionsSheet from '../ui/MobileActionsSheet';
import type { FilterGroup } from '../ui/MobileFilterSheet';
import type { ActionItem } from '../ui/MobileActionsSheet';

interface GenericToolbarProps {
    selectedCount: number;
    searchTerm: string;
    onSearchChange: (term: string) => void;

    // Actions
    onClearSelection: () => void;

    // Custom Render Props (desktop). filters: dùng FilterChipMultiSelect/FilterChipSingleSelect (quy chuẩn: Chọn tất cả + Xóa chọn trong dropdown)
    actions?: React.ReactNode;
    bulkActions?: React.ReactNode;
    filters?: React.ReactNode;

    // Default Bulk Actions Handlers
    onDeleteMany?: () => void;
    onStatusChangeMany?: (status: 0 | 1) => void;

    // Column Manager
    columns?: ColumnConfig[];
    onToggleColumn?: (id: string) => void;
    onReorderColumns?: (fromIndex: number, toIndex: number) => void;
    onResetColumns?: () => void;

    // Navigation
    showBack?: boolean;
    /** Khi có: bấm Back đi theo breadcrumb/router (vd. về trang cha). Khi không có: dùng navigate(-1). */
    onBack?: () => void;

    // Search
    searchPlaceholder?: string;
    /** Ẩn ô tìm kiếm (desktop + mobile) khi module không dùng search */
    hideSearch?: boolean;

    /** Number of active filters to show badge */
    activeFilterCount?: number;
    /** Callback to clear all filters */
    onClearAllFilters?: () => void;

    /** Filter groups cho mobile bottom sheet */
    filterGroups?: FilterGroup[];

    /** Action items cho mobile bottom sheet (import, export, ...) */
    mobileActions?: ActionItem[];

    /** Callback khi bấm nút Thêm trên mobile */
    onAdd?: () => void;

    /** Nội dung nhỏ hiển thị bên phải ô search (desktop & mobile, khi không có selection) */
    searchTrailing?: React.ReactNode;
}

const GenericToolbar: React.FC<GenericToolbarProps> = ({
    selectedCount,
    searchTerm, onSearchChange, onClearSelection,
    actions, bulkActions, filters,
    onDeleteMany, onStatusChangeMany,
    columns, onToggleColumn, onReorderColumns, onResetColumns,
    showBack = false,
    onBack,
    searchPlaceholder,
    hideSearch = false,
    activeFilterCount = 0,
    onClearAllFilters,
    filterGroups,
    mobileActions,
    onAdd,
    searchTrailing,
}) => {
    const { t } = useTranslation();
    const resolvedSearchPlaceholder = searchPlaceholder ?? t('common.searchPlaceholder');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showMobileActions, setShowMobileActions] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const hasSelection = selectedCount > 0;
    const navigate = useNavigate();
    const handleBack = onBack ?? (() => navigate(-1));
    const searchInputRef = useRef<HTMLInputElement>(null);
    const columnMenuRef = useRef<HTMLDivElement>(null);

    // Keyboard shortcut: "/" to focus search (chỉ khi có search)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (hideSearch) return;
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hideSearch]);

    // Close column menu on click outside
    useEffect(() => {
        if (!showColumnMenu) return;
        const handler = (e: MouseEvent) => {
            if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
                setShowColumnMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showColumnMenu]);

    const hasColumnManager = columns && onToggleColumn;
    const hasFilters = filters && filterGroups && filterGroups.length > 0;
    const hasMobileActions = mobileActions && mobileActions.length > 0;

    return (
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border/40 px-3 sm:px-4 py-2 space-y-2 transition-all shrink-0">

            {/* ======================================================== */}
            {/* MOBILE TOOLBAR (< sm): 1 hàng duy nhất                   */}
            {/* ======================================================== */}
            <div className="sm:hidden">
                <AnimatePresence mode="wait">
                    {hasSelection ? (
                        /* ---- Mobile: Chế độ chọn nhiều ---- */
                        <motion.div
                            key="mobile-bulk"
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            className="flex items-center gap-1.5"
                        >
                            <div className="bg-primary text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-primary/20 flex items-center gap-1.5 tabular-nums">
                                <Check size={12} className="stroke-[3px]" />
                                <span>{selectedCount}</span>
                            </div>
                            <button
                                onClick={onClearSelection}
                                className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all active:scale-90"
                            >
                                <X size={14} className="stroke-[2.5px]" />
                            </button>

                            <div className="flex-1" />

                            {onStatusChangeMany && (
                                <>
                                    <button
                                        onClick={() => onStatusChangeMany(1)}
                                        className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center text-primary bg-primary/10 rounded-lg border border-primary/20 active:scale-95"
                                    >
                                        <Check size={14} className="stroke-[2.5px]" />
                                    </button>
                                    <button
                                        onClick={() => onStatusChangeMany(0)}
                                        className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-lg border border-border active:scale-95"
                                    >
                                        <Power size={14} className="stroke-[2.5px]" />
                                    </button>
                                </>
                            )}
                            {onDeleteMany && (
                                <button
                                    onClick={onDeleteMany}
                                    className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center text-white bg-destructive rounded-lg shadow-sm active:scale-95"
                                >
                                    <Trash2 size={14} className="stroke-[2.5px]" />
                                </button>
                            )}
                            {bulkActions}
                        </motion.div>
                    ) : (
                        /* ---- Mobile: Chế độ bình thường – 1 hàng ---- */
                        <motion.div
                            key="mobile-normal"
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            className="flex items-center gap-1.5"
                        >
                            {/* Back */}
                            {showBack && (
                                <button
                                    onClick={handleBack}
                                    className="shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground active:scale-95 transition-all"
                                >
                                    <ArrowLeft size={15} className="stroke-[2.5px]" />
                                </button>
                            )}

                            {/* Search */}
                            {!hideSearch ? (
                                <div className="relative flex-1 min-w-0">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                        value={searchTerm}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        placeholder={resolvedSearchPlaceholder}
                                        className="w-full h-8 pl-8 pr-7 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => onSearchChange('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-0.5 rounded-full"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 min-w-0" />
                            )}

                            {searchTrailing}

                            {/* Bộ lọc */}
                            {hasFilters && (
                                <button
                                    onClick={() => setShowMobileFilters(true)}
                                    className={cn(
                                        "shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-all active:scale-95 relative",
                                        activeFilterCount > 0
                                            ? 'bg-primary/5 border-primary/40 text-primary'
                                            : 'bg-background border-border text-muted-foreground'
                                    )}
                                >
                                    <Filter size={15} />
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-primary text-white text-2xs font-bold rounded-full tabular-nums">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* Thao tác */}
                            {hasMobileActions && (
                                <button
                                    onClick={() => setShowMobileActions(true)}
                                    className="shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all active:scale-95"
                                >
                                    <MoreVertical size={15} />
                                </button>
                            )}

                            {/* Thêm */}
                            {onAdd && (
                                <button
                                    onClick={onAdd}
                                    className="shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-white shadow-sm active:scale-95 transition-all"
                                >
                                    <Plus size={16} className="stroke-[2.5px]" />
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MOBILE ROW 2: Nút xóa bộ lọc */}
            {!hasSelection && activeFilterCount > 0 && onClearAllFilters && (
                <div className="sm:hidden pt-1">
                    <button
                        onClick={onClearAllFilters}
                        className="h-7 px-2.5 flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all border border-destructive/20 active:scale-95"
                    >
                        <X size={12} className="stroke-[2.5px]" />
                        {t('common.clearFilters', { count: activeFilterCount })}
                    </button>
                </div>
            )}

            {/* ======================================================== */}
            {/* DESKTOP TOOLBAR (>= sm): giữ nguyên                      */}
            {/* ======================================================== */}
            <div className="hidden sm:flex items-center gap-3">
                <AnimatePresence mode="wait">
                    {hasSelection ? (
                        <motion.div
                            key="bulk-bar"
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            className="flex-1 flex items-center gap-2"
                        >
                            <div className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-primary/20 flex items-center gap-2 tabular-nums">
                                <Check size={13} className="stroke-[3px]" />
                                <span>{selectedCount}</span>
                                <span className="opacity-70">{t('common.selected')}</span>
                            </div>
                            <Tooltip content={t('common.deselectAll')}>
                                <button
                                    onClick={onClearSelection}
                                    className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all active:scale-90"
                                >
                                    <X size={15} className="stroke-[2.5px]" />
                                </button>
                            </Tooltip>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="search-bar"
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            className="flex-1 flex items-center gap-2 min-w-0"
                        >
                            {showBack && (
                                <button
                                    onClick={handleBack}
                                    className="shrink-0 h-8 px-2 -ml-1 flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
                                >
                                    <ArrowLeft size={15} className="stroke-[2.5px]" />
                                    <span className="text-xs font-medium">{t('common.back')}</span>
                                </button>
                            )}

                            {!hideSearch ? (
                                <div className="relative flex-1 max-w-md min-w-0 group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        value={searchTerm}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        placeholder={resolvedSearchPlaceholder}
                                        className="w-full h-8 pl-10 pr-8 bg-muted/40 hover:bg-muted/60 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background transition-all"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => onSearchChange('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-all"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 max-w-md min-w-0" />
                            )}

                            {searchTrailing}

                            {activeFilterCount > 0 && onClearAllFilters && (
                                <button
                                    onClick={onClearAllFilters}
                                    className="shrink-0 h-7 px-2 flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all border border-destructive/20 hover:border-destructive/30 active:scale-95"
                                >
                                    <X size={11} className="stroke-[2.5px]" />
                                    {t('common.clearFilters', { count: activeFilterCount })}
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop Right Side */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <AnimatePresence mode="wait">
                        {hasSelection ? (
                            <motion.div
                                key="bulk-actions"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-1.5"
                            >
                                {onStatusChangeMany && (
                                    <>
                                        <button
                                            onClick={() => onStatusChangeMany(1)}
                                            className="h-8 px-3 flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-all border border-primary/20 active:scale-95"
                                        >
                                            <Check size={14} className="stroke-[2.5px] shrink-0" />
                                            <span className="text-xs font-medium">{t('common.activate')}</span>
                                        </button>
                                        <button
                                            onClick={() => onStatusChangeMany(0)}
                                            className="h-8 px-3 flex items-center gap-1.5 text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg transition-all border border-border active:scale-95"
                                        >
                                            <Power size={14} className="stroke-[2.5px] shrink-0" />
                                            <span className="text-xs font-medium">{t('common.deactivate')}</span>
                                        </button>
                                    </>
                                )}
                                {onDeleteMany && (
                                    <button
                                        onClick={onDeleteMany}
                                        className="h-8 px-3 flex items-center gap-1.5 text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-all shadow-sm active:scale-95"
                                    >
                                        <Trash2 size={14} className="stroke-[2.5px] shrink-0" />
                                        <span className="text-xs font-medium">{t('common.delete')}</span>
                                    </button>
                                )}
                                {bulkActions}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="primary-actions"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-1.5"
                            >
                                {/* Column Manager (desktop) */}
                                {hasColumnManager && (
                                    <div className="relative" ref={columnMenuRef}>
                                        <Tooltip content={t('common.columnOptions')} placement="bottom" disabled={showColumnMenu}>
                                            <button
                                                onClick={() => setShowColumnMenu(!showColumnMenu)}
                                                className={cn(
                                                    "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center border rounded-lg transition-all",
                                                    showColumnMenu
                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                                )}
                                            >
                                                <LayoutTemplate size={15} />
                                            </button>
                                        </Tooltip>

                                        <AnimatePresence>
                                            {showColumnMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                    className="absolute right-0 top-full mt-2 bg-card backdrop-blur-xl rounded-xl shadow-xl border border-border z-[41] overflow-hidden"
                                                >
                                                    <ColumnManager
                                                        columns={columns!}
                                                        onToggleColumn={onToggleColumn!}
                                                        onReorderColumns={onReorderColumns || (() => {})}
                                                        onResetColumns={onResetColumns || (() => {})}
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {actions}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ===== ROW 2: Filter Chips (hiển thị khi có bộ lọc đang áp dụng) ===== */}
            {hasSelection ? (
                <div className="hidden sm:block min-h-8" aria-hidden />
            ) : filters ? (
                <div className="hidden sm:flex items-center gap-2 flex-wrap min-h-8">
                    {filters}
                </div>
            ) : null}

            {/* ===== Mobile Bottom Sheets (portal) ===== */}
            {hasFilters && (
                <MobileFilterSheet
                    open={showMobileFilters}
                    onClose={() => setShowMobileFilters(false)}
                    groups={filterGroups!}
                    onClearAll={onClearAllFilters}
                />
            )}
            {hasMobileActions && (
                <MobileActionsSheet
                    open={showMobileActions}
                    onClose={() => setShowMobileActions(false)}
                    items={mobileActions!}
                />
            )}
        </div>
    );
};

export default GenericToolbar;
