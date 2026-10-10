/**
 * Trang in dự báo SL đóng thùng. Route: /quan-ly-nha-so-che/du-bao-sl-dong-thung/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { formatDateShort } from '../../../lib/utils';
import { useDuBaoSlDongThungById } from './hooks/use-du-bao-sl-dong-thung';
import { exportDuBaoSlDongThungToXLSX, fileName } from './utils/export-du-bao-sl-dong-thung';
import DuBaoSlDongThungPreviewContent from './components/DuBaoSlDongThungPreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const DuBaoSlDongThungPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useDuBaoSlDongThungById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('duBaoSlDongThung.preview.loadError'))
    : !isLoading && !data
      ? t('duBaoSlDongThung.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t('duBaoSlDongThung.preview.title')} - ${formatDateShort(data.ngay)}` : t('duBaoSlDongThung.preview.title')}
      mauKey="du-bao-sl-dong-thung"
      macDinh={MAC_DINH}
      tenFile={data ? fileName(data) : 'du-bao-sl-dong-thung'}
      duongDanVe="/quan-ly-nha-so-che/du-bao-sl-dong-thung"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        data
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportDuBaoSlDongThungToXLSX(data) }]
          : undefined
      }
    >
      {data && <DuBaoSlDongThungPreviewContent data={data} />}
    </PhieuInPage>
  );
};

export default DuBaoSlDongThungPreviewPage;
