/**
 * Trang in đơn đặt hàng. Route: /mua-hang/don-dat-hang/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useDonDatHangById } from './hooks/use-don-dat-hang';
import { exportDonDatHangToXLSX, getFileName } from './utils/export-don-dat-hang';
import DonDatHangPreviewContent from './components/DonDatHangPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const DonDatHangPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: po, isLoading, isError, error, refetch } = useDonDatHangById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('donDatHang.preview.loadError'))
    : !isLoading && !po
      ? t('donDatHang.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={po ? `${t('donDatHang.preview.title')} - ${po.so_po}` : t('donDatHang.preview.title')}
      mauKey="don-dat-hang"
      macDinh={MAC_DINH}
      tenFile={po ? getFileName(po) : 'don-dat-hang'}
      duongDanVe="/mua-hang/don-dat-hang"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        po
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportDonDatHangToXLSX(po, po.chi_tiet ?? []) }]
          : undefined
      }
    >
      {po && <DonDatHangPreviewContent po={po} />}
    </PhieuInPage>
  );
};

export default DonDatHangPreviewPage;
