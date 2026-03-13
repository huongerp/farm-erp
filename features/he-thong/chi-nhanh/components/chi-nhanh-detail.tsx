import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, MapPin, Power, Calendar, Globe, Map } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { Branch } from '../core/types';
import { formatDateTimeShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import { TRANG_THAI } from '../../../../lib/constants';

interface Props {
  data: Branch;
  onClose: () => void;
  onEdit: (item: Branch) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (item: Branch) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const BranchDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onStatusChange, canUpdate = true, canDelete = true }) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === TRANG_THAI.DANG_DUNG;

  const toolbarActions: DetailToolbarAction[] = [
    ...(canUpdate && onStatusChange
      ? [
          {
            label: isActive ? t('branch.detail.deactivate') : t('branch.detail.activate'),
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
      title={t('branch.detail.title')}
      subtitle={data.ma_chi_nhanh}
      icon={<MapPin size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <MapPin size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_chi_nhanh}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_chi_nhanh}</p>
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('branch.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('branch.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection title={t('branch.detail.basicInfo')} icon={<MapPin size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('branch.form.code')} value={data.ma_chi_nhanh} icon={<MapPin size={12} />} />
            <DetailField label={t('branch.form.name')} value={data.ten_chi_nhanh} icon={<MapPin size={12} />} />
            <DetailField label={t('branch.form.status')} value={isActive ? t('branch.active') : t('branch.inactive')} icon={<Power size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('branch.detail.addressInfo')} icon={<Globe size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('branch.form.address')} value={data.dia_chi} icon={<MapPin size={12} />} />
            <DetailField label={t('branch.form.province')} value={data.tinh_thanh} icon={<Globe size={12} />} />
            <DetailField label={t('branch.form.district')} value={data.quan_huyen} icon={<Globe size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('branch.detail.mapInfo')} icon={<Map size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('branch.form.latitude')} value={data.vi_do ?? '—'} icon={<MapPin size={12} />} />
            <DetailField label={t('branch.form.longitude')} value={data.kinh_do ?? '—'} icon={<MapPin size={12} />} />
            <DetailField
              label={t('branch.form.mapUrl')}
              value={
                data.duong_dan_map ? (
                  <a href={data.duong_dan_map} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                    {t('branch.detail.mapLink')}
                  </a>
                ) : ''
              }
              icon={<Map size={12} />}
              emptyText="—"
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('branch.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('branch.detail.createdAt')} value={formatDateTimeShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('branch.detail.updated')} value={formatDateTimeShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default BranchDetail;
