
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Check, Star, Briefcase, Minus } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { roleSchema, RoleFormValues } from '../core/schema';
import { PositionPermission, ModulePermission, ActionType } from '../core/types';
import { hasApproveFeature } from '../core/permission-modules-config';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { SYSTEM_MODULES_CONFIG } from '../services/phan-quyen-service';
import { useCreateRole, useUpdateRole } from '../hooks/use-phan-quyen';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';

interface Props {
  initialData?: PositionPermission | null;
  onClose: () => void;
}

const RoleForm: React.FC<Props> = ({ initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;

  // 6 quyền cơ bản + Phê duyệt (chỉ hiển thị cho module có chức năng phê duyệt)
  const ALL_ACTION_COLUMNS: { id: ActionType; label: string; isSpecial?: boolean }[] = [
    { id: 'view', label: t('permission.form.view') },
    { id: 'create', label: t('permission.form.add') },
    { id: 'update', label: t('permission.form.edit') },
    { id: 'delete', label: t('permission.form.delete') },
    { id: 'approve', label: t('permission.form.approve') },
    { id: 'admin', label: t('permission.matrix.admin'), isSpecial: true },
    { id: 'all', label: t('permission.form.all'), isSpecial: true },
  ];
  const createMutation = useCreateRole(onClose);
  const updateMutation = useUpdateRole(onClose);

  const [permissions, setPermissions] = useState<ModulePermission[]>(
      SYSTEM_MODULES_CONFIG.map(m => ({ module_id: m.id, module_name: m.nameKey, actions: [] }))
  );
  /** Ma trận quyền nằm ngoài react-hook-form nên isDirty của form không thấy — theo dõi riêng. */
  const [permissionsDirty, setPermissionsDirty] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { ma_vai_tro: '', ten_vai_tro: '', mo_ta: '', trang_thai: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_vai_tro: initialData.ma_chuc_vu,
        ten_vai_tro: initialData.ten_chuc_vu,
        mo_ta: initialData.mo_ta || '',
        trang_thai: initialData.trang_thai,
      });
      setPermissions(initialData.quyen_han);
    }
  }, [initialData, reset]);

  const toggleAction = (moduleId: string, action: ActionType) => {
      setPermissionsDirty(true);
      setPermissions(prev => prev.map(p => {
          if (p.module_id === moduleId) {
              const hasAction = p.actions.includes(action);
              return {
                  ...p,
                  actions: hasAction ? p.actions.filter(a => a !== action) : [...p.actions, action]
              };
          }
          return p;
      }));
  };

  const toggleFullModule = (moduleId: string) => {
      const config = SYSTEM_MODULES_CONFIG.find(m => m.id === moduleId);
      if (!config) return;

      setPermissionsDirty(true);
      setPermissions(prev => prev.map(p => {
          if (p.module_id === moduleId) {
              const isFull = p.actions.length === config.allowedActions.length;
              return {
                  ...p,
                  actions: isFull ? [] : [...config.allowedActions]
              };
          }
          return p;
      }));
  };

  const onSubmit = (data: RoleFormValues) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data, permissions });
    } else {
      createMutation.mutate({ data, permissions });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const renderFooter = (
      <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading} className="flex-1 border-border">{t('common.cancelAction')}</Button>
          <Button type="submit" form="role-form" isLoading={isLoading} size="sm" className="flex-[2] bg-primary text-white shadow-lg">
            <Save className="mr-2 h-4 w-4" /> {isEdit ? t('permission.form.update') : t('permission.form.create')}
          </Button>
      </>
  );

  return (
    <GenericDrawer
        isDirty={isDirty || permissionsDirty}
        title={isEdit ? t('permission.form.editTitle') : t('permission.form.createTitle')}
        subtitle={t('permission.form.subtitle')}
        icon={<Briefcase size={20} />}
        onClose={onClose}
        footer={renderFooter}
        maxWidthClass={DRAWER_WIDTH_FORM}
    >
          <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             <div className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-sm space-y-4">
                <h4 className="text-xs font-medium text-muted-foreground border-b border-border pb-2">{t('permission.form.infoSection')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label={t('permission.form.codeLabel')} placeholder={t('permission.form.codePlaceholder')} {...register('ma_vai_tro')} error={errors.ma_vai_tro?.message} />
                    <Input label={t('permission.form.nameLabel')} placeholder={t('permission.form.namePlaceholder')} {...register('ten_vai_tro')} error={errors.ten_vai_tro?.message} />
                </div>
             </div>

             <div className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">{t('permission.form.matrixTitle')}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('permission.form.matrixHint')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <span className="w-2.5 h-2.5 rounded bg-primary"></span> {t('permission.form.legendAction')}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> {t('permission.form.legendApproval')}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-5 sm:mx-0">
                    <table className="w-full text-sm border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-muted/50">
                                <th className="py-3 text-left font-medium text-xs text-muted-foreground px-4 rounded-tl-xl border-b border-border">{t('permission.form.moduleHeader')}</th>
                                {ALL_ACTION_COLUMNS.map(a => (
                                    <th key={a.id} className="py-3 text-center font-medium text-xs text-muted-foreground border-b border-border">{a.label}</th>
                                ))}
                                <th className="py-3 text-center font-medium text-xs text-muted-foreground px-4 rounded-tr-xl border-b border-border">{t('permission.form.all')}</th>
                            </tr>
                        </thead>
                            <tbody className="divide-y divide-border/50 [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border/50">
                            {SYSTEM_MODULES_CONFIG.map((moduleConfig) => {
                                const userPerm = permissions.find(p => p.module_id === moduleConfig.id);
                                const isFull = userPerm?.actions.length === moduleConfig.allowedActions.length && moduleConfig.allowedActions.length > 0;
                                
                                return (
                                    <tr key={moduleConfig.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="py-4 px-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">{t(moduleConfig.nameKey)}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{moduleConfig.id}</span>
                                            </div>
                                        </td>
                                        {ALL_ACTION_COLUMNS.map(col => {
                                            const isAllowed = col.id === 'approve' ? hasApproveFeature(moduleConfig.id) : moduleConfig.allowedActions.includes(col.id);
                                            const isChecked = userPerm?.actions.includes(col.id);
                                            
                                            if (!isAllowed) {
                                                return (
                                                    <td key={col.id} className="py-4 text-center">
                                                        <div className="flex justify-center text-muted-foreground/70">
                                                            <Minus size={14} />
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={col.id} className="py-4 text-center px-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleAction(moduleConfig.id, col.id)}
                                                        className={`w-6 h-6 mx-auto rounded-md border flex items-center justify-center transition-all ${
                                                            isChecked 
                                                            ? col.isSpecial ? 'bg-amber-500 border-amber-500 text-white shadow-sm ring-2 ring-amber-100' : 'bg-primary border-primary text-white shadow-sm' 
                                                            : 'bg-card border-border text-muted-foreground/70 hover:border-primary/50 hover:text-primary/50'
                                                        }`}
                                                    >
                                                        {isChecked ? (
                                                            col.isSpecial ? <Star size={10} fill="white" /> : <Check size={12} strokeWidth={4} />
                                                        ) : (
                                                            <div className="w-1 h-1 rounded-full bg-current opacity-30"></div>
                                                        )}
                                                    </button>
                                                </td>
                                            )
                                        })}
                                        <td className="py-4 text-center px-4">
                                            <button
                                                type="button"
                                                onClick={() => toggleFullModule(moduleConfig.id)}
                                                className={`text-xs px-2 py-1 rounded-full font-medium transition-all border ${
                                                    isFull 
                                                    ? 'bg-foreground border-foreground text-background' 
                                                    : 'bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                                                }`}
                                            >
                                                {isFull ? 'All' : 'Set'}
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
             </div>
          </form>
    </GenericDrawer>
  );
};

export default RoleForm;
