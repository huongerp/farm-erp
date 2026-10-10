/**
 * Trang in phiếu kiểm kê kho. Route: /mua-hang/kiem-ke-kho/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useDotKiemKeKhoById, useChiTietByDot } from './hooks/use-kiem-ke-kho';
import { exportPhieuKiemKeKhoToXLSX, getFileName } from './utils/export-phieu-kiem-ke-kho';
import PhieuKiemKeKhoPreviewContent from './components/PhieuKiemKeKhoPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const PhieuKiemKeKhoPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: dot, isLoading, isError, error, refetch } = useDotKiemKeKhoById(id ?? null);
  const { data: chiTiet = [], isLoading: chiTietLoading } = useChiTietByDot(id ?? null);

  const loi = isError
    ? (error?.message ?? t('kiemKeKho.preview.loadError'))
    : !isLoading && !dot
      ? t('kiemKeKho.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={dot ? `${t('kiemKeKho.preview.title')} - ${dot.ma_dot} · ${dot.ten_dot}` : t('kiemKeKho.preview.title')}
      mauKey="kiem-ke-kho"
      macDinh={MAC_DINH}
      tenFile={dot ? getFileName(dot) : 'kiem-ke-kho'}
      duongDanVe="/mua-hang/kiem-ke-kho"
      isLoading={isLoading || chiTietLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        dot
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportPhieuKiemKeKhoToXLSX(dot, chiTiet) }]
          : undefined
      }
    >
      {dot && <PhieuKiemKeKhoPreviewContent dot={dot} chiTiet={chiTiet} />}
    </PhieuInPage>
  );
};

export default PhieuKiemKeKhoPreviewPage;
