import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Target } from 'lucide-react';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import { useFunctionsByDepartment, useTasksByDepartment } from '../hooks/use-chuc-nang-nhiem-vu';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { useDeleteKpiIndicators } from '../hooks/use-kpi';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import FunctionKpiSection from './FunctionKpiSection';
import KpiForm from './KpiForm';
import KpiDetailDrawer from './KpiDetailDrawer';
import TaskForm from './TaskForm';
import type { Task } from '../core/types';
import type { KpiIndicator } from '../core/types';
import { cn } from '../../../../lib/utils';

const KpiIndicatorsTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  /** Nhiệm vụ được chọn khi bấm "Thêm chỉ số KPI" → truyền vào KpiForm làm defaultIdNhiemVu */
  const [contextTaskForForm, setContextTaskForForm] = useState<Task | null>(null);
  const [showKpiForm, setShowKpiForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  /** Khi thêm nhiệm vụ từ một chức năng, preset id_chuc_nang */
  const [presetIdChucNangForTask, setPresetIdChucNangForTask] = useState<string | null>(null);
  const [editingKpi, setEditingKpi] = useState<KpiIndicator | null>(null);
  const [viewingKpi, setViewingKpi] = useState<KpiIndicator | null>(null);

  const { data: departments = [] } = useDepartments();
  const { data: functions = [], isLoading: functionsLoading } = useFunctionsByDepartment(selectedDeptId);
  const { data: tasks = [], isLoading: tasksLoading } = useTasksByDepartment(selectedDeptId);

  const departmentsLevel1 = useMemo(
    () => departments.filter((d) => d.cap_do === 1),
    [departments]
  );
  const sortedDepartments = useMemo(
    () => [...departmentsLevel1].sort((a, b) => a.thu_tu - b.thu_tu),
    [departmentsLevel1]
  );

  useEffect(() => {
    if (sortedDepartments.length === 0) return;
    const ids = new Set(sortedDepartments.map((d) => d.id));
    const userDeptId = user?.id_phong_ban ?? null;
    let defaultDept = sortedDepartments[0];
    if (userDeptId && ids.has(userDeptId)) {
      defaultDept = sortedDepartments.find((d) => d.id === userDeptId) ?? defaultDept;
    } else if (userDeptId) {
      const userDept = departments.find((d) => d.id === userDeptId);
      if (userDept?.id_cha) {
        let root = departments.find((d) => d.id === userDept.id_cha) ?? null;
        while (root?.id_cha) root = departments.find((d) => d.id === root!.id_cha) ?? null;
        if (root && ids.has(root.id)) defaultDept = sortedDepartments.find((d) => d.id === root!.id) ?? defaultDept;
      }
    }
    if (selectedDeptId === null) {
      setSelectedDeptId(defaultDept.id);
      return;
    }
    if (!ids.has(selectedDeptId)) setSelectedDeptId(defaultDept.id);
  }, [departments, sortedDepartments, selectedDeptId, user?.id_phong_ban]);

  const deleteKpisMutation = useDeleteKpiIndicators();

  const tasksByFunction = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!map[task.id_chuc_nang]) map[task.id_chuc_nang] = [];
      map[task.id_chuc_nang].push(task);
    });
    Object.keys(map).forEach((id) => map[id].sort((a, b) => a.thu_tu - b.thu_tu));
    return map;
  }, [tasks]);

  const handleAddKpi = (task: Task) => {
    setContextTaskForForm(task);
    setEditingKpi(null);
    setShowKpiForm(true);
  };

  const handleViewKpi = (k: KpiIndicator) => {
    setViewingKpi(k);
  };

  const handleEditKpi = (k: KpiIndicator) => {
    setViewingKpi(null);
    setEditingKpi(k);
    setShowKpiForm(true);
  };

  const handleDeleteKpi = (id: string) => {
    confirm({
      title: t('chucNangNhiemVu.deleteKpiTitle'),
      message: t('chucNangNhiemVu.deleteKpiMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteKpisMutation.mutate([id]),
    });
  };

  /** Chỉ gọi mutate (KpiDetailDrawer đã confirm trước khi gọi onDelete) */
  const handleDeleteKpiFromDrawer = (id: string) => {
    deleteKpisMutation.mutate([id]);
  };

  const handleCloseKpiForm = () => {
    setShowKpiForm(false);
    setEditingKpi(null);
    setContextTaskForForm(null);
  };

  const handleAddTask = (fn: { id: string }) => {
    setPresetIdChucNangForTask(fn.id);
    setShowTaskForm(true);
  };

  const handleCloseTaskForm = () => {
    setShowTaskForm(false);
    setPresetIdChucNangForTask(null);
  };

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Cột trái: Phòng */}
      <div className="w-52 sm:w-60 shrink-0 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-2.5 border-b border-border bg-muted/40">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('chucNangNhiemVu.phong')}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sortedDepartments.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">{t('chucNangNhiemVu.emptySelectDepartment')}</p>
          ) : (
            <ul className="space-y-0.5">
              {sortedDepartments.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedDeptId(d.id)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors truncate',
                      selectedDeptId === d.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    {d.ten_phong_ban}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Cột phải: Layout 3 tầng – Chức năng (collapse) → Nhiệm vụ → KPI inline */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-auto">
        {!selectedDeptId ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
            {t('chucNangNhiemVu.emptySelectDepartment')}
          </div>
        ) : (
          <div className="w-full p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center gap-3 pb-2">
              <div className="flex items-center gap-2 shrink-0">
                <Target size={14} className="text-primary" />
                <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
                  {t('chucNangNhiemVu.tab.kpi')}
                </h4>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                  {functionsLoading ? '—' : functions.length} {t('chucNangNhiemVu.functionCountLabel')}
                </span>
              </div>
              <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
            </div>
            {functionsLoading || tasksLoading ? (
              <div className="py-6 text-center text-muted-foreground text-sm">{t('common.loading')}</div>
            ) : functions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{t('chucNangNhiemVu.emptyFunctions')}</p>
            ) : (
              <div className="space-y-3">
                {functions.map((fn) => (
                  <FunctionKpiSection
                    key={fn.id}
                    fn={fn}
                    tasks={tasksByFunction[fn.id] || []}
                    defaultExpanded
                    onAddTask={handleAddTask}
                    onAddKpi={handleAddKpi}
                    onViewKpi={handleViewKpi}
                    onEditKpi={handleEditKpi}
                    onDeleteKpi={handleDeleteKpi}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showTaskForm && selectedDeptId && (
          <TaskForm
            initialData={null}
            idPhongBan={selectedDeptId}
            defaultIdChucNang={presetIdChucNangForTask}
            onClose={handleCloseTaskForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showKpiForm && (
          <KpiForm
            initialData={editingKpi}
            defaultIdNhiemVu={contextTaskForForm?.id ?? undefined}
            onClose={handleCloseKpiForm}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingKpi && (
          <KpiDetailDrawer
            data={viewingKpi}
            onClose={() => setViewingKpi(null)}
            onEdit={(k) => {
              setViewingKpi(null);
              setEditingKpi(k);
              setShowKpiForm(true);
            }}
            onDelete={handleDeleteKpiFromDrawer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default KpiIndicatorsTab;
