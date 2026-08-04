
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building2, Briefcase, FileText, CircleDot, Save, X, MapPin } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import Combobox from '../../../../components/ui/Combobox';
import MultiSelect from '../../../../components/ui/MultiSelect';
import Button from '../../../../components/ui/Button';
import AvatarWithFallback from '../../../../components/ui/AvatarWithFallback';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import { useJobLevels } from '../../cap-bac/hooks/use-cap-bac';
import { useBranches } from '../../chi-nhanh/hooks/use-chi-nhanh';
import { CONTRACT_TYPE_OPTIONS, STATUS_OPTIONS } from '../core/constants';
import { useBulkUpdateEmployees } from '../hooks/use-nhan-vien';
import { Employee } from '../core/types';
import { TRANG_THAI } from '../../../../lib/constants';

export interface BulkEditFields {
  id_phong_ban?: string;
  id_chuc_vu?: string;
  id_cap_bac?: string;
  id_chi_nhanh?: string[];
  loai_hop_dong?: string;
  trang_thai?: string;
  noi_lam_viec?: string;
}

interface Props {
  selectedEmployees: Employee[];
  onClose: () => void;
  onSuccess: () => void;
}

const BulkEditSheet: React.FC<Props> = ({ selectedEmployees, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState<BulkEditFields>({});
  const [enabledFields, setEnabledFields] = useState<Set<keyof BulkEditFields>>(new Set());

  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { data: jobLevels = [] } = useJobLevels();
  const { data: branches = [] } = useBranches();
  const bulkMutation = useBulkUpdateEmployees(() => {
    onSuccess();
    onClose();
  });

  const departmentOptions = departments.map(d => ({ label: d.ten_phong_ban, value: d.id }));
  const positionOptions = positions.map(p => ({ label: p.ten_chuc_vu, value: p.id }));
  const jobLevelOptions = jobLevels.filter((l: any) => l.trang_thai === TRANG_THAI.DANG_DUNG).map((l: any) => ({ label: l.ten_cap_bac, value: l.id }));
  const branchOptions = branches.filter(b => b.trang_thai === TRANG_THAI.DANG_DUNG).map(b => ({ label: b.ten_chi_nhanh, value: b.id }));
  const contractOptions = CONTRACT_TYPE_OPTIONS;
  const statusOptions = STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }));

  const toggleField = (field: keyof BulkEditFields) => {
    const next = new Set(enabledFields);
    if (next.has(field)) {
      next.delete(field);
      const nextFields = { ...fields };
      delete nextFields[field];
      setFields(nextFields);
    } else {
      next.add(field);
    }
    setEnabledFields(next);
  };

  const handleSubmit = () => {
    const ids = selectedEmployees.map(e => e.id);
    const payload: Partial<BulkEditFields> = {};
    enabledFields.forEach(key => {
      const val = fields[key];
      if (val === undefined) return;
      if (key === 'id_chi_nhanh') {
        if (Array.isArray(val) && val.length > 0) payload[key] = val;
      } else if (val !== '') {
        payload[key] = val as BulkEditFields[typeof key];
      }
    });
    if (Object.keys(payload).length === 0) return;
    bulkMutation.mutate({ ids, fields: payload });
  };

  const hasChanges = enabledFields.size > 0 && Array.from(enabledFields).some(k => {
    const v = fields[k];
    return k === 'id_chi_nhanh' ? (Array.isArray(v) && v.length > 0) : (v !== undefined && v !== '');
  });

  const renderFieldToggle = (field: keyof BulkEditFields, label: string) => (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={enabledFields.has(field)}
        onChange={() => toggleField(field)}
        className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
      />
      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </label>
  );

  const footer = (
    <div className="flex items-center justify-between w-full gap-3">
      <Button variant="outline" onClick={onClose} className="border-border text-muted-foreground">
        <X size={16} className="mr-2" /> {t('common.cancel')}
      </Button>
      <Button
        onClick={handleSubmit}
        isLoading={bulkMutation.isPending}
        disabled={!hasChanges}
        className="bg-primary text-white shadow-lg"
      >
        <Save size={16} className="mr-2" /> {t('employee.bulk.applyButton', { count: selectedEmployees.length })}
      </Button>
    </div>
  );

  return (
    <GenericDrawer
      title={t('employee.bulk.title')}
      subtitle={`${selectedEmployees.length} ${t('employee.bulk.subtitle')}`}
      icon={<Users size={20} />}
      onClose={onClose}
      footer={footer}
      maxWidthClass="sm:w-[36rem] sm:min-w-[36rem] sm:max-w-[36rem]"
    >
      <div className="space-y-1">
        {/* Danh sách nhân viên được chọn */}
        <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">{t('employee.bulk.selectedLabel')}</p>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
            {selectedEmployees.map(emp => (
              <span key={emp.id} className="inline-flex items-center gap-1.5 bg-card border border-border rounded-lg px-2 py-1 text-xs">
                <AvatarWithFallback src={emp.anh_dai_dien} name={emp.ho_ten} seed={emp.id} size="xs" alt={emp.ho_ten} />
                <span className="font-medium text-foreground">{emp.ho_ten}</span>
                <span className="text-muted-foreground">({emp.ma_nhan_vien})</span>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-600 font-bold text-lg leading-none shrink-0">!</span>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
            {t('employee.bulk.warning')}
          </p>
        </div>

        {/* Các trường có thể chỉnh sửa */}
        <FormSection title={t('employee.bulk.workSection')} icon={<Briefcase size={14} />}>
          <div className="space-y-4">
            <div className="space-y-2">
              {renderFieldToggle('id_phong_ban', t('employee.bulk.changeDepartment'))}
              {enabledFields.has('id_phong_ban') && (
                <Combobox
                  options={departmentOptions}
                  value={fields.id_phong_ban || ''}
                  onChange={(val) => setFields(prev => ({ ...prev, id_phong_ban: val }))}
                  placeholder={t('employee.form.departmentPlaceholder')}
                  icon={<Building2 size={16} className="text-muted-foreground" />}
                />
              )}
            </div>
            <div className="space-y-2">
              {renderFieldToggle('id_chi_nhanh', t('employee.bulk.changeBranch'))}
              {enabledFields.has('id_chi_nhanh') && (
                <MultiSelect
                  options={branchOptions}
                  value={Array.isArray(fields.id_chi_nhanh) ? fields.id_chi_nhanh : []}
                  onChange={(val) => setFields(prev => ({ ...prev, id_chi_nhanh: val }))}
                  placeholder={t('employee.form.branchPlaceholder')}
                  icon={MapPin}
                  size="md"
                />
              )}
            </div>
            <div className="space-y-2">
              {renderFieldToggle('id_chuc_vu', t('employee.bulk.changePosition'))}
              {enabledFields.has('id_chuc_vu') && (
                <Combobox
                  options={positionOptions}
                  value={fields.id_chuc_vu || ''}
                  onChange={(val) => setFields(prev => ({ ...prev, id_chuc_vu: val }))}
                  placeholder={t('employee.form.positionPlaceholder')}
                  icon={<Briefcase size={16} className="text-muted-foreground" />}
                />
              )}
            </div>
            <div className="space-y-2">
              {renderFieldToggle('id_cap_bac', t('employee.bulk.changeLevel'))}
              {enabledFields.has('id_cap_bac') && (
                <Combobox
                  options={jobLevelOptions}
                  value={fields.id_cap_bac || ''}
                  onChange={(val) => setFields(prev => ({ ...prev, id_cap_bac: val }))}
                  placeholder={t('employee.form.levelPlaceholder')}
                />
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title={t('employee.bulk.contractSection')} icon={<FileText size={14} />}>
          <div className="space-y-4">
            <div className="space-y-2">
              {renderFieldToggle('loai_hop_dong', t('employee.bulk.changeContract'))}
              {enabledFields.has('loai_hop_dong') && (
                <Combobox
                  options={contractOptions}
                  value={fields.loai_hop_dong || ''}
                  onChange={(val) => setFields(prev => ({ ...prev, loai_hop_dong: val }))}
                  placeholder={t('employee.form.contractTypePlaceholder')}
                  icon={<FileText size={16} className="text-muted-foreground" />}
                  searchable={false}
                />
              )}
            </div>
            <div className="space-y-2">
              {renderFieldToggle('trang_thai', t('employee.bulk.changeStatus'))}
              {enabledFields.has('trang_thai') && (
                <Combobox
                  options={statusOptions}
                  value={fields.trang_thai ?? ''}
                  onChange={(val) => setFields(prev => ({ ...prev, trang_thai: val }))}
                  placeholder={t('employee.form.workStatusPlaceholder')}
                  icon={<CircleDot size={16} className="text-muted-foreground" />}
                  searchable={false}
                />
              )}
            </div>
          </div>
        </FormSection>
      </div>
    </GenericDrawer>
  );
};

export default BulkEditSheet;
