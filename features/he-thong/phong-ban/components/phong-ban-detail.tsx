import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Building2, ArrowUpFromLine, Calendar, Clock, Power, FileText } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { Department } from '../core/types';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import { TRANG_THAI } from '../../../../lib/constants';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: Department;
  allDepartments: Department[];
  onClose: () => void;
  onEdit: (item: Department) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (item: Department) => void;
  onAddChild?: (parent: Department) => void;
  onViewChild?: (child: Department) => void;
  maxWidthClass?: string;
  stackLevel?: number;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const DepartmentDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  canUpdate = true,
  canDelete = true,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === TRANG_THAI.DANG_DUNG;

  const toolbarActions: DetailToolbarAction[] = [
    ...(canUpdate && onStatusChange
      ? [
          {
            label: isActive ? t('department.detail.deactivate') : t('department.detail.activate'),
            icon: <Power size={16} />,
            onClick: () => onStatusChange(data),
            variant: 'info' as const,
          },
        ]
      : []),
  ];

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {canUpdate && (
          <Button
            onClick={() => {
              onEdit(data);
              onClose();
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            onClick={() => {
              onDelete(data.id);
              onClose();
            }}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
          >
            <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('department.detail.title')}
      subtitle={data.ten_phong_ban}
      icon={<Building2 size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={maxWidthClass}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Building2 size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_phong_ban}</h2>
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('department.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('department.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection title={t('department.detail.basicInfo')} icon={<Building2 size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('department.name')} value={data.ten_phong_ban} icon={<Building2 size={12} />} />
            <DetailField label={t('department.detail.chucNang')} value={data.chuc_nang ?? ''} icon={<FileText size={12} />} emptyText="—" />
            <DetailField label={t('department.detail.order')} value={String(data.tt)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField label={t('common.status')} value={isActive ? t('department.active') : t('department.inactive')} icon={<Power size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('department.detail.systemInfo')} icon={<Clock size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('department.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('department.detail.updated')} value={data.tg_cap_nhat ? formatDate(data.tg_cap_nhat) : '—'} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DepartmentDetail;
