/**
 * Trang in "Lý lịch bảo dưỡng thiết bị" — route /quan-ly-nha-so-che/bao-duong-thiet-bi/preview/:id
 * `:id` là id thiết bị (không phải id việc).
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { useEmployeesRefQuery } from '../../../lib/hooks/use-ref-queries';
import { useTaiSanRef, useThietBiChiTiet } from './hooks/use-bao-duong-thiet-bi';
import LyLichBaoDuongPreview from './components/preview/LyLichBaoDuongPreview';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 10 } as const;

const ThietBiPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const chiTietQuery = useThietBiChiTiet(id ?? '');
  const { data: taiSanList = [] } = useTaiSanRef();
  const { data: nhanVienList = [] } = useEmployeesRefQuery();

  const chiTiet = chiTietQuery.data;
  const thietBi = chiTiet?.thietBi ?? null;
  const taiSan = thietBi?.id_tai_san ? (taiSanList.find((x) => x.id === thietBi.id_tai_san) ?? null) : null;

  const isLoading = !!id && chiTietQuery.isPending;
  const loi = chiTietQuery.isError
    ? (chiTietQuery.error?.message ?? t('baoDuongThietBi.preview.notFound'))
    : !isLoading && !thietBi
      ? t('baoDuongThietBi.preview.notFound')
      : null;

  return (
    <PhieuInPage
      title={
        thietBi
          ? `${t('baoDuongThietBi.preview.lyLichTitle')} - ${thietBi.ten}`
          : t('baoDuongThietBi.preview.lyLichTitle')
      }
      mauKey="bao-duong-thiet-bi-ly-lich"
      macDinh={MAC_DINH}
      coChuGocPt={10}
      tenFile={`Ly-lich-bao-duong-${thietBi?.ma_ts ?? id ?? ''}`}
      duongDanVe="/quan-ly-nha-so-che/bao-duong-thiet-bi"
      isLoading={isLoading}
      loi={loi}
      onRetry={chiTietQuery.isError ? () => void chiTietQuery.refetch() : undefined}
    >
      {thietBi && chiTiet && (
        <LyLichBaoDuongPreview
          thietBi={thietBi}
          viec={chiTiet.viec}
          nhatKy={chiTiet.nhatKy}
          taiSan={taiSan}
          nhanVien={nhanVienList}
        />
      )}
    </PhieuInPage>
  );
};

export default ThietBiPreviewPage;
