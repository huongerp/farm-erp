/**
 * Trang in phiếu điểm cộng / trừ. Route: /hanh-chinh/diem-cong-tru/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useDiemCongTruById } from './hooks/use-diem-cong-tru';
import DiemCongTruPreviewContent from './components/DiemCongTruPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const DiemCongTruPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, isError, error, refetch } = useDiemCongTruById(id ?? null);

  const loi = isError
    ? ((error as Error)?.message ?? t('diemCongTru.preview.loadError'))
    : !isLoading && !item
      ? t('diemCongTru.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={item ? `${t('diemCongTru.preview.title')} - DCT-${item.id}` : t('diemCongTru.preview.title')}
      mauKey="diem-cong-tru"
      macDinh={MAC_DINH}
      tenFile={item ? `diem-cong-tru-DCT-${item.id}` : 'diem-cong-tru'}
      duongDanVe="/hanh-chinh/diem-cong-tru"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {item && <DiemCongTruPreviewContent item={item} />}
    </PhieuInPage>
  );
};

export default DiemCongTruPreviewPage;
