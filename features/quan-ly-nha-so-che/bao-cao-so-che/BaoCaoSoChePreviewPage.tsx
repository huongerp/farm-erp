/**
 * Trang in báo cáo sơ chế. Route: /quan-ly-nha-so-che/bao-cao-so-che/preview/:id?loai=tong-hop|nhan-cong-so-che|pham-cap-kpi — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 */
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { formatYmdToDisplay } from '../../../lib/utils';
import { useBaoCaoSoCheById } from './hooks/use-bao-cao-so-che';
import { useBaoCaoNhanCongList } from '../bao-cao-nhan-cong/hooks/use-bao-cao-nhan-cong';
import { useDuBaoSlDongThungList } from '../du-bao-sl-dong-thung/hooks/use-du-bao-sl-dong-thung';
import { exportBaoCaoSoCheToXLSX, fileName } from './utils/export-bao-cao-so-che';
import BaoCaoSoChePreviewContent from './components/BaoCaoSoChePreviewContent';
import { docLoaiIn } from './core/mau-in';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 12 } as const;

const BaoCaoSoChePreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const loai = docLoaiIn(searchParams);
  const tongHop = loai === 'tong-hop';
  const tieuDe = t(`baoCaoSoChe.mauIn.ten.${loai}`);
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
      title={data ? `${tieuDe} - ${formatYmdToDisplay(data.ngay?.slice(0, 10))}` : tieuDe}
      mauKey={tongHop ? 'bao-cao-so-che' : `bao-cao-so-che.${loai}`}
      macDinh={MAC_DINH}
      tenFile={`${data ? fileName(data) : 'bao-cao-so-che'}${tongHop ? '' : `_${loai}`}`}
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
      {data && <BaoCaoSoChePreviewContent loai={loai} data={data} bcncList={bcncList} dbdtList={dbdtList} />}
    </PhieuInPage>
  );
};

export default BaoCaoSoChePreviewPage;
