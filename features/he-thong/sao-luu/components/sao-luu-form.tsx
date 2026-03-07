
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Database, Play, AlertCircle } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import { backupSchema, BackupFormValues } from '../core/schema';
import { useCreateBackup } from '../hooks/use-sao-luu';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import { getTodayFileDate } from '../../../../lib/utils';

interface Props {
  onClose: () => void;
}

const BackupForm: React.FC<Props> = ({ onClose }) => {
  const { t } = useTranslation();
  const createMutation = useCreateBackup(onClose);

  const { register, handleSubmit, formState: { errors } } = useForm<BackupFormValues>({
    resolver: zodResolver(backupSchema),
    defaultValues: {
      ten_file: `backup_${getTodayFileDate()}`,
      loai_sao_luu: 'Database',
      ghi_chu: ''
    }
  });

  const onSubmit = (data: BackupFormValues) => {
    createMutation.mutate(data);
  };

  const renderFooter = (
      <>
          <Button variant="outline" size="lg" onClick={onClose} className="flex-1 border-border h-11 sm:h-12">{t('common.cancelAction')}</Button>
          <Button type="submit" form="backup-form" isLoading={createMutation.isPending} size="lg" className="flex-[2] bg-primary text-white shadow-lg h-11 sm:h-12">
            <Play className="mr-2 h-4 w-4" /> {t('backup.form.startButton')}
          </Button>
      </>
  );

  return (
    <GenericDrawer
        title={t('backup.form.title')}
        subtitle={t('backup.form.subtitle')}
        icon={<Database size={20} />}
        onClose={onClose}
        footer={renderFooter}
        maxWidthClass={DRAWER_WIDTH_FORM}
    >
          <form id="backup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
             <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    {t('backup.form.warning')}
                </p>
             </div>

             <div className="bg-card p-4 sm:p-5 rounded-xl border border-border shadow-sm space-y-4">
                <Input 
                    label={t('backup.form.fileName')} 
                    placeholder={t('backup.form.fileNamePlaceholder')} 
                    {...register('ten_file')} 
                    error={errors.ten_file?.message} 
                />
                
                <Select
                    label={t('backup.form.scope')}
                    options={[
                        { value: 'Database', label: t('backup.form.scopeDbOnly') },
                        { value: 'Assets', label: t('backup.form.scopeFilesOnly') },
                        { value: 'Full', label: t('backup.form.scopeFullSystem') },
                    ]}
                    {...register('loai_sao_luu')}
                />

                <Textarea
                    label={t('backup.form.notes')}
                    placeholder={t('backup.form.notesPlaceholder')}
                    {...register('ghi_chu')}
                />
             </div>
          </form>
    </GenericDrawer>
  );
};

export default BackupForm;
