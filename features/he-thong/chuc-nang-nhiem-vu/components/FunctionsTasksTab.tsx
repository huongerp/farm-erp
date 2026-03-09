import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Plus, Layers } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import {
  useOneMissionByDepartment,
  useFunctionsByDepartment,
  useTasksByDepartment,
  useDeleteFunctions,
  useDeleteTasks,
  useUpdateFunctionStatus,
  useUpdateTaskStatus,
} from '../hooks/use-chuc-nang-nhiem-vu';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { useAuthStore } from '../../../../store/useStore';
import { CONFIRM_DELETE } from '../../../../lib/button-labels';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import MissionSection from './MissionSection';
import FunctionWithTasksCard from './FunctionWithTasksCard';
import FunctionDetailDrawer from './FunctionDetailDrawer';
import TaskDetailDrawer from './TaskDetailDrawer';
import MissionForm from './MissionForm';
import FunctionForm from './FunctionForm';
import TaskForm from './TaskForm';
import type { DeptMission, DeptFunction, Task } from '../core/types';
import { cn } from '../../../../lib/utils';

const FunctionsTasksTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const user = useAuthStore((s) => s.user);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [showFunctionForm, setShowFunctionForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingMission, setEditingMission] = useState<DeptMission | null>(null);
  const [editingFunction, setEditingFunction] = useState<DeptFunction | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  /** Khi thêm nhiệm vụ từ trong 1 chức năng, preset id_chuc_nang */
  const [presetIdChucNangForTask, setPresetIdChucNangForTask] = useState<string | null>(null);
  /** Chức năng đang xem detail (drawer) */
  const [viewingFunction, setViewingFunction] = useState<DeptFunction | null>(null);
  /** Nhiệm vụ đang xem detail (drawer) */
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const { data: departments = [] } = useDepartments();
  const { data: oneMission = null, isLoading: missionLoading } = useOneMissionByDepartment(selectedDeptId);
  const { data: functions = [], isLoading: functionsLoading } = useFunctionsByDepartment(selectedDeptId);
  const { data: tasks = [], isLoading: tasksLoading } = useTasksByDepartment(selectedDeptId);

  /** Chỉ lấy phòng ban cấp độ = 1 */
  const departmentsLevel1 = useMemo(
    () => departments.filter((d) => d.cap_do === 1),
    [departments]
  );
  /** Sắp xếp theo thứ tự (thu_tu) */
  const sortedDepartments = useMemo(
    () => [...departmentsLevel1].sort((a, b) => a.thu_tu - b.thu_tu),
    [departmentsLevel1]
  );

  /** Tự chọn phòng ban của user: ưu tiên id_phong_ban của user (hoặc phòng cấp 1 cha nếu user thuộc nhóm con), sau đó mới thu_tu nhỏ nhất */
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

  const deleteFunctionsMutation = useDeleteFunctions();
  const deleteTasksMutation = useDeleteTasks();
  const updateFunctionStatusMutation = useUpdateFunctionStatus();
  const updateTaskStatusMutation = useUpdateTaskStatus();

  const tasksByFunction = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!map[task.id_chuc_nang]) map[task.id_chuc_nang] = [];
      map[task.id_chuc_nang].push(task);
    });
    Object.keys(map).forEach((id) => map[id].sort((a, b) => a.thu_tu - b.thu_tu));
    return map;
  }, [tasks]);

  const handleEditMission = (m: DeptMission | null) => {
    setEditingMission(m ?? null);
    setShowMissionForm(true);
  };

  const handleAddFunction = () => {
    setEditingFunction(null);
    setShowFunctionForm(true);
  };

  const handleEditFunction = (fn: DeptFunction) => {
    setEditingFunction(fn);
    setShowFunctionForm(true);
  };

  const handleDeleteFunction = (id: string) => {
    confirm({
      title: t('chucNangNhiemVu.deleteFunctionTitle'),
      message: t('chucNangNhiemVu.deleteFunctionMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteFunctionsMutation.mutate([id]),
    });
  };

  const handleStatusChangeFunction = (item: DeptFunction) => {
    const newStatus = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    updateFunctionStatusMutation.mutate({ ids: [item.id], status: newStatus });
  };

  const handleAddTask = (idChucNang: string) => {
    setPresetIdChucNangForTask(idChucNang);
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setPresetIdChucNangForTask(null);
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (id: string) => {
    confirm({
      title: t('chucNangNhiemVu.deleteTaskTitle'),
      message: t('chucNangNhiemVu.deleteTaskMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => deleteTasksMutation.mutate([id]),
    });
  };

  const handleStatusChangeTask = (item: Task) => {
    const newStatus = item.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    updateTaskStatusMutation.mutate({ ids: [item.id], status: newStatus });
  };

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* Cột trái: Chỉ hiện phòng */}
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

      {/* Cột phải: Sứ mệnh + Chức năng (có bảng con nhiệm vụ) */}
      <div className="flex-1 min-w-0 flex flex-col gap-4 overflow-auto">
        {!selectedDeptId ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
            {t('chucNangNhiemVu.emptySelectDepartment')}
          </div>
        ) : (
          <>
            <MissionSection
              mission={oneMission}
              isLoading={missionLoading}
              selectedDeptId={selectedDeptId}
              onEdit={handleEditMission}
            />

            <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
                <div className="flex items-center gap-2 shrink-0">
                  <Layers size={14} className="text-primary" />
                  <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
                    {t('chucNangNhiemVu.functions')}
                  </h4>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                    {functionsLoading ? '—' : functions.length} {t('chucNangNhiemVu.functionCountLabel')}
                  </span>
                </div>
                <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddFunction}
                  className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0"
                >
                  <Plus size={14} className="mr-1.5" />
                  {t('chucNangNhiemVu.addFunction')}
                </Button>
              </div>
              {functionsLoading ? (
                <div className="py-6 text-center text-muted-foreground text-sm">Đang tải...</div>
              ) : functions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t('chucNangNhiemVu.emptyFunctions')}</p>
              ) : (
                <div className="space-y-4">
                  {functions.map((fn) => (
                    <FunctionWithTasksCard
                      key={fn.id}
                      fn={fn}
                      tasks={tasksByFunction[fn.id] || []}
                      onViewFunction={setViewingFunction}
                      onEditFunction={handleEditFunction}
                      onDeleteFunction={handleDeleteFunction}
                      onStatusChangeFunction={handleStatusChangeFunction}
                      onAddTask={handleAddTask}
                      onViewTask={setViewingTask}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onStatusChangeTask={handleStatusChangeTask}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showMissionForm && (
          <MissionForm
            initialData={editingMission}
            defaultIdPhongBan={selectedDeptId}
            onClose={() => {
              setShowMissionForm(false);
              setEditingMission(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFunctionForm && (
          <FunctionForm
            initialData={editingFunction}
            defaultIdPhongBan={selectedDeptId}
            onClose={() => {
              setShowFunctionForm(false);
              setEditingFunction(null);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTaskForm && (
          <TaskForm
            initialData={editingTask}
            idPhongBan={selectedDeptId}
            defaultIdChucNang={presetIdChucNangForTask}
            onClose={() => {
              setShowTaskForm(false);
              setEditingTask(null);
              setPresetIdChucNangForTask(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingFunction && (
          <FunctionDetailDrawer
            data={viewingFunction}
            departmentName={departments.find((d) => d.id === viewingFunction.id_phong_ban)?.ten_phong_ban}
            tasks={tasksByFunction[viewingFunction.id] || []}
            onClose={() => setViewingFunction(null)}
            onEdit={(f) => {
              setViewingFunction(null);
              handleEditFunction(f);
            }}
            onDelete={(id) => {
              handleDeleteFunction(id);
              setViewingFunction(null);
            }}
            onStatusChange={(f) => {
              setViewingFunction(null);
              handleStatusChangeFunction(f);
            }}
            onAddTask={() => {
              setPresetIdChucNangForTask(viewingFunction.id);
              setEditingTask(null);
              setShowTaskForm(true);
            }}
            onViewTask={setViewingTask}
            onEditTask={(t) => {
              setViewingFunction(null);
              handleEditTask(t);
            }}
            onDeleteTask={(id) => {
              handleDeleteTask(id);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingTask && (
          <TaskDetailDrawer
            data={viewingTask}
            onClose={() => setViewingTask(null)}
            onEdit={(t) => {
              setViewingTask(null);
              handleEditTask(t);
            }}
            onDelete={(id) => {
              handleDeleteTask(id);
              setViewingTask(null);
            }}
            onStatusChange={(t) => {
              setViewingTask(null);
              handleStatusChangeTask(t);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FunctionsTasksTab;
