/** Trang in phiếu giám sát chất lượng — route /quan-ly-nha-so-che/giam-sat-chat-luong/preview/:id */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useGiamSatChatLuongById, useThungMau } from './hooks/use-giam-sat-chat-luong';
import PhieuGsclPreview from './components/preview/PhieuGsclPreview';

// 11 tiêu chí × 10 thùng (mỗi thùng 2 cột lỗi / tỉ lệ) phải vừa MỘT trang A4 ngang.
const MAC_DINH = { kho: 'a4', huong: 'ngang', leMm: 8 } as const;

const GiamSatChatLuongPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGiamSatChatLuongById(id);
  const { data: thung = [], isLoading: thungLoading } = useThungMau(id);

  const loi = isError
    ? (error?.message ?? t('giamSatChatLuong.preview.notFound'))
    : !isLoading && !data
      ? t('giamSatChatLuong.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t('giamSatChatLuong.preview.title')} - ${data.so_phieu}` : t('giamSatChatLuong.preview.title')}
      mauKey="giam-sat-chat-luong"
      macDinh={MAC_DINH}
      coChuGocPt={9}
      tenFile={`Phieu-giam-sat-chat-luong-${data?.so_phieu ?? id ?? ''}`}
      duongDanVe="/quan-ly-nha-so-che/giam-sat-chat-luong"
      isLoading={isLoading || thungLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {data && <PhieuGsclPreview phieu={data} thung={thung} />}
    </PhieuInPage>
  );
};

export default GiamSatChatLuongPreviewPage;
