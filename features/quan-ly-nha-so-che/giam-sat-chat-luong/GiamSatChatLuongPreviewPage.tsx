/** Trang in phiếu giám sát chất lượng — route /quan-ly-nha-so-che/giam-sat-chat-luong/preview/:id */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage, { kichThuocGiayIn } from '../../../components/shared/phieu-in/PhieuInPage';
import { useGiamSatChatLuongById, useThungMau } from './hooks/use-giam-sat-chat-luong';
import PhieuGsclPreview from './components/preview/PhieuGsclPreview';

const KHO = 'a4' as const;
const HUONG = 'ngang' as const;
const LE_MM = 8;

const GiamSatChatLuongPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGiamSatChatLuongById(id);
  const { data: thung = [], isLoading: thungLoading } = useThungMau(id);
  const { wMm, hMm } = kichThuocGiayIn(KHO, HUONG);

  const loi = isError
    ? (error?.message ?? t('giamSatChatLuong.preview.notFound'))
    : !isLoading && !data
      ? t('giamSatChatLuong.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t('giamSatChatLuong.preview.title')} - ${data.so_phieu}` : t('giamSatChatLuong.preview.title')}
      kho={KHO}
      huong={HUONG}
      leMm={LE_MM}
      tenFile={`Phieu-giam-sat-chat-luong-${data?.so_phieu ?? id ?? ''}`}
      duongDanVe="/quan-ly-nha-so-che/giam-sat-chat-luong"
      isLoading={isLoading || thungLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {data && <PhieuGsclPreview phieu={data} thung={thung} wMm={wMm} hMm={hMm} leMm={LE_MM} />}
    </PhieuInPage>
  );
};

export default GiamSatChatLuongPreviewPage;
