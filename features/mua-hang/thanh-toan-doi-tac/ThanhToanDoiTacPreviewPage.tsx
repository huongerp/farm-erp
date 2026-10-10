/**
 * Trang in phiếu thanh toán đối tác. Route: /mua-hang/thanh-toan-doi-tac/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useThanhToanDoiTacById } from './hooks/use-thanh-toan-doi-tac';
import { exportThanhToanDoiTacToXLSX, getFileName } from './utils/export-thanh-toan-doi-tac';
import ThanhToanDoiTacPreviewContent from './components/ThanhToanDoiTacPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const ThanhToanDoiTacPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, isError, error, refetch } = useThanhToanDoiTacById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('thanhToanDoiTac.preview.loadError'))
    : !isLoading && !item
      ? t('thanhToanDoiTac.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={item ? `${t('thanhToanDoiTac.preview.title')} - ${item.so_phieu}` : t('thanhToanDoiTac.preview.title')}
      mauKey="thanh-toan-doi-tac"
      macDinh={MAC_DINH}
      tenFile={item ? getFileName(item) : 'thanh-toan-doi-tac'}
      duongDanVe="/mua-hang/thanh-toan-doi-tac"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        item
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportThanhToanDoiTacToXLSX(item) }]
          : undefined
      }
    >
      {item && <ThanhToanDoiTacPreviewContent data={item} />}
    </PhieuInPage>
  );
};

export default ThanhToanDoiTacPreviewPage;
