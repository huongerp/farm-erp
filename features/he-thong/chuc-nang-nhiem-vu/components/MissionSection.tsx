import React from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Edit } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Section from '../../../../components/shared/Section';
import type { DeptMission } from '../core/types';

interface Props {
  mission: DeptMission | null;
  isLoading: boolean;
  selectedDeptId: string | null;
  onEdit: (m: DeptMission | null) => void;
}

const MissionSection: React.FC<Props> = ({ mission, isLoading, selectedDeptId, onEdit }) => {
  const { t } = useTranslation();

  return (
    <Section title={t('chucNangNhiemVu.mission')} icon={<Target size={14} />} variant="primary">
      {!selectedDeptId ? (
        <p className="text-sm text-muted-foreground">{t('chucNangNhiemVu.emptySelectDepartment')}</p>
      ) : isLoading ? (
        <div className="py-6 text-center text-muted-foreground text-sm">Đang tải...</div>
      ) : !mission ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t('chucNangNhiemVu.missionEmpty')}</p>
          <Button size="sm" onClick={() => onEdit(null)} className="bg-primary text-white w-fit">
            {t('chucNangNhiemVu.addMission')}
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <Target size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground whitespace-pre-wrap">{mission.noi_dung}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onEdit(mission)} className="shrink-0">
            <Edit size={14} className="mr-1.5" />
            {t('common.edit')}
          </Button>
        </div>
      )}
    </Section>
  );
};

export default MissionSection;
