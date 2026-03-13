import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield, ChevronRight, Check, Minus, Save, ChevronDown,
  Filter, Layers, Building2, CheckCheck, ChevronLeft,
} from 'lucide-react';
import {
  PERMISSION_FUNCTIONS,
  PERMISSION_ACTIONS,
  SYSTEM_MODULES_CONFIG,
  type PermissionFunction,
} from '../services/phan-quyen-service';
import { PositionPermission, ActionType } from '../core/types';
import Button from '../../../../components/ui/Button';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import { cn } from '../../../../lib/utils';
import { useUpdateModulePermissions } from '../hooks/use-phan-quyen';

interface Props {
  roles: PositionPermission[];
  isLoading: boolean;
  /** Quyền sửa: khi false thì ẩn nút Lưu và vô hiệu hóa chỉnh sửa ô checkbox */
  canUpdate?: boolean;
}

const DOT_COLOR: Record<string, string> = {
  amber: 'bg-amber-500', emerald: 'bg-emerald-500', blue: 'bg-blue-500',
  pink: 'bg-pink-500', violet: 'bg-violet-500', orange: 'bg-orange-500',
  cyan: 'bg-cyan-500', teal: 'bg-teal-500', slate: 'bg-slate-400',
};

const TriCheck: React.FC<{
  state: 'none' | 'some' | 'all';
  disabled?: boolean;
  onClick: () => void;
  size?: number;
}> = ({ state, disabled, onClick, size = 18 }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'rounded flex items-center justify-center mx-auto transition-all shrink-0',
      size === 18 ? 'w-[18px] h-[18px]' : 'w-5 h-5',
      disabled
        ? 'opacity-10 cursor-not-allowed bg-muted'
        : state === 'all'
          ? 'bg-primary text-primary-foreground shadow-sm'
          : state === 'some'
            ? 'bg-primary/40 text-primary-foreground'
            : 'bg-muted border border-border hover:border-primary/50',
    )}
  >
    {state === 'all' && <Check size={size === 18 ? 12 : 14} strokeWidth={3} />}
    {state === 'some' && <Minus size={size === 18 ? 12 : 14} strokeWidth={3} />}
  </button>
);

const MATRIX_ACTIONS: ActionType[] = [...PERMISSION_ACTIONS];
const INDIVIDUAL_ACTIONS: ActionType[] = ['view', 'create', 'update', 'delete', 'admin'];

const getModuleSlug = (id: string) => id.split('/').pop() ?? id;

const syncAll = (actions: ActionType[]): ActionType[] => {
  const allOn = INDIVIDUAL_ACTIONS.every((a) => actions.includes(a));
  if (allOn && !actions.includes('all')) return [...actions, 'all'];
  if (!allOn && actions.includes('all')) return actions.filter((a) => a !== 'all');
  return actions;
};

const getFirstModuleId = (): string =>
  PERMISSION_FUNCTIONS[0]?.groups?.[0]?.modules?.[0]?.id ?? 'he-thong/nhan-vien';

