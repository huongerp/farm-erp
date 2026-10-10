/**
 * Trang in phiếu kho. Route: /mua-hang/phieu-kho/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { usePhieuKhoById } from './hooks/use-phieu-kho';
import { exportPhieuKhoToXLSX, fileName } from './utils/export-phieu-kho';
import PhieuKhoPreviewContent from './components/PhieuKhoPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const PhieuKhoPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: phieu, isLoading, isError, error, refetch } = usePhieuKhoById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('phieuKho.preview.loadError'))
    : !isLoading && !phieu
      ? t('phieuKho.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={phieu ? `${t('phieuKho.preview.title')} - ${phieu.so_phieu}` : t('phieuKho.preview.title')}
      mauKey="phieu-kho"
      macDinh={MAC_DINH}
      tenFile={phieu ? fileName(phieu) : 'phieu-kho'}
      duongDanVe="/mua-hang/phieu-kho"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        phieu
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportPhieuKhoToXLSX(phieu, phieu.chi_tiet ?? []) }]
          : undefined
      }
    >
      {phieu && <PhieuKhoPreviewContent phieu={phieu} />}
    </PhieuInPage>
  );
};

export default PhieuKhoPreviewPage;
