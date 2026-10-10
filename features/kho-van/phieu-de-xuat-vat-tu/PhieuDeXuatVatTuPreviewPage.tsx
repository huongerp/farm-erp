/**
 * Trang in phiếu đề xuất vật tư. Route: /mua-hang/phieu-de-xuat-vat-tu/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { usePhieuDeXuatVatTuById } from './hooks/use-phieu-de-xuat-vat-tu';
import { exportPhieuDeXuatVatTuToXLSX, fileName } from './utils/export-phieu-de-xuat-vat-tu';
import PhieuDeXuatVatTuPreviewContent from './components/PhieuDeXuatVatTuPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const PhieuDeXuatVatTuPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: phieu, isLoading, isError, error, refetch } = usePhieuDeXuatVatTuById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('phieuDeXuatVatTu.preview.loadError'))
    : !isLoading && !phieu
      ? t('phieuDeXuatVatTu.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={phieu ? `${t('phieuDeXuatVatTu.preview.title')} - ${phieu.so_phieu}` : t('phieuDeXuatVatTu.preview.title')}
      mauKey="phieu-de-xuat-vat-tu"
      macDinh={MAC_DINH}
      tenFile={phieu ? fileName(phieu) : 'phieu-de-xuat-vat-tu'}
      duongDanVe="/mua-hang/phieu-de-xuat-vat-tu"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        phieu
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportPhieuDeXuatVatTuToXLSX(phieu, phieu.chi_tiet ?? []) }]
          : undefined
      }
    >
      {phieu && <PhieuDeXuatVatTuPreviewContent phieu={phieu} />}
    </PhieuInPage>
  );
};

export default PhieuDeXuatVatTuPreviewPage;
