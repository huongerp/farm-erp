import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Edit } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Section from '../../../../components/shared/Section';
import type { CoreValue } from '../core/types';

interface Props {
  values: CoreValue[];
  onEdit: () => void;
}

const ValuesBlockSection: React.FC<Props> = ({ values, onEdit }) => {
  const { t } = useTranslation();
  const isEmpty = !values?.length;

  return (
    <Section title={t('suMenhTamNhin.coreValues')} icon={<Heart size={14} />} variant="primary">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-3">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed border-border">
              {t('suMenhTamNhin.emptyValues')}
            </p>
          ) : (
            <ul className="space-y-2">
              {values
                .sort((a, b) => a.thu_tu - b.thu_tu)
                .map((v) => (
                  <li
                    key={v.id}
                    className="p-3 rounded-lg border border-border bg-muted/30 flex flex-col gap-1"
                  >
                    <span className="text-sm font-semibold text-foreground">{v.ten}</span>
                    {v.mo_ta && (
                      <span className="text-sm text-muted-foreground">{v.mo_ta}</span>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={onEdit} className="shrink-0">
          <Edit size={14} className="mr-1.5" />
          {t('common.edit')}
        </Button>
      </div>
    </Section>
  );
};

export default ValuesBlockSection;
