/**
 * Trang in báo cáo sơ chế. Route: /quan-ly-nha-so-che/bao-cao-so-che/preview/:id — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { formatDateShort } from '../../../lib/utils';
import { useBaoCaoSoCheById } from './hooks/use-bao-cao-so-che';
import { useBaoCaoNhanCongList } from '../bao-cao-nhan-cong/hooks/use-bao-cao-nhan-cong';
import { useDuBaoSlDongThungList } from '../du-bao-sl-dong-thung/hooks/use-du-bao-sl-dong-thung';
import { exportBaoCaoSoCheToXLSX, fileName } from './utils/export-bao-cao-so-che';
import BaoCaoSoChePreviewContent from './components/BaoCaoSoChePreviewContent';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const BaoCaoSoChePreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useBaoCaoSoCheById(id ?? undefined);
  const { data: bcncList = [] } = useBaoCaoNhanCongList();
  const { data: dbdtList = [] } = useDuBaoSlDongThungList();

  const loi = isError
    ? (error?.message ?? t('baoCaoSoChe.preview.loadError'))
    : !isLoading && !data
      ? t('baoCaoSoChe.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t('baoCaoSoChe.preview.title')} - ${formatDateShort(data.ngay)}` : t('baoCaoSoChe.preview.title')}
      mauKey="bao-cao-so-che"
      macDinh={MAC_DINH}
      tenFile={data ? fileName(data) : 'bao-cao-so-che'}
      duongDanVe="/quan-ly-nha-so-che/bao-cao-so-che"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        data
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportBaoCaoSoCheToXLSX(data, bcncList, dbdtList) }]
          : undefined
      }
    >
      {data && <BaoCaoSoChePreviewContent data={data} bcncList={bcncList} dbdtList={dbdtList} />}
    </PhieuInPage>
  );
};

export default BaoCaoSoChePreviewPage;
