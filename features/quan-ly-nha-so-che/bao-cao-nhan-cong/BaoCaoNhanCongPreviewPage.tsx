/**
 * Trang in báo cáo nhân công. Route: /quan-ly-nha-so-che/bao-cao-nhan-cong/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { formatDateShort } from '../../../lib/utils';
import { useBaoCaoNhanCongById } from './hooks/use-bao-cao-nhan-cong';
import { exportBaoCaoNhanCongToXLSX, fileName } from './utils/export-bao-cao-nhan-cong';
import BaoCaoNhanCongPreviewContent from './components/BaoCaoNhanCongPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 15 } as const;

const BaoCaoNhanCongPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useBaoCaoNhanCongById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('baoCaoNhanCong.preview.loadError'))
    : !isLoading && !data
      ? t('baoCaoNhanCong.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t('baoCaoNhanCong.preview.title')} - ${formatDateShort(data.ngay)}` : t('baoCaoNhanCong.preview.title')}
      mauKey="bao-cao-nhan-cong"
      macDinh={MAC_DINH}
      tenFile={data ? fileName(data) : 'bao-cao-nhan-cong'}
      duongDanVe="/quan-ly-nha-so-che/bao-cao-nhan-cong"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        data
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportBaoCaoNhanCongToXLSX(data) }]
          : undefined
      }
    >
      {data && <BaoCaoNhanCongPreviewContent data={data} />}
    </PhieuInPage>
  );
};

export default BaoCaoNhanCongPreviewPage;
