/**
 * Trang in phiếu đăng ký tham quan (khung in dùng chung, mặc định A5 ngang).
 * Route: /quan-ly-nha-so-che/dang-ky-tham-quan/preview/:id — id `trang` = phiếu trắng điền tay.
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useDangKyThamQuanById } from './hooks/use-dang-ky-tham-quan';
import { ID_PHIEU_TRANG, MAC_DINH_IN, tenFileIn } from './core/mau-in';
import PhieuThamQuanPreview, { coChuPhieuThamQuan } from './components/preview/PhieuThamQuanPreview';

const DangKyThamQuanPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const trang = id === ID_PHIEU_TRANG;
  const { data, isLoading, isError, error, refetch } = useDangKyThamQuanById(trang ? undefined : id);

  const loi = trang
    ? null
    : isError
      ? (error?.message ?? t('dangKyThamQuan.preview.notFound'))
      : !isLoading && !data
        ? t('dangKyThamQuan.preview.notFound')
        : null;
  const tieuDe = t('dangKyThamQuan.preview.title');

  return (
    <PhieuInPage
      title={data ? `${tieuDe} - ${data.nguoi_dai_dien ?? data.id}` : tieuDe}
      mauKey="dang-ky-tham-quan"
      macDinh={MAC_DINH_IN}
      coChuGocPt={coChuPhieuThamQuan}
      tenFile={tenFileIn(trang ? null : (data ?? null))}
      duongDanVe="/quan-ly-nha-so-che/dang-ky-tham-quan"
      isLoading={!trang && isLoading}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
    >
      {(trang || data) && <PhieuThamQuanPreview phieu={trang ? null : (data ?? null)} />}
    </PhieuInPage>
  );
};

export default DangKyThamQuanPreviewPage;
