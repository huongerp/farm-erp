/**
 * Trang in phiếu kiểm kê kho Nhà sơ chế / Phân thuốc. Route: <basePath>/kiem-ke-kho-phan-thuoc/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useDotKiemKePTById, useChiTietKiemKePT } from './hooks/use-kiem-ke-pt';
import { exportPhieuKiemKePTToXLSX, getFileName } from './utils/export-phieu-kiem-ke-pt';
import PhieuKiemKePTPreviewContent from './components/PhieuKiemKePTPreviewContent';
import { useKhoBienThe } from '../kho-bien-the/KhoBienTheProvider';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const PhieuKiemKePTPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const bt = useKhoBienThe();
  const { data: dot, isLoading, isError, error, refetch } = useDotKiemKePTById(id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietKiemKePT(id ?? null);

  const loi = isError
    ? (error?.message ?? t('kiemKeKhoPT.preview.loadError'))
    : !isLoading && !dot
      ? t('kiemKeKhoPT.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={dot ? `${t('kiemKeKhoPT.preview.title')} - ${dot.ma_dot} · ${dot.ten_dot}` : t('kiemKeKhoPT.preview.title')}
      mauKey="kiem-ke-kho-pt"
      macDinh={MAC_DINH}
      tenFile={dot ? getFileName(dot) : 'kiem-ke-kho-pt'}
      duongDanVe={`${bt.basePath}/kiem-ke-kho-phan-thuoc`}
      isLoading={isLoading || chiTietLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        dot
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportPhieuKiemKePTToXLSX(dot, chiTiet) }]
          : undefined
      }
    >
      {dot && <PhieuKiemKePTPreviewContent dot={dot} chiTiet={chiTiet} />}
    </PhieuInPage>
  );
};

export default PhieuKiemKePTPreviewPage;
