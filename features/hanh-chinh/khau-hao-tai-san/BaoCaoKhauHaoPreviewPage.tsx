/**
 * Trang in báo cáo khấu hao. Route: /bao-cao-khau-hao/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useKyKhauHaoById, useChiTietKhauHao } from './hooks/use-khau-hao-tai-san';
import BaoCaoKhauHaoPreviewContent from './components/BaoCaoKhauHaoPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const BaoCaoKhauHaoPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: ky, isLoading, isError, error, refetch } = useKyKhauHaoById(id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietKhauHao(id ?? null);

  const loi = isError
    ? (error?.message ?? t('khauHaoTaiSan.preview.loadError'))
    : !isLoading && !ky
      ? t('khauHaoTaiSan.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={ky ? `${t('khauHaoTaiSan.preview.title')} - ${ky.thang}/${ky.nam}` : t('khauHaoTaiSan.preview.title')}
      mauKey="bao-cao-khau-hao"
      macDinh={MAC_DINH}
      tenFile={ky ? `Bao_cao_khau_hao_${ky.thang}_${ky.nam}` : 'bao-cao-khau-hao'}
      duongDanVe="/hanh-chinh/khau-hao-tai-san"
      isLoading={isLoading || chiTietLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {ky && <BaoCaoKhauHaoPreviewContent ky={ky} chiTiet={chiTiet} />}
    </PhieuInPage>
  );
};

export default BaoCaoKhauHaoPreviewPage;
