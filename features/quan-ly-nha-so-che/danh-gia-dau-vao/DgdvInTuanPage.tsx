/**
 * Trang in tổng hợp tuần Đánh giá đầu vào (khung in dùng chung — mặc định A4 ngang).
 * Route: /quan-ly-nha-so-che/danh-gia-dau-vao/in-tuan?nam=&tuan=&cn=&tt=&ksc=
 */
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { coChuKhungPhieu } from '../../../components/shared/phieu-in/PhieuInParts';
import { cacNgayCuaTuanFarm, khoangTuanFarm } from './core/tuan';
import { khopLocKsc, locDongTheoToTruong, tongHopTuanChiNhanh, tongHopTuanTheoLo } from './core/tong-hop';
import { useDgdvTongChuyen, useDgdvTongNgayDay } from './hooks/use-dgdv-tong-ngay';
import { useDgdvChiNhanhXem } from './hooks/use-dgdv-chi-nhanh-xem';
import { docThamSoInTuan } from './utils/preview-url';
import { taiXlsxTuan } from './utils/export-tong-hop';
import MauInTuan from './components/preview/MauInTuan';

const MAC_DINH_IN = { kho: 'a4', huong: 'ngang', leMm: 8 } as const;

const DgdvInTuanPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const ts = useMemo(() => docThamSoInTuan(searchParams), [searchParams]);
  const tuan = ts ? { nam: ts.nam, tuan: ts.tuan } : { nam: 2000, tuan: 1 };
  const ngays = useMemo(() => cacNgayCuaTuanFarm(tuan.nam, tuan.tuan), [tuan.nam, tuan.tuan]);
  const { tenCn, phamVi, thuTuCn, dangTaiPhamVi } = useDgdvChiNhanhXem(null);
  const q = useDgdvTongNgayDay(ngays[0], ngays[6], phamVi, !!ts && !dangTaiPhamVi);
  const qChuyen = useDgdvTongChuyen(ngays[0], ngays[6], phamVi, !!ts && !dangTaiPhamVi);

  const rowsDaChon = useMemo(() => {
    const ds = q.data ?? [];
    if (!ts || ts.idChiNhanh.length === 0) return ds;
    const chon = new Set(ts.idChiNhanh);
    return ds.filter((r) => chon.has(r.id_chi_nhanh));
  }, [q.data, ts]);
  const rows = useMemo(() => (ts ? locDongTheoToTruong(rowsDaChon, ts.toTruong) : []), [rowsDaChon, ts]);
  const thuTuCnIn = ts?.idChiNhanh.length ? ts.idChiNhanh : thuTuCn;
  const tatCaDong = useMemo(
    () => tongHopTuanChiNhanh(rows, ngays, thuTuCnIn, qChuyen.data ?? []),
    [rows, ngays, thuTuCnIn, qChuyen.data]
  );
  const dsDong = useMemo(() => (ts ? tatCaDong.filter((r) => khopLocKsc(r.ksc, ts.ksc)) : []), [tatCaDong, ts]);
  const rowsHien = useMemo(() => {
    const chiNhanh = new Set(dsDong.map((r) => r.id_chi_nhanh));
    return rows.filter((r) => chiNhanh.has(r.id_chi_nhanh));
  }, [rows, dsDong]);
  const tongTheoLo = useMemo(() => tongHopTuanTheoLo(rowsHien, ngays, thuTuCnIn), [rowsHien, ngays, thuTuCnIn]);
  const coChiNhanhNgoaiPhamVi = !!ts && !dangTaiPhamVi && ts.idChiNhanh.some((id) => !thuTuCn.includes(id));
  const tenFile = `danh-gia-dau-vao-tuan-${tuan.nam}-${String(tuan.tuan).padStart(2, '0')}`;
  const tieuDe = t('danhGiaDauVao.inTuan.tieuDe', { tuan: tuan.tuan, khoang: khoangTuanFarm(tuan) });
  const loi =
    !ts
      ? t('danhGiaDauVao.inTuan.thamSoSai')
      : coChiNhanhNgoaiPhamVi
        ? t('danhGiaDauVao.preview.khongCoQuyen')
        : q.isError || qChuyen.isError
          ? (q.error?.message ?? qChuyen.error?.message ?? t('danhGiaDauVao.preview.loadError'))
          : null;

  return (
    <PhieuInPage
      title={tieuDe}
      mauKey="danh-gia-dau-vao.tuan"
      macDinh={MAC_DINH_IN}
      coChuGocPt={coChuKhungPhieu}
      tenFile={tenFile}
      duongDanVe="/quan-ly-nha-so-che/danh-gia-dau-vao?tab=tuan"
      isLoading={!!ts && (dangTaiPhamVi || q.isPending || qChuyen.isPending)}
      loi={loi}
      onRetry={q.isError || qChuyen.isError ? () => {
        void q.refetch();
        void qChuyen.refetch();
      } : undefined}
      taiThem={
        ts
          ? [
              {
                key: 'xlsx',
                label: 'XLSX',
                icon: <FileSpreadsheet size={16} />,
                onClick: async () => {
                  if (!(await taiXlsxTuan(tongTheoLo, ngays, tenCn, tenFile, t))) toast.warning(t('danhGiaDauVao.tuan.khongCoDuLieu'));
                },
              },
            ]
          : undefined
      }
    >
      <MauInTuan tieuDe={tieuDe} ngays={ngays} dsDong={dsDong} rows={rowsHien} thuTuCn={thuTuCnIn} tenCn={tenCn} />
    </PhieuInPage>
  );
};

export default DgdvInTuanPage;