/* ─── Desktop: Function Dropdown ─── */
const FunctionDropdown: React.FC<{
  selected: PermissionFunction | null;
  onSelect: (fn: PermissionFunction | null) => void;
  t: (key: string) => string;
}> = ({ selected, onSelect, t }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dotClass = selected ? (DOT_COLOR[selected.color] ?? 'bg-primary') : 'bg-primary';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left bg-card hover:bg-muted/50',
          open ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        )}
      >
        <div className={cn('w-2 h-2 rounded-full shrink-0', dotClass)} />
        <span className="text-[13px] font-semibold text-foreground truncate flex-1">
          {selected ? t(selected.nameKey) : t('common.all')}
        </span>
        <ChevronDown size={14} className={cn('text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto no-scrollbar p-1">
            <button onClick={() => { onSelect(null); setOpen(false); }} className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left', !selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
              <Layers size={13} className="shrink-0" />
              <span className="text-[13px] font-medium flex-1">{t('common.all')}</span>
              {!selected && <Check size={13} className="text-primary shrink-0" />}
            </button>
            <div className="h-px bg-border my-1" />
            {PERMISSION_FUNCTIONS.map((fn) => {
              const isSel = selected?.id === fn.id;
              const count = fn.groups.reduce((s, g) => s + g.modules.length, 0);
              return (
                <button key={fn.id} onClick={() => { onSelect(fn); setOpen(false); }} className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left', isSel ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground')}>
                  <div className={cn('w-2 h-2 rounded-full shrink-0', DOT_COLOR[fn.color] ?? 'bg-primary')} />
                  <span className="text-[13px] font-medium flex-1 truncate">{t(fn.nameKey)}</span>
                  {isSel && <Check size={13} className="text-primary shrink-0" />}
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-5 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Mobile: full-screen module picker overlay ─── */
const MobileModulePicker: React.FC<{
  open: boolean;
  onClose: () => void;
  selectedModuleId: string;
  onSelectModule: (id: string) => void;
  t: (key: string) => string;
}> = ({ open, onClose, selectedModuleId, onSelectModule, t }) => {
  const [filterFn, setFilterFn] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(PERMISSION_FUNCTIONS.map((f) => f.id)));

  if (!open) return null;

  const displayed = filterFn ? PERMISSION_FUNCTIONS.filter((f) => f.id === filterFn) : PERMISSION_FUNCTIONS;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card shrink-0">
        <button onClick={onClose} className="p-1.5 -ml-1 rounded-lg hover:bg-muted">
          <ChevronLeft size={20} className="text-foreground" />
        </button>
        <span className="text-sm font-bold text-foreground flex-1">{t('permission.matrix.moduleList')}</span>
      </div>

      {/* Function filter chips */}
      <div className="flex gap-1.5 p-3 pb-2 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => { setFilterFn(null); setExpanded(new Set(PERMISSION_FUNCTIONS.map((f) => f.id))); }}
          className={cn('shrink-0 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors', !filterFn ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground')}
        >
          {t('common.all')}
        </button>
        {PERMISSION_FUNCTIONS.map((fn) => (
          <button
            key={fn.id}
            onClick={() => { setFilterFn(fn.id); setExpanded(new Set([fn.id])); }}
            className={cn('shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors', filterFn === fn.id ? 'bg-primary text-white border-primary' : 'bg-card border-border text-muted-foreground')}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', filterFn === fn.id ? 'bg-white/70' : (DOT_COLOR[fn.color] ?? 'bg-primary'))} />
            {t(fn.nameKey)}
          </button>
        ))}
      </div>

      {/* Module tree */}
      <div className="flex-1 overflow-y-auto pb-safe">
        {displayed.map((fn) => {
          const isExp = expanded.has(fn.id);
          return (
            <div key={fn.id}>
              <button
                onClick={() => setExpanded((prev) => { const n = new Set(prev); n.has(fn.id) ? n.delete(fn.id) : n.add(fn.id); return n; })}
                className={cn('w-full flex items-center gap-2.5 px-4 py-3 text-left border-b border-border/50', isExp ? 'bg-primary/[0.04]' : '')}
              >
                <div className={cn('w-1 h-5 rounded-full shrink-0', isExp ? 'bg-primary' : 'bg-border')} />
                <span className={cn('text-[13px] font-bold uppercase tracking-wide flex-1', isExp ? 'text-primary' : 'text-foreground/70')}>
                  {t(fn.nameKey)}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums mr-1">
                  {fn.groups.reduce((s, g) => s + g.modules.length, 0)}
                </span>
                <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', !isExp && '-rotate-90')} />
              </button>
              {isExp && fn.groups.map((gr) => (
                <div key={gr.groupTitleKey}>
                  <div className="px-4 pl-8 py-2 flex items-center gap-2">
                    <div className="w-4 h-px bg-muted-foreground/25 shrink-0" />
                    <span className="text-[11px] font-bold text-muted-foreground tracking-wide">{t(gr.groupTitleKey)}</span>
                  </div>
                  {gr.modules.map((m) => {
                    const isActive = selectedModuleId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => { onSelectModule(m.id); onClose(); }}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-4 pl-12 py-3 text-left border-b border-border/30 transition-colors active:bg-muted/60',
                          isActive ? 'bg-primary/10' : '',
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isActive ? 'bg-primary' : 'bg-muted-foreground/25')} />
                        <span className="flex-1 min-w-0">
                          <span className={cn('text-[13px] block', isActive ? 'text-primary font-semibold' : 'text-foreground')}>{t(m.nameKey)}</span>
                          <span className={cn('font-mono text-[10px] block', isActive ? 'text-primary/50' : 'text-muted-foreground/40')}>{getModuleSlug(m.id)}</span>
                        </span>
                        {isActive && <Check size={16} className="text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Mobile tri-state button ─── */
const MobileTriBtn: React.FC<{
  label: string;
  state: 'none' | 'some' | 'all';
  onClick: () => void;
}> = ({ label, state, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center justify-center gap-1.5 px-1 py-2.5 rounded-lg border text-[11px] font-semibold transition-all active:scale-95',
      state === 'all'
        ? 'bg-primary/15 border-primary/30 text-primary'
        : state === 'some'
          ? 'bg-primary/8 border-primary/20 text-primary/70'
          : 'bg-muted/30 border-border text-muted-foreground',
    )}
  >
    <span className={cn(
      'w-[18px] h-[18px] rounded flex items-center justify-center shrink-0',
      state === 'all' ? 'bg-primary text-white' : state === 'some' ? 'bg-primary/40 text-white' : 'bg-muted border border-border',
    )}>
      {state === 'all' && <Check size={11} strokeWidth={3} />}
      {state === 'some' && <Minus size={11} strokeWidth={3} />}
    </span>
    {label}
  </button>
);

/* ─── Main Component ─── */
const PermissionMatrix: React.FC<Props> = ({ roles, isLoading, canUpdate = true }) => {
  const { t } = useTranslation();
  const [selectedFunction, setSelectedFunction] = useState<PermissionFunction | null>(null);
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(() => new Set(PERMISSION_FUNCTIONS.map((f) => f.id)));
  const [selectedModuleId, setSelectedModuleId] = useState<string>(getFirstModuleId);
  const [localPermissions, setLocalPermissions] = useState<Record<string, ActionType[]>>({});
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const updateMutation = useUpdateModulePermissions();

  const selectedModule = useMemo(() => SYSTEM_MODULES_CONFIG.find((m) => m.id === selectedModuleId), [selectedModuleId]);
  const displayModuleName = selectedModule ? t(selectedModule.nameKey) : selectedModuleId;

  useEffect(() => {
    const p: Record<string, ActionType[]> = {};
    roles.forEach((role) => {
      const mp = role.quyen_han.find((q) => q.module_id === selectedModuleId);
      p[role.id] = mp ? syncAll([...mp.actions]) : [];
    });
    setLocalPermissions(p);
  }, [selectedModuleId, roles]);

  const actionLabels: Record<string, string> = {
    view: t('permission.form.view'), create: t('permission.form.add'),
    update: t('permission.form.edit'), delete: t('permission.form.delete'),
    admin: t('permission.matrix.admin'), all: t('permission.form.all'),
  };

  const filteredFunctions = useMemo(() => selectedFunction ? PERMISSION_FUNCTIONS.filter((f) => f.id === selectedFunction.id) : PERMISSION_FUNCTIONS, [selectedFunction]);

  const groupedRoles = useMemo(() => {
    const groups: Record<string, PositionPermission[]> = {};
    const deptOrder: Record<string, number> = {};
    roles.forEach((role) => {
      const dept = role.ten_phong_ban || t('permission.matrix.otherDept');
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(role);
      const o = role.thu_tu_phong_ban ?? 9999;
      if (deptOrder[dept] === undefined || o < deptOrder[dept]) deptOrder[dept] = o;
    });
    const sortedDepts = Object.keys(groups).sort((a, b) => (deptOrder[a] ?? 9999) - (deptOrder[b] ?? 9999));
    sortedDepts.forEach((d) => groups[d].sort((a, b) => (a.thu_tu_chuc_vu ?? 9999) - (b.thu_tu_chuc_vu ?? 9999)));
    return { groups, sortedDepts };
  }, [roles, t]);

  const toggleOne = (roleId: string, action: ActionType) => {
    setLocalPermissions((prev) => {
      const cur = prev[roleId] || [];
      if (action === 'all') return { ...prev, [roleId]: cur.includes('all') ? [] : [...MATRIX_ACTIONS] };
      const toggled = cur.includes(action) ? cur.filter((a) => a !== action) : [...cur, action];
      return { ...prev, [roleId]: syncAll(toggled) };
    });
  };

  const toggleActionForRoles = (roleIds: string[], action: ActionType) => {
    setLocalPermissions((prev) => {
      if (action === 'all') {
        const allHave = roleIds.every((id) => (prev[id] || []).includes('all'));
        const next = { ...prev };
        roleIds.forEach((id) => { next[id] = allHave ? [] : [...MATRIX_ACTIONS]; });
        return next;
      }
      const allHave = roleIds.every((id) => (prev[id] || []).includes(action));
      const next = { ...prev };
      roleIds.forEach((id) => {
        const cur = next[id] || [];
        next[id] = syncAll(allHave ? cur.filter((a) => a !== action) : cur.includes(action) ? cur : [...cur, action]);
      });
      return next;
    });
  };

  const getActionState = (roleIds: string[], action: ActionType): 'none' | 'some' | 'all' => {
    const w = roleIds.filter((id) => (localPermissions[id] || []).includes(action));
    return w.length === 0 ? 'none' : w.length === roleIds.length ? 'all' : 'some';
  };

  const handleSave = () => {
    updateMutation.mutate({
      moduleId: selectedModuleId,
      updates: Object.entries(localPermissions).map(([roleId, actions]) => ({ roleId, actions })),
    });
  };

  const toggleFunctionExpand = (id: string) => {
    setExpandedFunctions((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const allRoleIds = roles.map((r) => r.id);

  if (isLoading) return <div className="flex-1 flex items-center justify-center min-h-[200px]"><LoadingSpinnerWithText text={t('permission.matrix.loading')} centered /></div>;

  return (
    <>
      {/* Mobile module picker overlay */}
      <MobileModulePicker
        open={mobilePickerOpen}
        onClose={() => setMobilePickerOpen(false)}
        selectedModuleId={selectedModuleId}
        onSelectModule={setSelectedModuleId}
        t={t}
      />

      <div className="flex flex-col lg:flex-row h-full gap-3 lg:gap-5 overflow-hidden">
        {/* ─── Desktop Sidebar (ẩn trên mobile) ─── */}
        <div className="hidden lg:flex w-[280px] xl:w-[300px] flex-col shrink-0">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-2.5 border-b border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <Filter size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('permission.matrix.quickSelectFunction')}</span>
              </div>
              <FunctionDropdown selected={selectedFunction} onSelect={(fn) => {
                setSelectedFunction(fn);
                if (fn) setExpandedFunctions((prev) => new Set([...prev, fn.id]));
                else setExpandedFunctions(new Set(PERMISSION_FUNCTIONS.map((f) => f.id)));
              }} t={t} />
            </div>

            <div className="overflow-y-auto no-scrollbar flex-1 py-1">
              {filteredFunctions.map((fn) => {
                const isExp = expandedFunctions.has(fn.id);
                return (
                  <div key={fn.id}>
                    <button onClick={() => toggleFunctionExpand(fn.id)} className={cn('w-full flex items-center gap-2 px-3 py-[7px] transition-colors text-left', isExp ? 'bg-primary/[0.06] dark:bg-primary/10' : 'hover:bg-muted/50')}>
                      <div className={cn('w-1 h-4 rounded-full shrink-0', isExp ? 'bg-primary' : 'bg-border')} />
                      <span className={cn('text-[12px] font-bold uppercase tracking-wide flex-1 truncate', isExp ? 'text-primary' : 'text-foreground/70')}>{t(fn.nameKey)}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 w-5 text-right">{fn.groups.reduce((s, g) => s + g.modules.length, 0)}</span>
                      <ChevronDown size={12} className={cn('text-muted-foreground transition-transform shrink-0', !isExp && '-rotate-90')} />
                    </button>
                    {isExp && (
                      <div className="ml-[18px] border-l border-border/70">
                        {fn.groups.map((gr) => (
                          <div key={gr.groupTitleKey}>
                            <div className="flex items-center gap-1.5 pl-3 pr-2 pt-2 pb-1">
                              <div className="w-3 h-px bg-muted-foreground/30 shrink-0" />
                              <span className="text-[10.5px] font-bold text-muted-foreground tracking-wide truncate">{t(gr.groupTitleKey)}</span>
                            </div>
                            {gr.modules.map((m) => {
                              const isActive = selectedModuleId === m.id;
                              return (
                                <button key={m.id} onClick={() => setSelectedModuleId(m.id)} className={cn('w-full flex items-start gap-1.5 pl-5 pr-2 py-[5px] transition-all text-left', isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 font-normal')}>
                                  <span className={cn('w-1 h-1 rounded-full shrink-0 mt-[6px]', isActive ? 'bg-primary' : 'bg-muted-foreground/30')} />
                                  <span className="flex-1 min-w-0">
                                    <span className="text-[12px] block truncate">{t(m.nameKey)}</span>
                                    <span className={cn('font-mono text-[9.5px] block truncate', isActive ? 'text-primary/50' : 'text-muted-foreground/40')}>{getModuleSlug(m.id)}</span>
                                  </span>
                                  {isActive && <ChevronRight size={10} className="text-primary shrink-0 mt-[5px]" />}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Matrix ─── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">

            {/* Header: mobile = module selector button + save */}
            <div className="p-3 lg:p-4 border-b border-border bg-muted/30 flex items-center gap-3">
              {/* Mobile: tap to open module picker */}
              <button
                onClick={() => setMobilePickerOpen(true)}
                className="lg:hidden flex items-center gap-2 flex-1 min-w-0 p-2 -m-2 rounded-lg active:bg-muted/50"
              >
                <Shield size={16} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-bold text-foreground truncate">{displayModuleName}</p>
                  <p className="text-[10px] text-muted-foreground">{t('permission.matrix.moduleList')} &rsaquo;</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </button>
              {/* Desktop: title */}
              <div className="hidden lg:block flex-1 min-w-0">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2 truncate">
                  {t('permission.matrix.setupTitle')} <span className="text-primary truncate">{displayModuleName}</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t('permission.matrix.setupDesc')}</p>
              </div>
              {canUpdate && (
                <Button onClick={handleSave} isLoading={updateMutation.isPending} className="bg-primary text-white shadow-xl h-9 px-4 lg:px-5 rounded-lg font-bold text-xs lg:text-sm shrink-0">
                  <Save size={14} className="mr-1.5" />
                  <span className="hidden sm:inline">{t('common.saveChanges')}</span>
                  <span className="sm:hidden">Lưu</span>
                </Button>
              )}
            </div>

            {/* ─── Desktop: Table ─── */}
            <div className="flex-1 overflow-auto custom-scrollbar hidden md:block">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b-2 border-border">
                  <tr>
                    <th className="px-6 py-2.5 text-left text-[11px] font-semibold text-muted-foreground w-[220px]">{t('permission.matrix.position')}</th>
                    {MATRIX_ACTIONS.map((a) => <th key={a} className="px-2 py-2.5 text-center text-[11px] font-semibold text-muted-foreground">{actionLabels[a]}</th>)}
                  </tr>
                  <tr className="border-t border-border bg-muted/20">
                    <td className="px-6 py-2 text-[11px] font-bold text-primary/80">{t('permission.matrix.selectAll')}</td>
                    {MATRIX_ACTIONS.map((a) => <td key={a} className="px-1 py-2 text-center"><TriCheck state={getActionState(allRoleIds, a)} disabled={!canUpdate} onClick={() => toggleActionForRoles(allRoleIds, a)} /></td>)}
                  </tr>
                </thead>
                <tbody>
                  {groupedRoles.sortedDepts.map((dept) => {
                    const dr = groupedRoles.groups[dept]; const dids = dr.map((r) => r.id);
                    return (
                      <React.Fragment key={dept}>
                        <tr className="bg-muted/40 border-t-2 border-border">
                          <td className="px-6 py-2"><span className="flex items-center gap-1.5 font-bold text-[12px] text-foreground/80"><Building2 size={13} className="text-primary shrink-0" />{t(dept)}</span></td>
                          {MATRIX_ACTIONS.map((a) => <td key={a} className="px-1 py-2 text-center"><TriCheck state={getActionState(dids, a)} disabled={!canUpdate} onClick={() => toggleActionForRoles(dids, a)} /></td>)}
                        </tr>
                        {dr.map((role, ri) => {
                          const cur = localPermissions[role.id] || []; const isLast = ri === dr.length - 1;
                          return (
                            <tr key={role.id} className="hover:bg-muted/20 transition-colors border-t border-border/50">
                              <td className="px-6 py-2 pl-8">
                                <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                                  <span className="flex flex-col items-center shrink-0 w-3 self-stretch">
                                    <span className="w-px flex-1 bg-border" />
                                    <span className="w-1.5 h-1.5 rounded-full border-2 border-primary/40 bg-card shrink-0" />
                                    {!isLast && <span className="w-px flex-1 bg-border" />}
                                  </span>
                                  {role.ten_chuc_vu}
                                </span>
                              </td>
                              {MATRIX_ACTIONS.map((a) => <td key={a} className="px-1 py-2 text-center"><TriCheck state={cur.includes(a) ? 'all' : 'none'} disabled={!canUpdate} onClick={() => toggleOne(role.id, a)} /></td>)}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ─── Mobile: Card view ─── */}
            <div className="flex-1 overflow-auto custom-scrollbar md:hidden p-3 space-y-2.5">
              {/* Select all */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCheck size={14} className="text-primary" />
                  <span className="text-[12px] font-bold text-primary">{t('permission.matrix.selectAll')}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MATRIX_ACTIONS.map((a) => <MobileTriBtn key={a} label={actionLabels[a]} state={getActionState(allRoleIds, a)} onClick={() => toggleActionForRoles(allRoleIds, a)} />)}
                </div>
              </div>

              {groupedRoles.sortedDepts.map((dept) => {
                const dr = groupedRoles.groups[dept]; const dids = dr.map((r) => r.id);
                return (
                  <div key={dept} className="space-y-1.5">
                    <div className="bg-muted/40 border border-border rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 size={14} className="text-primary shrink-0" />
                        <span className="text-[12px] font-bold text-foreground/80 flex-1 truncate">{t(dept)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {MATRIX_ACTIONS.map((a) => <MobileTriBtn key={a} label={actionLabels[a]} state={getActionState(dids, a)} onClick={() => toggleActionForRoles(dids, a)} />)}
                      </div>
                    </div>
                    {dr.map((role) => {
                      const cur = localPermissions[role.id] || [];
                      return (
                        <div key={role.id} className="bg-card border border-border rounded-xl p-3 ml-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                            <span className="text-[12px] font-semibold text-foreground flex-1 truncate">{role.ten_chuc_vu}</span>
                            <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{role.ma_chuc_vu}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {MATRIX_ACTIONS.map((a) => (
                              <MobileTriBtn key={a} label={actionLabels[a]} state={cur.includes(a) ? 'all' : 'none'} onClick={() => toggleOne(role.id, a)} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PermissionMatrix;
