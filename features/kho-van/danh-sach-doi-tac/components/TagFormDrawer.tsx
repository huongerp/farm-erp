import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { Tag as TagType } from '../core/types';

interface TagFormDrawerProps {
  initialData: TagType | null;
  onClose: () => void;
  onSubmit: (ten_tag: string) => void;
  isSaving: boolean;
}

const TagFormDrawer: React.FC<TagFormDrawerProps> = ({ initialData, onClose, onSubmit, isSaving }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [tenTag, setTenTag] = useState(initialData?.ten_tag ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = tenTag.trim();
    if (!name) return;
    onSubmit(name);
  };

  return (
    <GenericDrawer
      title={isEdit ? t('doiTac.danhMuc.editTag') : t('doiTac.danhMuc.addTag')}
      icon={<Tag size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="tag-doi-tac-form"
          onCancel={onClose}
          isLoading={isSaving}
          isEdit={isEdit}
          saveLabel={t('doiTac.form.save')}
          createLabel={t('doiTac.form.create')}
        />
      }
    >
      <form id="tag-doi-tac-form" onSubmit={handleSubmit} className="space-y-5">
        <FormSection title={t('doiTac.detail.basicInfo')} icon={<Tag size={14} />} variant="primary">
          <FormGrid cols={2}>
            <Input
              label={t('doiTac.danhMuc.form.tenTag')}
              placeholder="VD: Ưu tiên, Nội địa"
              icon={<Tag size={12} />}
              value={tenTag}
              onChange={(e) => setTenTag(e.target.value)}
              required
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TagFormDrawer;
