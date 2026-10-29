/**
 * Trang in Bảng đánh giá đầu vào (khung in dùng chung — mặc định A4 ngang).
 * Route: /quan-ly-nha-so-che/danh-gia-dau-vao/preview?cn=<id>&tu=YYYY-MM-DD&den=YYYY-MM-DD
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { coChuKhungPhieu } from '../../../components/shared/phieu-in/PhieuInParts';
import { formatYmdToDisplay } from '../../../lib/utils';
import { useDgdvById, useDgdvTheoKhoang } from './hooks/use-danh-gia-dau-vao';
import { useDgdvViewScope } from './hooks/use-danh-gia-dau-vao-permissions';
import { useDungLuoi } from './hooks/use-dung-luoi';
import { docThamSoPreview } from './utils/preview-url';
import { taiXlsxLuoi, tenFileLuoi } from './utils/export-luoi';
import DgdvPreviewContent from './components/preview/DgdvPreviewContent';

const MAC_DINH_IN = { kho: 'a4', huong: 'ngang', leMm: 8 } as const;

const DanhGiaDauVaoPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const ts = useMemo(() => docThamSoPreview(searchParams), [searchParams]);
  const viewScope = useDgdvViewScope();
  const laChuyen = ts?.loai === 'chuyen';
  const q = useDgdvTheoKhoang(
    ts?.loai === 'ngay' ? ts.tu : '',
    ts?.loai === 'ngay' ? ts.den : '',
    ts?.loai === 'ngay' ? ts.idChiNhanh : null,
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !!ts && !laChuyen && !viewScope.isLoading
  );
  const qChuyen = useDgdvById(ts?.loai === 'chuyen' && !viewScope.isLoading ? ts.id : undefined);
  const phieuChuyen = qChuyen.data ?? null;
  const duocXemChuyen =
    !phieuChuyen || viewScope.viewAll || viewScope.allowedBranchIds.includes(phieuChuyen.id_chi_nhanh);
  const ngayChuyen = phieuChuyen?.ngay ?? '';
  const dsPhieu = useMemo(() => (laChuyen ? (phieuChuyen ? [phieuChuyen] : []) : (q.data ?? [])), [laChuyen, phieuChuyen, q.data]);
  // Như tab Tổng hợp ngày: mỗi ngày × chi nhánh một lưới cộng mọi chuyến.
  const { dsKhoi, dangTaiMau } = useDungLuoi(
    dsPhieu,
    laChuyen ? ngayChuyen : ts?.loai === 'ngay' ? ts.tu : '',
    laChuyen ? ngayChuyen : ts?.loai === 'ngay' ? ts.den : '',
    !laChuyen
  );

  const tieuDe =
    ts?.loai === 'chuyen'
      ? `${t('danhGiaDauVao.title')} - ${t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen: phieuChuyen?.chuyen ?? '' })}`
      : ts?.loai === 'ngay'
        ? `${t('danhGiaDauVao.title')} - ${formatYmdToDisplay(ts.tu)}${ts.den !== ts.tu ? ` → ${formatYmdToDisplay(ts.den)}` : ''}`
        : t('danhGiaDauVao.title');
  const loi =
    !ts
      ? t('danhGiaDauVao.preview.thamSoSai')
      : laChuyen
        ? !duocXemChuyen
          ? t('danhGiaDauVao.preview.khongCoQuyen')
          : qChuyen.isError
            ? (qChuyen.error?.message ?? t('danhGiaDauVao.preview.loadError'))
            : !qChuyen.isPending && !phieuChuyen
              ? t('danhGiaDauVao.preview.khongTimThayPhieu')
              : null
        : q.isError
          ? (q.error?.message ?? t('danhGiaDauVao.preview.loadError'))
          : null;

  return (
    <PhieuInPage
      title={tieuDe}
      mauKey="danh-gia-dau-vao"
      macDinh={MAC_DINH_IN}
      coChuGocPt={coChuKhungPhieu}
      tenFile={
        ts?.loai === 'chuyen' && phieuChuyen
          ? `${tenFileLuoi(phieuChuyen.ngay, phieuChuyen.ngay)}-chuyen-${phieuChuyen.chuyen}`
          : ts?.loai === 'ngay'
            ? tenFileLuoi(ts.tu, ts.den)
            : 'danh-gia-dau-vao'
      }
      duongDanVe="/quan-ly-nha-so-che/danh-gia-dau-vao?tab=bang"
      isLoading={!!ts && (viewScope.isLoading || (laChuyen ? qChuyen.isPending : q.isPending) || dangTaiMau)}
      loi={loi}
      onRetry={laChuyen ? (qChuyen.isError ? () => void qChuyen.refetch() : undefined) : q.isError ? () => void q.refetch() : undefined}
      taiThem={
        ts?.loai === 'chuyen' && phieuChuyen
          ? [
              {
                key: 'xlsx',
                label: 'XLSX',
                icon: <FileSpreadsheet size={16} />,
                onClick: async () => {
                  if (!(await taiXlsxLuoi(dsKhoi, phieuChuyen.ngay, phieuChuyen.ngay, t, `${tenFileLuoi(phieuChuyen.ngay, phieuChuyen.ngay)}-chuyen-${phieuChuyen.chuyen}`))) {
                    toast.warning(t('danhGiaDauVao.bang.khongCoDuLieu'));
                  }
                },
              },
            ]
          : ts?.loai === 'ngay'
          ? [
              {
                key: 'xlsx',
                label: 'XLSX',
                icon: <FileSpreadsheet size={16} />,
                onClick: async () => {
                  if (!(await taiXlsxLuoi(dsKhoi, ts.tu, ts.den, t))) toast.warning(t('danhGiaDauVao.bang.khongCoDuLieu'));
                },
              },
            ]
          : undefined
      }
    >
      <DgdvPreviewContent dsKhoi={dsKhoi} chuyen={laChuyen ? phieuChuyen?.chuyen : undefined} />
    </PhieuInPage>
  );
};

export default DanhGiaDauVaoPreviewPage;
