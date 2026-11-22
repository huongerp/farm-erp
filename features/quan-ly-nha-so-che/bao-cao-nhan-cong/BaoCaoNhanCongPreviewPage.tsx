/**
 * Trang in báo cáo nhân công. Route: /quan-ly-nha-so-che/bao-cao-nhan-cong/preview/:id?noi-dung=chuyen|nhan-vien|ca-hai|theo-nhom
 * — khung in dùng chung (khổ, hướng, lề, phông, cỡ chữ, cột chỉnh trên bảng cài đặt).
 * Kiểu «nhan-vien» / «theo-nhom» nhớ cài đặt in riêng (mặc định A4 dọc — chỉ có bảng tên).
 */
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { formatYmdToDisplay } from '../../../lib/utils';
import { useBaoCaoNhanCongById, useViTriSoChe } from './hooks/use-bao-cao-nhan-cong';
import { useCaiDatThuongVuot, useKpiSoCheNgay, useViTriKhongThuongVuot } from './hooks/use-thuong-vuot';
import { exportBaoCaoNhanCongToXLSX, fileName } from './utils/export-bao-cao-nhan-cong';
import BaoCaoNhanCongPreviewContent from './components/BaoCaoNhanCongPreviewContent';
import { docNoiDungIn, NOI_DUNG_IN_PARAM, type NoiDungIn } from './core/preview-url';

// Bảng chuyền nhiều cột: khổ ngang để chữ 8pt vẫn vừa.
const MAC_DINH = { kho: 'a4', huong: 'ngang', leMm: 10 } as const;
const MAC_DINH_NV = { kho: 'a4', huong: 'doc', leMm: 10 } as const;

const HAU_TO_FILE: Record<NoiDungIn, string> = { chuyen: '_chuyen', 'nhan-vien': '_nhan_vien', 'ca-hai': '', 'theo-nhom': '_theo_nhom' };
const KHOA_TIEU_DE: Record<NoiDungIn, string> = { chuyen: 'chuyen', 'nhan-vien': 'nhanVien', 'ca-hai': 'caHai', 'theo-nhom': 'theoNhom' };
/** Cài đặt in (ẩn / độ rộng cột) nhớ riêng từng kiểu có bảng khác nhau. */
const MAU_KEY: Record<NoiDungIn, string> = {
  chuyen: 'bao-cao-nhan-cong',
  'ca-hai': 'bao-cao-nhan-cong',
  'nhan-vien': 'bao-cao-nhan-cong-nv',
  'theo-nhom': 'bao-cao-nhan-cong-theo-nhom',
};

const BaoCaoNhanCongPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const noiDung = docNoiDungIn(searchParams.get(NOI_DUNG_IN_PARAM));
  const inDoc = noiDung === 'nhan-vien' || noiDung === 'theo-nhom';
  const { data, isLoading: dangTaiPhieu, isError, error, refetch } = useBaoCaoNhanCongById(id ?? undefined);
  // Bảng «Tổng hợp theo nhóm» cần cài đặt thưởng vượt + KPI Báo cáo sơ chế → chờ tải xong rồi mới dàn trang in.
  const thuongVuot = useCaiDatThuongVuot(data?.id_chi_nhanh);
  const kpiSoChe = useKpiSoCheNgay(data?.id_chi_nhanh, data?.ngay);
  const viTri = useViTriSoChe();
  const viTriLoai = useViTriKhongThuongVuot();
  const isLoading =
    dangTaiPhieu || (!!data?.id_chi_nhanh && (thuongVuot.isPending || kpiSoChe.isPending)) || viTri.isPending;

  const loi = isError
    ? (error?.message ?? t('baoCaoNhanCong.preview.loadError'))
    : !isLoading && !data
      ? t('baoCaoNhanCong.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={data ? `${t(`baoCaoNhanCong.inKieu.${KHOA_TIEU_DE[noiDung]}`)} - ${formatYmdToDisplay(data.ngay?.slice(0, 10))}` : t('baoCaoNhanCong.preview.title')}
      mauKey={MAU_KEY[noiDung]}
      macDinh={inDoc ? MAC_DINH_NV : MAC_DINH}
      tenFile={data ? fileName(data) + HAU_TO_FILE[noiDung] : 'bao-cao-nhan-cong'}
      duongDanVe="/quan-ly-nha-so-che/bao-cao-nhan-cong"
      isLoading={isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        data
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => exportBaoCaoNhanCongToXLSX(data, noiDung, { caiDat: thuongVuot.caiDat, viTriLoai, kpi: kpiSoChe.kpi }) }]
          : undefined
      }
    >
      {data && <BaoCaoNhanCongPreviewContent data={data} noiDung={noiDung} />}
    </PhieuInPage>
  );
};

export default BaoCaoNhanCongPreviewPage;
