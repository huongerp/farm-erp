/** Trang in nhật ký pha thuốc phun cùi — route /quan-ly-nha-so-che/nhat-ky-phun-cui/preview/:id */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useNhatKyPhunCuiById } from './hooks/use-nhat-ky-phun-cui';
import NhatKyPhunCuiPreviewContent from './components/preview/NhatKyPhunCuiPreviewContent';
import { MAC_DINH_IN_NKPC, MAU_IN_NKPC } from './components/preview/mac-dinh-in';
import { formatYmdToDisplay } from '../../../lib/utils';

const NhatKyPhunCuiPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useNhatKyPhunCuiById(id);

  const loi = isError
    ? (error?.message ?? t('nkpc.preview.notFound'))
    : !isLoading && !data
      ? t('nkpc.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t('nkpc.preview.title')} - ${formatYmdToDisplay(data.ngay)}` : t('nkpc.preview.title')}
      mauKey={MAU_IN_NKPC}
      duongDanGoc={id ? `/quan-ly-nha-so-che/nhat-ky-phun-cui/preview/${id}` : null}
      macDinh={MAC_DINH_IN_NKPC}
      tenFile={`Nhat-ky-phun-cui-${data?.ngay ?? id ?? ''}`}
      duongDanVe="/quan-ly-nha-so-che/nhat-ky-phun-cui"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {data && <NhatKyPhunCuiPreviewContent phieu={data} />}
    </PhieuInPage>
  );
};

export default NhatKyPhunCuiPreviewPage;
