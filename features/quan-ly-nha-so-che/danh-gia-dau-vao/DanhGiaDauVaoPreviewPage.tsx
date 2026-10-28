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
import { useDgdvTheoKhoang } from './hooks/use-danh-gia-dau-vao';
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
  const q = useDgdvTheoKhoang(
    ts?.tu ?? '',
    ts?.den ?? '',
    ts?.idChiNhanh ?? null,
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !!ts && !viewScope.isLoading
  );
  const dsPhieu = useMemo(() => q.data ?? [], [q.data]);
  // Như tab Tổng hợp ngày: mỗi ngày × chi nhánh một lưới cộng mọi chuyến.
  const { dsKhoi, dangTaiMau } = useDungLuoi(dsPhieu, ts?.tu ?? '', ts?.den ?? '', true);

  const tieuDe = ts
    ? `${t('danhGiaDauVao.title')} - ${formatYmdToDisplay(ts.tu)}${ts.den !== ts.tu ? ` → ${formatYmdToDisplay(ts.den)}` : ''}`
    : t('danhGiaDauVao.title');
  const loi = !ts ? t('danhGiaDauVao.preview.thamSoSai') : q.isError ? (q.error?.message ?? t('danhGiaDauVao.preview.loadError')) : null;

  return (
    <PhieuInPage
      title={tieuDe}
      mauKey="danh-gia-dau-vao"
      macDinh={MAC_DINH_IN}
      coChuGocPt={coChuKhungPhieu}
      tenFile={ts ? tenFileLuoi(ts.tu, ts.den) : 'danh-gia-dau-vao'}
      duongDanVe="/quan-ly-nha-so-che/danh-gia-dau-vao?tab=bang"
      isLoading={!!ts && (viewScope.isLoading || q.isPending || dangTaiMau)}
      loi={loi}
      onRetry={q.isError ? () => void q.refetch() : undefined}
      taiThem={
        ts
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
      <DgdvPreviewContent dsKhoi={dsKhoi} />
    </PhieuInPage>
  );
};

export default DanhGiaDauVaoPreviewPage;
