/**
 * Trang in "Danh sách dự kiến xe giao nhận hàng" một ngày (khung in dùng chung — mặc định A4 ngang).
 * Route: /quan-ly-nha-so-che/dang-ky-nhan-hang/in-danh-sach?ngay=YYYY-MM-DD&cn=1,2
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { coChuKhungPhieu } from '../../../components/shared/phieu-in/PhieuInParts';
import { useBranches } from '../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { fetchAllDkNhForListQuery } from './services/dang-ky-nhan-hang-service';
import { useDangKyNhanHangViewScope } from './hooks/use-dang-ky-nhan-hang-view-scope';
import { QUERY_KEY_DKNH } from './hooks/use-dang-ky-nhan-hang';
import {
  TRANG_THAI_IN_DANH_SACH,
  docThamSoInDanhSach,
  ngayVn,
  taoDongDanhSachIn,
  tenFileDanhSach,
} from './core/danh-sach-in';
import { taiXlsxDanhSach } from './utils/export-phieu-in';
import MauDanhSachXe from './components/preview/MauDanhSachXe';

const MAC_DINH_IN = { kho: 'a4', huong: 'ngang', leMm: 8 } as const;

const DangKyNhanHangInDanhSachPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { ngay, idChiNhanh } = useMemo(() => docThamSoInDanhSach(searchParams), [searchParams]);
  const viewScope = useDangKyNhanHangViewScope();
  const { data: branches = [] } = useBranches();

  const query = useMemo(
    () => ({
      page: 0,
      pageSize: 0,
      searchTerm: '',
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      nam: [],
      thang: [],
      trangThai: TRANG_THAI_IN_DANH_SACH,
      idChiNhanh,
      ngayFrom: ngay ?? undefined,
      ngayTo: ngay ?? undefined,
      sortColumn: 'gio_dang_ky_tu',
      sortDirection: 'asc' as const,
    }),
    [viewScope.viewAll, viewScope.allowedBranchIds, idChiNhanh, ngay]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...QUERY_KEY_DKNH, 'inDanhSach', query],
    queryFn: () => fetchAllDkNhForListQuery(query),
    enabled: !!ngay && !viewScope.isLoading,
  });

  const dong = useMemo(
    () => taoDongDanhSachIn(data ?? [], (tt) => t(`dangKyNhanHang.trangThai.${tt}`)),
    [data, t]
  );
  const tenChiNhanh = useMemo(
    () =>
      idChiNhanh
        .map((id) => branches.find((b) => b.id === id)?.ten_chi_nhanh)
        .filter(Boolean)
        .join(', '),
    [idChiNhanh, branches]
  );

  const tieuDe = ngay
    ? t('dangKyNhanHang.inDanhSach.tieuDe', { ngay: ngayVn(ngay) })
    : t('dangKyNhanHang.inDanhSach.nutIn');
  const loi = !ngay
    ? t('dangKyNhanHang.inDanhSach.ngayKhongHopLe')
    : isError
      ? (error?.message ?? t('dangKyNhanHang.preview.loadError'))
      : null;

  return (
    <PhieuInPage
      title={tieuDe}
      mauKey="dang-ky-nhan-hang.danh-sach"
      macDinh={MAC_DINH_IN}
      coChuGocPt={coChuKhungPhieu}
      tenFile={ngay ? tenFileDanhSach(ngay) : 'danh-sach-xe'}
      duongDanVe="/quan-ly-nha-so-che/dang-ky-nhan-hang"
      isLoading={!!ngay && (viewScope.isLoading || isLoading)}
      loi={loi}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={
        ngay
          ? [
              {
                key: 'xlsx',
                label: 'XLSX',
                icon: <FileSpreadsheet size={16} />,
                onClick: () => taiXlsxDanhSach(ngay, dong, t),
              },
            ]
          : undefined
      }
    >
      {ngay && <MauDanhSachXe ngay={ngay} dong={dong} chiNhanh={tenChiNhanh || undefined} />}
    </PhieuInPage>
  );
};

export default DangKyNhanHangInDanhSachPage;
