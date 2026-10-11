/**
 * Trang in báo cáo thống kê thu hoạch (khung in dùng chung — mặc định A4 ngang).
 * Route: /quan-ly-nha-so-che/thu-hoach/in-thong-ke?cd=thu|tuan|thang&tu=&den=&nam=&tuan=&cn=&tt=
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { coChuKhungPhieu } from '../../../components/shared/phieu-in/PhieuInParts';
import { docThamSo } from './core/thong-ke-loc';
import { useThongKeThuHoach } from './hooks/use-thong-ke-thu-hoach';
import { taiXlsxThongKe, tenFileThongKe } from './utils/export-thong-ke';
import MauThongKeThuHoach from './components/preview/MauThongKeThuHoach';

const MAC_DINH_IN = { kho: 'a4', huong: 'ngang', leMm: 8 } as const;

const ThuHoachInThongKePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const loc = useMemo(() => docThamSo(searchParams), [searchParams]);
  const { pivot, nhanCot, tenFarm, tieuDe, moTaLoc, isLoading, isError, error, refetch } = useThongKeThuHoach(loc);
  const nhan = pivot.cot.map(nhanCot);

  return (
    <PhieuInPage
      title={tieuDe}
      mauKey="thu-hoach.thong-ke"
      macDinh={MAC_DINH_IN}
      coChuGocPt={coChuKhungPhieu}
      tenFile={tenFileThongKe(loc.cheDo)}
      duongDanVe="/quan-ly-nha-so-che/thu-hoach?tab=stats"
      isLoading={isLoading}
      loi={isError ? (error?.message ?? t('thuHoach.inThongKe.loadError')) : null}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={[
        {
          key: 'xlsx',
          label: 'XLSX',
          icon: <FileSpreadsheet size={16} />,
          onClick: () => taiXlsxThongKe(pivot, loc.cheDo, nhan, tenFarm, tieuDe, moTaLoc, t),
        },
      ]}
    >
      <MauThongKeThuHoach
        tieuDe={tieuDe}
        moTaLoc={moTaLoc}
        cheDo={loc.cheDo}
        pivot={pivot}
        nhanCot={nhan}
        tenFarm={tenFarm}
      />
    </PhieuInPage>
  );
};

export default ThuHoachInThongKePage;
