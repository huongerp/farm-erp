/**
 * Trang preview in phiếu đăng ký nhận hàng (khung in dùng chung — khổ, hướng, phông, cỡ chữ,
 * cột chỉnh trên bảng cài đặt, nhớ riêng từng loại phiếu).
 * Route: /quan-ly-nha-so-che/dang-ky-nhan-hang/preview/:id?loai=dang-ky|kiem-hang|tong-hop
 */
import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { coChuKhungPhieu } from '../../../components/shared/phieu-in/PhieuInParts';
import { useDangKyNhanHangById, useDangKyNhanHangChiTiet } from './hooks/use-dang-ky-nhan-hang';
import { gopTheoHangHoa } from './core/gop-hang-hoa';
import { docLoaiIn, macDinhIn, tenFileIn } from './core/mau-in';
import { taiXlsx } from './utils/export-phieu-in';
import { PhieuDangKyPreview, PhieuKiemHangPreview, PhieuTongHopPreview } from './components/preview/MauPhieu';

const DangKyNhanHangPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const loai = docLoaiIn(searchParams);
  const macDinh = useMemo(() => macDinhIn(loai), [loai]);
  const { data, isLoading, isError, error, refetch } = useDangKyNhanHangById(id);
  const { data: chiTiet = [], isLoading: ctLoading } = useDangKyNhanHangChiTiet(id);
  const nhom = useMemo(() => gopTheoHangHoa(chiTiet), [chiTiet]);

  const tieuDe = t(`dangKyNhanHang.preview.title.${loai}`);
  const loi = isError
    ? (error?.message ?? t('dangKyNhanHang.preview.loadError'))
    : !isLoading && !data
      ? t('dangKyNhanHang.preview.notFound')
      : null;
  const Mau = loai === 'kiem-hang' ? PhieuKiemHangPreview : loai === 'tong-hop' ? PhieuTongHopPreview : PhieuDangKyPreview;

  return (
    <PhieuInPage
      title={data ? `${tieuDe} - ${data.so_xe || data.so_cont || data.id}` : tieuDe}
      mauKey={`dang-ky-nhan-hang.${loai}`}
      macDinh={macDinh}
      coChuGocPt={coChuKhungPhieu}
      tenFile={data ? tenFileIn(loai, data) : `phieu-${loai}`}
      duongDanVe="/quan-ly-nha-so-che/dang-ky-nhan-hang"
      isLoading={isLoading || ctLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        data
          ? [{ key: 'xlsx', label: 'XLSX', icon: <FileSpreadsheet size={16} />, onClick: () => taiXlsx(data, nhom, loai, t) }]
          : undefined
      }
    >
      {data && <Mau phieu={data} nhom={nhom} />}
    </PhieuInPage>
  );
};

export default DangKyNhanHangPreviewPage;
