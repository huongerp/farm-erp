/**
 * Trang in phiếu kiểm kê tài sản. Route: /phieu-kiem-ke/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useDotKiemKeById, useChiTietByDot } from './hooks/use-kiem-ke-tai-san';
import PhieuKiemKePreviewContent from './components/PhieuKiemKePreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const PhieuKiemKePreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: dot, isLoading, isError, error, refetch } = useDotKiemKeById(id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietByDot(id ?? null);

  const loi = isError
    ? (error?.message ?? t('kiemKeTaiSan.preview.loadError'))
    : !isLoading && !dot
      ? t('kiemKeTaiSan.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={dot ? `${t('kiemKeTaiSan.preview.title')} - ${dot.ma_dot} · ${dot.ten_dot}` : t('kiemKeTaiSan.preview.title')}
      mauKey="kiem-ke-tai-san"
      macDinh={MAC_DINH}
      tenFile={dot ? `Phieu_kiem_ke_${dot.ma_dot}` : 'kiem-ke-tai-san'}
      duongDanVe="/hanh-chinh/kiem-ke-tai-san"
      isLoading={isLoading || chiTietLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {dot && <PhieuKiemKePreviewContent dot={dot} chiTiet={chiTiet} />}
    </PhieuInPage>
  );
};

export default PhieuKiemKePreviewPage;
