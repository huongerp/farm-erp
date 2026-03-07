import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Download, Upload, RotateCcw, FileSpreadsheet, FileJson, FileText,
  Check, Trash2, AlertTriangle, MoreHorizontal, ChevronDown, Filter, Search,
  Users, Building2, Briefcase, Award, Clock, Wallet, Mail, Shield, Settings,
  Info
} from 'lucide-react';
import TabGroup, { Tab } from '../../../components/ui/TabGroup';
import GenericTable from '../../../components/shared/GenericTable';
import GenericToolbar from '../../../components/shared/GenericToolbar';
import Button from '../../../components/ui/Button';
import { SYSTEM_COLLECTIONS } from './services/sao-luu-service';
import { useExportData, useRestoreData } from './hooks/use-sao-luu';
import { ExportFormat, RestoreMode } from './core/types';
import type { DataCollection } from './core/types';
import { cn } from '../../../lib/utils';
import { useConfirmStore } from '../../../store/useConfirmStore';
import { toast } from 'sonner';
import { createGenericStore, ColumnConfig } from '../../../store/createGenericStore';
import { useListWithFilter } from '../../../lib/hooks';
import FilterChipMultiSelect from '../../../components/shared/FilterChipMultiSelect';

/** Tên bộ dữ liệu (bảng database): var_xxx */
const getTenBoDuLieu = (id: string) => `var_${id}`;

/** Nhóm dữ liệu: Hệ thống | Hành chính nhân sự */
const NHOM_HETHONG = 'Hệ thống';
const NHOM_HANH_CHINH = 'Hành chính nhân sự';
const NHOM_BY_COLLECTION: Record<string, string> = {
  cau_hinh: NHOM_HETHONG,
  phan_quyen: NHOM_HETHONG,
  chi_nhanh: NHOM_HANH_CHINH,
  nhan_vien: NHOM_HANH_CHINH,
  phong_ban: NHOM_HANH_CHINH,
  chuc_vu: NHOM_HANH_CHINH,
  cap_bac: NHOM_HANH_CHINH,
  hop_dong: NHOM_HANH_CHINH,
  cham_cong: NHOM_HANH_CHINH,
  luong: NHOM_HANH_CHINH,
  don_tu: NHOM_HANH_CHINH,
};
const getNhomDuLieu = (id: string) => NHOM_BY_COLLECTION[id] ?? NHOM_HETHONG;

const NHOM_OPTIONS = [
  { value: NHOM_HETHONG, label: NHOM_HETHONG },
  { value: NHOM_HANH_CHINH, label: NHOM_HANH_CHINH },
];

/* ─── Backup list store (toolbar + table). Cột Thao tác do GenericTable tự thêm. ─── */
const BACKUP_COLUMNS: ColumnConfig[] = [
  { id: 'ten_bo_du_lieu', label: 'Tên bộ dữ liệu', visible: true, minWidth: 200, order: 0 },
  { id: 'nhom_du_lieu', label: 'Nhóm dữ liệu', visible: true, minWidth: 160, order: 1 },
  { id: 'mo_ta', label: 'Mô tả', visible: true, minWidth: 220, order: 2 },
  { id: 'so_ban_ghi', label: 'Số bản ghi', visible: true, minWidth: 100, order: 3 },
];

type BackupFilters = { nhom_du_lieu: string[] };
const useBackupStore = createGenericStore<BackupFilters>({ nhom_du_lieu: [] }, BACKUP_COLUMNS);

const FORMAT_OPTIONS: { format: ExportFormat; label: string; icon: React.ReactNode }[] = [
  { format: 'xlsx', label: 'Excel (.xlsx)', icon: <FileSpreadsheet size={14} /> },
  { format: 'csv', label: 'CSV (.csv)', icon: <FileText size={14} /> },
  { format: 'json', label: 'JSON (.json)', icon: <FileJson size={14} /> },
];

