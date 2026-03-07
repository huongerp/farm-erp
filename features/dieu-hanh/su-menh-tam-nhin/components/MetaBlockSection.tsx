import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, User } from 'lucide-react';
import Section from '../../../../components/shared/Section';
import { formatDateShort } from '../../../../lib/utils';

interface Props {
  ngayHieuLuc?: string | null;
  nguoiDuyet?: string | null;
}

const MetaBlockSection: React.FC<Props> = ({ ngayHieuLuc, nguoiDuyet }) => {
  const { t } = useTranslation();
  const hasAny = ngayHieuLuc || nguoiDuyet;

  if (!hasAny) return null;

  return (
    <Section title={t('suMenhTamNhin.versionInfo')} variant="muted">
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {ngayHieuLuc && (
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {t('suMenhTamNhin.effectiveDate')}: {formatDateShort(ngayHieuLuc)}
          </span>
        )}
        {nguoiDuyet && (
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {t('suMenhTamNhin.approvedBy')}: {nguoiDuyet}
          </span>
        )}
      </div>
    </Section>
  );
};

export default MetaBlockSection;
