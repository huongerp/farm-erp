import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import DetailDrawerFooter from '../../../../components/shared/DetailDrawerFooter';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import type { Tag as TagType } from '../core/types';

interface Props {
  data: TagType;
  onClose: () => void;
  onEdit: (item: TagType) => void;
  onDelete: (id: string) => void;
}

const TagDetailDrawer: React.FC<Props> = ({ data, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const renderFooter = (
    <DetailDrawerFooter
      onClose={onClose}
      onEdit={() => { onEdit(data); onClose(); }}
      onDelete={() => onDelete(data.id)}
    />
  );

  return (
    <GenericDrawer
      title={data.ten_tag}
      icon={<Tag size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Tag size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_tag}</h2>
          </div>
        </div>

        <DetailSection title={t('doiTac.detail.basicInfo')} icon={<Tag size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('doiTac.danhMuc.form.tenTag')} value={data.ten_tag} icon={<Tag size={12} />} />
          </div>
        </DetailSection>
      </div>
    </GenericDrawer>
  );
};

export default TagDetailDrawer;
