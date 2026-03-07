import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { Compass } from 'lucide-react';
import Textarea from '../../../../components/ui/Textarea';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import FormSection from '../../../../components/shared/FormSection';
import { missionVisionSchema, type MissionVisionFormValues } from '../core/schema';
import { useUpdateMissionVision } from '../hooks/use-su-menh-tam-nhin';

interface Props {
  initialMission: string;
  initialVision: string;
  onClose: () => void;
}

const EditMissionVisionDrawer: React.FC<Props> = ({
  initialMission,
  initialVision,
  onClose,
}) => {
  const { t } = useTranslation();
  const updateMutation = useUpdateMissionVision();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MissionVisionFormValues>({
    resolver: zodResolver(missionVisionSchema),
    defaultValues: { su_menh: initialMission, tam_nhin: initialVision },
  });

  useEffect(() => {
    reset({ su_menh: initialMission, tam_nhin: initialVision });
  }, [initialMission, initialVision, reset]);

  const onSubmit: SubmitHandler<MissionVisionFormValues> = async (data) => {
    await updateMutation.mutateAsync(data);
    toast.success(t('suMenhTamNhin.saveSuccess'));
    onClose();
  };

  const isLoading = updateMutation.isPending;

  return (
    <GenericDrawer
      title={t('suMenhTamNhin.editMissionVision')}
      icon={<Compass size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="mission-vision-form"
          onCancel={onClose}
          isLoading={isLoading}
          isEdit
          saveLabel={t('common.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="mission-vision-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('suMenhTamNhin.mission')} icon={<Compass size={14} />} variant="primary">
          <Textarea
            label={t('suMenhTamNhin.mission')}
            placeholder={t('suMenhTamNhin.missionPlaceholder')}
            rows={4}
            {...register('su_menh')}
            error={errors.su_menh?.message}
          />
        </FormSection>
        <FormSection title={t('suMenhTamNhin.vision')} variant="primary">
          <Textarea
            label={t('suMenhTamNhin.vision')}
            placeholder={t('suMenhTamNhin.visionPlaceholder')}
            rows={4}
            {...register('tam_nhin')}
            error={errors.tam_nhin?.message}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default EditMissionVisionDrawer;
