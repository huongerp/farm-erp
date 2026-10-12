/**
 * Trang in "Danh sách dự kiến xe giao nhận hàng" theo đúng bộ lọc đang áp trên toolbar danh sách
 * (lấy MỌI trang, không chỉ trang đang xem). Khung in dùng chung — mặc định A4 ngang.
 * Route: /quan-ly-nha-so-che/dang-ky-nhan-hang/in-danh-sach?tu=&den=&q=&tt=&cn=&sort=&dir=
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { coChuKhungPhieu } from '../../../components/shared/phieu-in/PhieuInParts';
import { getTimezone } from '../../../lib/utils';
import { useBranches } from '../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { fetchAllDkNhForListQuery } from './services/dang-ky-nhan-hang-service';
import type { DangKyNhanHangListServerQuery } from './services/dang-ky-nhan-hang-list-query';
import { useDangKyNhanHangViewScope } from './hooks/use-dang-ky-nhan-hang-view-scope';
import { QUERY_KEY_DKNH } from './hooks/use-dang-ky-nhan-hang';
import { docThamSoInDanhSach, taoDongDanhSachIn, tenFileDanhSach, tieuDeDanhSach } from './core/danh-sach-in';
import { taiXlsxDanhSach } from './utils/export-phieu-in';
import MauDanhSachXe from './components/preview/MauDanhSachXe';

const MAC_DINH_IN = { kho: 'a4', huong: 'ngang', leMm: 8 } as const;

const DangKyNhanHangInDanhSachPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const loc = useMemo(() => docThamSoInDanhSach(searchParams), [searchParams]);
  const viewScope = useDangKyNhanHangViewScope();
  const { data: branches = [] } = useBranches();

  const query = useMemo<DangKyNhanHangListServerQuery>(
    () => ({
      page: 0,
      pageSize: 0,
      searchTerm: loc.q,
      viewAll: viewScope.viewAll,
      allowedBranchIds: viewScope.allowedBranchIds,
      trangThai: loc.trangThai,
      idChiNhanh: loc.idChiNhanh,
      ngayFrom: loc.tu || undefined,
      ngayTo: loc.den || undefined,
      sortColumn: loc.sortColumn,
      sortDirection: loc.sortDirection,
    }),
    [loc, viewScope.viewAll, viewScope.allowedBranchIds]
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...QUERY_KEY_DKNH, 'inDanhSach', query],
    queryFn: () => fetchAllDkNhForListQuery(query),
    enabled: !viewScope.isLoading,
  });

  const dong = useMemo(
    () => taoDongDanhSachIn(data ?? [], (tt) => t(`dangKyNhanHang.trangThai.${tt}`), getTimezone()),
    [data, t]
  );

  const td = tieuDeDanhSach(loc.tu, loc.den);
  const tieuDe = t(`dangKyNhanHang.inDanhSach.tieuDe.${td.key}`, td.vars);
  const tenFile = tenFileDanhSach(loc.tu, loc.den);

  /** Các bộ lọc khác ngoài thời gian — in dưới tiêu đề để biết bản in đang lọc gì. */
  const phuDe = useMemo(() => {
    const phan: string[] = [];
    const cn = loc.idChiNhanh
      .map((id) => branches.find((b) => b.id === id)?.ten_chi_nhanh)
      .filter(Boolean)
      .join(', ');
    if (cn) phan.push(`${t('dangKyNhanHang.col.chiNhanh')}: ${cn}`);
    if (loc.trangThai.length)
      phan.push(
        `${t('dangKyNhanHang.col.trangThai')}: ${loc.trangThai.map((s) => t(`dangKyNhanHang.trangThai.${s}`)).join(', ')}`
      );
    if (loc.q) phan.push(`${t('dangKyNhanHang.inDanhSach.tuKhoa')}: "${loc.q}"`);
    return phan.join(' · ') || undefined;
  }, [loc, branches, t]);

  return (
    <PhieuInPage
      title={tieuDe}
      mauKey="dang-ky-nhan-hang.danh-sach"
      macDinh={MAC_DINH_IN}
      coChuGocPt={coChuKhungPhieu}
      tenFile={tenFile}
      duongDanVe="/quan-ly-nha-so-che/dang-ky-nhan-hang"
      isLoading={viewScope.isLoading || isLoading}
      loi={isError ? (error?.message ?? t('dangKyNhanHang.preview.loadError')) : null}
      onRetry={isError ? () => void refetch() : undefined}
      taiThem={[
        {
          key: 'xlsx',
          label: 'XLSX',
          icon: <FileSpreadsheet size={16} />,
          onClick: () => taiXlsxDanhSach(tieuDe, tenFile, dong, t),
        },
      ]}
    >
      <MauDanhSachXe tieuDe={tieuDe} phuDe={phuDe} dong={dong} />
    </PhieuInPage>
  );
};

export default DangKyNhanHangInDanhSachPage;
