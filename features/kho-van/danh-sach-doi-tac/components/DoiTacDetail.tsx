import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Users, FileText, ArrowUpFromLine, Calendar, Power, Folder, MapPin, Phone, Mail } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { DoiTac } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import PhieuKhoLienQuanSubTable from './PhieuKhoLienQuanSubTable';
import type { PhieuKho } from '../../phieu-kho/core/types';

interface Props {
  data: DoiTac;
  phieuKhoList: PhieuKho[];
  phieuKhoLoading: boolean;
  onClose: () => void;
  onEdit: (item: DoiTac) => void;
  onDelete: (id: string) => void;
  onViewPhieu?: (item: PhieuKho) => void;
  onEditPhieu?: (item: PhieuKho) => void;
  onDeletePhieu?: (id: string) => void;
  onAddPhieu?: () => void;
}

const DoiTacDetail: React.FC<Props> = ({
  data,
  phieuKhoList,
  phieuKhoLoading,
  onClose,
  onEdit,
  onDelete,
  onViewPhieu,
  onEditPhieu,
  onDeletePhieu,
  onAddPhieu,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;
  const tags = data.ten_tags ?? [];

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
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
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('doiTac.detail.title')}
      subtitle={data.ma_ncc}
      icon={<Users size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Users size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_ncc}</h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_ncc}</p>
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('common.activeStatus')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('common.inactiveStatus')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailSection title={t('doiTac.detail.basicInfo')} icon={<Users size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('doiTac.form.name')} value={data.ten_ncc} icon={<Users size={12} />} />
            <DetailField label={t('doiTac.form.code')} value={data.ma_ncc} icon={<Users size={12} />} />
            <DetailField
              label={t('doiTac.detail.group')}
              value={data.ten_nhom ?? ''}
              icon={<Folder size={12} />}
              emptyText={t('doiTac.detail.noGroup')}
            />
            <DetailField
              label={t('doiTac.form.address')}
              value={data.dia_chi ?? ''}
              icon={<MapPin size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('doiTac.form.phone')}
              value={data.dien_thoai ?? ''}
              icon={<Phone size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('doiTac.form.email')}
              value={data.email ?? ''}
              icon={<Mail size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('doiTac.detail.tags')}
              value={
                tags.length === 0 ? (
                  undefined
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )
              }
              emptyText="—"
            />
            <DetailField label={t('doiTac.detail.order')} value={String(data.thu_tu)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField
              label={t('doiTac.detail.description')}
              value={data.mo_ta ?? ''}
              icon={<FileText size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('common.status')}
              value={isActive ? t('common.activeStatus') : t('common.inactiveStatus')}
              icon={<Power size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        <PhieuKhoLienQuanSubTable
          items={phieuKhoList}
          loading={phieuKhoLoading}
          addLabel={onAddPhieu != null ? t('doiTac.detail.addPhieu') : undefined}
          onAdd={onAddPhieu}
          onView={onViewPhieu}
          onEdit={onEditPhieu}
          onDelete={onDeletePhieu}
        />

        <DetailSection title={t('doiTac.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('doiTac.detail.createdAt')} value={formatDateShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('doiTac.detail.updated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default DoiTacDetail;
