/**
 * Trang in báo cáo nhân công. Route: /quan-ly-nha-so-che/bao-cao-nhan-cong/preview/:id?noi-dung=chuyen|nhan-vien|ca-hai
 * — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 * Kiểu «nhan-vien» nhớ cài đặt in riêng (mặc định A4 dọc — bảng tên chỉ 7 cột).
 */
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { formatYmdToDisplay } from '../../../lib/utils';
import { useBaoCaoNhanCongById } from './hooks/use-bao-cao-nhan-cong';
import { exportBaoCaoNhanCongToXLSX, fileName } from './utils/export-bao-cao-nhan-cong';
import BaoCaoNhanCongPreviewContent from './components/BaoCaoNhanCongPreviewContent';
import { docNoiDungIn, NOI_DUNG_IN_PARAM, type NoiDungIn } from './core/preview-url';

// Bảng chuyền nhiều cột: khổ ngang để chữ 8pt vẫn vừa.
const MAC_DINH = { kho: 'a4', huong: 'ngang', leMm: 10 } as const;
const MAC_DINH_NV = { kho: 'a4', huong: 'doc', leMm: 10 } as const;

const HAU_TO_FILE: Record<NoiDungIn, string> = { chuyen: '_chuyen', 'nhan-vien': '_nhan_vien', 'ca-hai': '' };

const BaoCaoNhanCongPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const noiDung = docNoiDungIn(searchParams.get(NOI_DUNG_IN_PARAM));
  const laNv = noiDung === 'nhan-vien';
  const { data, isLoading, isError, error, refetch } = useBaoCaoNhanCongById(id ?? undefined);

  const loi = isError
    ? (error?.message ?? t('baoCaoNhanCong.preview.loadError'))
    : !isLoading && !data
      ? t('baoCaoNhanCong.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t(`baoCaoNhanCong.inKieu.${laNv ? 'nhanVien' : noiDung === 'chuyen' ? 'chuyen' : 'caHai'}`)} - ${formatYmdToDisplay(data.ngay?.slice(0, 10))}` : t('baoCaoNhanCong.preview.title')}
      mauKey={laNv ? 'bao-cao-nhan-cong-nv' : 'bao-cao-nhan-cong'}
      macDinh={laNv ? MAC_DINH_NV : MAC_DINH}
      tenFile={data ? fileName(data) + HAU_TO_FILE[noiDung] : 'bao-cao-nhan-cong'}
      duongDanVe="/quan-ly-nha-so-che/bao-cao-nhan-cong"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        data
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportBaoCaoNhanCongToXLSX(data, noiDung) }]
          : undefined
      }
    >
      {data && <BaoCaoNhanCongPreviewContent data={data} noiDung={noiDung} />}
    </PhieuInPage>
  );
};

export default BaoCaoNhanCongPreviewPage;
