import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Tag } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
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
          onClick={() => onDelete(data.id)}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
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
