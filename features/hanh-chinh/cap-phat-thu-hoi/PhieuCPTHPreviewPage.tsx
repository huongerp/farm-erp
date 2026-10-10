/**
 * Trang in phiếu cấp phát / thu hồi. Route: /hanh-chinh/cap-phat-thu-hoi/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { usePhieuById } from './hooks/use-cap-phat-thu-hoi';
import { exportPhieuToXLSX, fileName } from './utils/export-phieu';
import PhieuCPTHPreviewContent from './components/PhieuCPTHPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const PhieuCPTHPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: phieu, isLoading, isError, error, refetch } = usePhieuById(id ?? null);

  const loi = isError
    ? ((error as Error)?.message ?? t('capPhatThuHoi.preview.loadError'))
    : !isLoading && !phieu
      ? t('capPhatThuHoi.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={phieu ? `${t('capPhatThuHoi.preview.title')} - ${phieu.ma_phieu}` : t('capPhatThuHoi.preview.title')}
      mauKey="cap-phat-thu-hoi"
      macDinh={MAC_DINH}
      tenFile={phieu ? fileName(phieu) : 'cap-phat-thu-hoi'}
      duongDanVe="/hanh-chinh/cap-phat-thu-hoi"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        phieu
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportPhieuToXLSX(phieu) }]
          : undefined
      }
    >
      {phieu && <PhieuCPTHPreviewContent phieu={phieu} />}
    </PhieuInPage>
  );
};

export default PhieuCPTHPreviewPage;
