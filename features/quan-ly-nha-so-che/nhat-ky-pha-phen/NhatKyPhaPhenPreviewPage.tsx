/** Trang in nhật ký pha phèn — route /quan-ly-nha-so-che/nhat-ky-pha-phen/preview/:id */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useNhatKyPhaPhenById } from './hooks/use-nhat-ky-pha-phen';
import NhatKyPhaPhenPreviewContent from './components/preview/NhatKyPhaPhenPreviewContent';
import { MAC_DINH_IN_NKPP, MAU_IN_NKPP } from './components/preview/mac-dinh-in';
import { formatYmdToDisplay } from '../../../lib/utils';

const NhatKyPhaPhenPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useNhatKyPhaPhenById(id);

  const loi = isError
    ? (error?.message ?? t('nkpp.preview.notFound'))
    : !isLoading && !data
      ? t('nkpp.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t('nkpp.preview.title')} - ${formatYmdToDisplay(data.ngay)}` : t('nkpp.preview.title')}
      mauKey={MAU_IN_NKPP}
      duongDanGoc={id ? `/quan-ly-nha-so-che/nhat-ky-pha-phen/preview/${id}` : null}
      macDinh={MAC_DINH_IN_NKPP}
      tenFile={`Nhat-ky-pha-phen-${data?.ngay ?? id ?? ''}`}
      duongDanVe="/quan-ly-nha-so-che/nhat-ky-pha-phen"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {data && <NhatKyPhaPhenPreviewContent phieu={data} />}
    </PhieuInPage>
  );
};

export default NhatKyPhaPhenPreviewPage;
