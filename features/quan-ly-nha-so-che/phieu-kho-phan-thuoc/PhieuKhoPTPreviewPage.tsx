/**
 * Trang in phiếu kho Nhà sơ chế / Phân thuốc. Route: <basePath>/phieu-kho-phan-thuoc/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { usePhieuKhoPTById } from './hooks/use-phieu-kho-pt';
import { exportPhieuKhoPTToXLSX, fileName } from './utils/export-phieu-kho-pt';
import PhieuKhoPTPreviewContent from './components/PhieuKhoPTPreviewContent';
import { useKhoBienThe } from '../kho-bien-the/KhoBienTheProvider';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const PhieuKhoPTPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const bt = useKhoBienThe();
  const { data: phieu, isLoading, isError, error, refetch } = usePhieuKhoPTById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('phieuKhoPhanThuoc.preview.loadError'))
    : !isLoading && !phieu
      ? t('phieuKhoPhanThuoc.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={phieu ? `${t('phieuKhoPhanThuoc.preview.title')} - ${phieu.so_phieu}` : t('phieuKhoPhanThuoc.preview.title')}
      mauKey="phieu-kho-pt"
      macDinh={MAC_DINH}
      tenFile={phieu ? fileName(phieu) : 'phieu-kho-pt'}
      duongDanVe={`${bt.basePath}/phieu-kho-phan-thuoc`}
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        phieu
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportPhieuKhoPTToXLSX(phieu, phieu.chi_tiet ?? []) }]
          : undefined
      }
    >
      {phieu && <PhieuKhoPTPreviewContent phieu={phieu} />}
    </PhieuInPage>
  );
};

export default PhieuKhoPTPreviewPage;
