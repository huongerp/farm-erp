import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import Section from '../../../../components/shared/Section';

interface Props {
  content: string;
}

const MissionBlockSection: React.FC<Props> = ({ content }) => {
  const { t } = useTranslation();
  const isEmpty = !content?.trim();

  return (
    <Section title={t('suMenhTamNhin.mission')} icon={<Compass size={14} />} variant="primary">
      <div className="min-w-0 p-3 rounded-lg border border-border bg-muted/30">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground">{t('suMenhTamNhin.emptyMission')}</p>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{content}</p>
        )}
      </div>
    </Section>
  );
};

export default MissionBlockSection;