/* ─── Nút action từng dòng: dropdown render bằng portal để không bị cột Thao tác che ─── */
const ExportRowAction: React.FC<{
  item: DataCollection;
  onExport: (collectionId: string, format: ExportFormat) => void;
  isExporting: boolean;
}> = ({ item, onExport, isExporting }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.right - 160 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isExporting}
        className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
        title="Xuất dữ liệu"
      >
        {isExporting ? (
          <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <MoreHorizontal size={18} />
        )}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] min-w-[160px] bg-card rounded-xl shadow-xl border border-border py-1"
          style={{ top: position.top, left: position.left }}
        >
          <p className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border">Xuất dạng</p>
          {FORMAT_OPTIONS.map(({ format, label, icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => {
                onExport(item.id, format);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-foreground hover:bg-muted transition-colors"
            >
              {icon}
              {label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

/* ─── Icon map ─── */
const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={18} />, Building2: <Building2 size={18} />, Briefcase: <Briefcase size={18} />,
  Award: <Award size={18} />, FileText: <FileText size={18} />, Clock: <Clock size={18} />,
  Wallet: <Wallet size={18} />, Mail: <Mail size={18} />, Shield: <Shield size={18} />,
  Settings: <Settings size={18} />,
};

/* ─── Collection Picker (for Restore tab) ─── */
const CollectionPicker: React.FC<{
  selected: string[];
  onChange: (s: string[]) => void;
}> = ({ selected, onChange }) => {
  const toggleAll = () => {
    if (selected.length === SYSTEM_COLLECTIONS.length) onChange([]);
    else onChange(SYSTEM_COLLECTIONS.map(c => c.id));
  };
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Chọn bộ dữ liệu ({selected.length}/{SYSTEM_COLLECTIONS.length})</span>
        <button type="button" onClick={toggleAll} className="text-xs font-medium text-primary hover:underline">
          {selected.length === SYSTEM_COLLECTIONS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {SYSTEM_COLLECTIONS.map(col => {
          const isOn = selected.includes(col.id);
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => toggle(col.id)}
              className={cn(
                "flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all",
                isOn ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                isOn ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {iconMap[col.icon] || <FileText size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{col.label}</div>
                <div className="text-[11px] text-muted-foreground">{col.recordCount} bản ghi</div>
              </div>
              <div className={cn(
                "w-4 h-4 rounded flex items-center justify-center shrink-0",
                isOn ? "bg-primary text-white" : "border border-border"
              )}>
                {isOn && <Check size={10} strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Dropdown chọn 1 bảng, nhóm theo Nhóm dữ liệu ─── */
const RESTORE_GROUPS = [NHOM_HETHONG, NHOM_HANH_CHINH];
const RestoreCollectionSelect: React.FC<{
  value: string;
  onChange: (id: string) => void;
}> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const grouped = useMemo(() => {
    const byGroup = new Map<string, DataCollection[]>();
    SYSTEM_COLLECTIONS.forEach((c) => {
      const g = getNhomDuLieu(c.id);
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(c);
    });
    return RESTORE_GROUPS.map((groupLabel) => ({
      label: groupLabel,
      items: (byGroup.get(groupLabel) || []).filter(
        (c) =>
          !search ||
          getTenBoDuLieu(c.id).toLowerCase().includes(search.toLowerCase()) ||
          c.label.toLowerCase().includes(search.toLowerCase())
      ),
    })).filter((g) => g.items.length > 0);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = value ? SYSTEM_COLLECTIONS.find((c) => c.id === value) : null;

  return (
    <div className="relative w-full" ref={ref}>
      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tên bộ dữ liệu</label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(''); if (!open) setTimeout(() => inputRef.current?.focus(), 50); }}
        className={cn(
          "w-full h-11 rounded-xl border bg-background px-3 text-left text-sm flex items-center justify-between gap-2 transition-all",
          open ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"
        )}
      >
        <span className={cn("truncate flex-1 min-w-0", !selected && "text-muted-foreground")}>
          {selected ? `${getTenBoDuLieu(selected.id)} · ${selected.label}` : 'Chọn một bảng...'}
        </span>
        <ChevronDown size={18} className={cn("text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1.5 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border bg-muted/30 sticky top-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bảng..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto custom-scrollbar py-1">
            {grouped.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy bảng</div>
            ) : (
              grouped.map((group) => (
                <div key={group.label} className="mb-2">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide sticky top-0 bg-muted/50 backdrop-blur">
                    {group.label}
                  </div>
                  {group.items.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
                        value === c.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50 text-foreground"
                      )}
                    >
                      <span className="font-mono text-xs shrink-0 w-28 truncate">{getTenBoDuLieu(c.id)}</span>
                      <span className="truncate flex-1">{c.label}</span>
                      {value === c.id && <Check size={16} className="text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Restore Page: Chế độ → Tên bộ dữ liệu (1 bảng) → File → Khôi phục ─── */
const RestorePageContent: React.FC = () => {
  const [mode, setMode] = useState<RestoreMode>('upsert');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const confirm = useConfirmStore(s => s.confirm);
  const restoreMutation = useRestoreData(() => {
    setFile(null);
    setSelectedCollection('');
  });

  const canRestore = file && selectedCollection;
  const handleRestore = () => {
    if (!canRestore || !file) return;
    confirm({
      title: mode === 'replace' ? '⚠️ Xác nhận thay thế dữ liệu' : 'Xác nhận khôi phục',
      message: mode === 'replace'
        ? 'Toàn bộ dữ liệu hiện tại của bộ dữ liệu đã chọn sẽ bị XÓA và thay thế. Hành động này không thể hoàn tác!'
        : 'Dữ liệu từ file sẽ được cập nhật vào hệ thống. Bản ghi đã tồn tại sẽ được cập nhật, bản ghi mới sẽ được thêm.',
      variant: mode === 'replace' ? 'danger' : 'warning',
      confirmText: mode === 'replace' ? 'Thay thế toàn bộ' : 'Khôi phục',
      onConfirm: async () => {
        try {
          const fileContent = await file.text();
          restoreMutation.mutate({
            fileName: file.name,
            fileContent,
            collections: [selectedCollection],
            mode,
          });
        } catch {
          toast.error('Không đọc được file. Vui lòng chọn file JSON hợp lệ.');
        }
      },
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col mt-1.5 overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-5">
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 lg:p-5 border-b border-border bg-muted/20">
            <h2 className="font-bold text-sm text-foreground flex items-center gap-2">
              <RotateCcw size={16} className="text-primary" /> Khôi phục dữ liệu
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Chọn chế độ, bảng đích và tải file backup để khôi phục</p>
          </div>

          <div className="p-4 lg:p-5 space-y-6">
            {/* Bước 1: Chế độ khôi phục */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground">Chế độ khôi phục</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setMode('upsert')}
                  className={cn(
                    "w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
                    mode === 'upsert' ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2",
                    mode === 'upsert' ? "border-primary bg-primary" : "border-border"
                  )}>
                    {mode === 'upsert' && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Cập nhật dữ liệu đã tồn tại, thêm mới nếu chưa có</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('replace')}
                  className={cn(
                    "w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all",
                    mode === 'replace' ? "border-red-300 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : "border-border hover:border-red-200"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2",
                    mode === 'replace' ? "border-red-500 bg-red-500" : "border-border"
                  )}>
                    {mode === 'replace' && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      Xóa toàn bộ dữ liệu hiện tại và thay thế <AlertTriangle size={13} className="text-red-500" />
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bước 2: Tên bộ dữ liệu (1 bảng, dropdown nhóm) */}
            <RestoreCollectionSelect value={selectedCollection} onChange={setSelectedCollection} />

            {/* Bước 3: File backup */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-muted-foreground">File backup</label>
              <label className={cn(
                "flex flex-col items-center justify-center gap-2.5 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                file ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}>
                <input type="file" accept=".json,.jsonl,.csv,.xlsx" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                {file ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button type="button" onClick={e => { e.preventDefault(); setFile(null); }} className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">Kéo thả hoặc <span className="text-primary">chọn file</span></p>
                    <p className="text-[11px] text-muted-foreground">.json, .jsonl, .csv, .xlsx</p>
                  </>
                )}
              </label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-3 rounded-xl flex gap-2.5">
              <Info className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={16} />
              <div className="text-[11px] text-blue-800 dark:text-blue-300 space-y-0.5">
                <p className="font-semibold">Lưu ý</p>
                <p>File phải là mảng JSON hoặc CSV/XLSX có header; mỗi bản ghi cần trường <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">id</code>.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                disabled={!canRestore}
                isLoading={restoreMutation.isPending}
                size="lg"
                onClick={handleRestore}
                className={cn("text-white shadow-lg h-11 px-6", mode === 'replace' ? "bg-red-500 hover:bg-red-600" : "bg-primary")}
              >
                <RotateCcw size={16} className="mr-2" />
                Khôi phục
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════ */
/* ═══             MAIN PAGE                  ═══ */
/* ═══════════════════════════════════════════════ */
const DataManagementPage: React.FC = () => {
  const TABS: Tab[] = [
    { id: 'export', label: 'Sao lưu', icon: Download },
    { id: 'restore', label: 'Khôi phục', icon: RotateCcw },
  ];

  const [activeTab, setActiveTab] = useState('export');
  const [exportToolbarOpen, setExportToolbarOpen] = useState(false);
  const exportToolbarRef = useRef<HTMLDivElement>(null);
  const [exportingSingleId, setExportingSingleId] = useState<string | null>(null);

  useEffect(() => {
    if (!exportToolbarOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportToolbarRef.current && !exportToolbarRef.current.contains(e.target as Node)) setExportToolbarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportToolbarOpen]);

  const backupStore = useBackupStore();
  const exportMutation = useExportData(() => {
    backupStore.clearSelection();
    setExportingSingleId(null);
  });

  const filterFn = useCallback((item: DataCollection, term: string, filters: BackupFilters) => {
    const searchLower = term.toLowerCase();
    const matchSearch = !term ||
      item.label.toLowerCase().includes(searchLower) ||
      (item.description && item.description.toLowerCase().includes(searchLower)) ||
      item.id.toLowerCase().includes(searchLower) ||
      getTenBoDuLieu(item.id).toLowerCase().includes(searchLower) ||
      getNhomDuLieu(item.id).toLowerCase().includes(searchLower);
    const matchNhom = filters.nhom_du_lieu.length === 0 || filters.nhom_du_lieu.includes(getNhomDuLieu(item.id));
    return matchSearch && matchNhom;
  }, []);

  const filteredCollections = useListWithFilter(
    SYSTEM_COLLECTIONS,
    backupStore.searchTerm,
    backupStore.filters,
    filterFn
  );

  const nhomCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const item of SYSTEM_COLLECTIONS) {
      const nhom = getNhomDuLieu(item.id);
      m[nhom] = (m[nhom] || 0) + 1;
    }
    return m;
  }, []);

  const filterGroups = useMemo(
    () => [
      {
        key: 'nhom_du_lieu',
        label: 'Nhóm dữ liệu',
        icon: Filter,
        options: NHOM_OPTIONS.map((o) => ({ label: o.label, value: o.value, count: nhomCounts[o.value] ?? 0 })),
        value: backupStore.filters.nhom_du_lieu,
        onChange: (val: string[]) => backupStore.setFilter('nhom_du_lieu', val),
      },
    ],
    [backupStore.filters.nhom_du_lieu, backupStore.setFilter, nhomCounts]
  );

  const handleExportWithFormat = useCallback((format: ExportFormat) => {
    const ids = Array.from(backupStore.selectedIds);
    if (ids.length === 0) return;
    exportMutation.mutate({ collections: ids, format });
  }, [backupStore.selectedIds, exportMutation]);

  const handleExportOne = useCallback((collectionId: string, format: ExportFormat) => {
    setExportingSingleId(collectionId);
    exportMutation.mutate(
      { collections: [collectionId], format },
      { onSettled: () => setExportingSingleId(null) }
    );
  }, [exportMutation]);

  const renderCell = useCallback((colId: string, item: DataCollection) => {
    switch (colId) {
      case 'ten_bo_du_lieu':
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
              {iconMap[item.icon] || <FileText size={16} />}
            </div>
            <span className="text-sm font-mono text-foreground">{getTenBoDuLieu(item.id)}</span>
          </div>
        );
      case 'nhom_du_lieu':
        return <span className="text-sm text-foreground">{getNhomDuLieu(item.id)}</span>;
      case 'mo_ta':
        return <span className="text-sm text-muted-foreground">{item.description || '—'}</span>;
      case 'so_ban_ghi':
        return <span className="text-sm font-medium text-foreground">{item.recordCount} bản ghi</span>;
      case 'actions':
        return (
          <ExportRowAction
            item={item}
            onExport={handleExportOne}
            isExporting={exportMutation.isPending && exportingSingleId === item.id}
          />
        );
      default:
        return null;
    }
  }, [handleExportOne, exportMutation.isPending, exportingSingleId]);

  const renderMobileCard = useCallback((item: DataCollection) => (
    <div key={item.id} className="bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
          {iconMap[item.icon] || <FileText size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-mono text-foreground truncate">{getTenBoDuLieu(item.id)}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{getNhomDuLieu(item.id)} · {item.recordCount} bản ghi</p>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="shrink-0 relative z-0">
        <TabGroup tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Tab Sao lưu: listview toolbar + table */}
      {activeTab === 'export' && (
        <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
          <GenericToolbar
            selectedCount={backupStore.selectedIds.size}
            searchTerm={backupStore.searchTerm}
            onSearchChange={backupStore.setSearchTerm}
            onClearSelection={backupStore.clearSelection}
            columns={backupStore.columns}
            onToggleColumn={backupStore.toggleColumn}
            onReorderColumns={backupStore.reorderColumns}
            onResetColumns={backupStore.resetColumns}
            searchPlaceholder="Tìm bộ dữ liệu..."
            filterGroups={filterGroups}
            activeFilterCount={backupStore.filters.nhom_du_lieu.length}
            onClearAllFilters={() => backupStore.setFilter('nhom_du_lieu', [])}
            filters={
              <FilterChipMultiSelect
                options={NHOM_OPTIONS.map((o) => ({ ...o, count: nhomCounts[o.value] ?? 0 }))}
                value={backupStore.filters.nhom_du_lieu}
                onChange={(v) => backupStore.setFilter('nhom_du_lieu', v)}
                placeholder="Nhóm dữ liệu"
                className="min-w-[160px]"
                size="sm"
              />
            }
            actions={
              <div className="relative flex items-center gap-1" ref={exportToolbarRef}>
                <Button
                  onClick={() => setExportToolbarOpen(o => !o)}
                  disabled={backupStore.selectedIds.size === 0}
                  isLoading={exportMutation.isPending && !exportingSingleId}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md h-9 px-4 gap-1.5"
                >
                  <Download size={14} /> Xuất <ChevronDown size={14} className={cn("transition-transform", exportToolbarOpen && "rotate-180")} />
                </Button>
                {exportToolbarOpen && (
                  <div className="absolute right-0 top-full mt-1 z-[100] min-w-[160px] bg-card rounded-xl shadow-xl border border-border py-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border">Chọn định dạng</p>
                    {FORMAT_OPTIONS.map(({ format, label, icon }) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => {
                          handleExportWithFormat(format);
                          setExportToolbarOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-foreground hover:bg-muted transition-colors"
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
            bulkActions={
              <div className="relative flex items-center gap-1" ref={exportToolbarRef}>
                <Button
                  onClick={() => setExportToolbarOpen(o => !o)}
                  disabled={backupStore.selectedIds.size === 0}
                  isLoading={exportMutation.isPending && !exportingSingleId}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md h-9 px-4 gap-1.5"
                >
                  <Download size={14} /> Xuất <ChevronDown size={14} className={cn("transition-transform", exportToolbarOpen && "rotate-180")} />
                </Button>
                {exportToolbarOpen && (
                  <div className="absolute right-0 top-full mt-1 z-[100] min-w-[160px] bg-card rounded-xl shadow-xl border border-border py-1">
                    <p className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border">Chọn định dạng</p>
                    {FORMAT_OPTIONS.map(({ format, label, icon }) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => {
                          handleExportWithFormat(format);
                          setExportToolbarOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-foreground hover:bg-muted transition-colors"
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            }
          />
          <div className="flex-1 min-h-0">
            <GenericTable
              data={filteredCollections}
              columns={backupStore.columns}
              isLoading={false}
              loadingText="Đang tải..."
              selectedIds={backupStore.selectedIds}
              onToggleSelection={backupStore.toggleSelection}
              onToggleAll={backupStore.toggleAllSelection}
              page={backupStore.pagination.page}
              pageSize={backupStore.pagination.pageSize}
              onPageChange={backupStore.setPage}
              onPageSizeChange={backupStore.setPageSize}
              renderCell={renderCell}
              renderMobileCard={renderMobileCard}
              keyExtractor={(item: DataCollection) => item.id}
            />
          </div>
        </div>
      )}

      {activeTab === 'restore' && <RestorePageContent />}
    </div>
  );
};

export default DataManagementPage;
