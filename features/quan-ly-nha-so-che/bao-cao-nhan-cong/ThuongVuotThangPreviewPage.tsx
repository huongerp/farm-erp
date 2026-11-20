/**
 * Trang in «Bảng thưởng vượt thùng tháng». Route: /quan-ly-nha-so-che/bao-cao-nhan-cong/thuong-vuot-thang/in?cn=<id>&thang=yyyy-mm
 * Tháng đã chốt in từ ảnh chụp (bản chính thức); chưa chốt in số tính sống, dấu chìm «Bản nháp».
 * Khổ A4 dọc, có cột «Ký nhận» và hàng ký Người lập · Quản lý nhà sơ chế · Kế toán · Giám đốc.
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet } from 'lucide-react';
import PhieuInPage from '../../../components/shared/phieu-in/PhieuInPage';
import { HangKyTen, KhungPhieu, TD_IN, TH_IN } from '../../../components/shared/phieu-in/PhieuInParts';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../lib/utils';
import type { CaiDatThuongVuot, DongThuongThang } from './core/thuong-vuot-thung';
import { tongThuongThang } from './core/chot-thuong-thang';
import { duongDanInThuongThang } from './core/preview-url';
import { useBangThuongThang, useNhaSoCheTrongPhamVi } from './hooks/use-thuong-vuot';
import { exportThuongVuotThangToXLSX } from './utils/export-thuong-vuot-thang';

const MAC_DINH = { kho: 'a4', huong: 'doc', leMm: 10 } as const;
const fmt2 = (v: number) => formatNumberVN(v, { maxFractionDigits: 2 });
const so = 'text-right tabular-nums whitespace-nowrap';

export const NoiDungBangThuong: React.FC<{
  ds: readonly DongThuongThang[];
  thangHienThi: string;
  tenNhaSoChe: string;
  caiDat: CaiDatThuongVuot;
  ngayChot: string | null;
}> = ({ ds, thangHienThi, tenNhaSoChe, caiDat, ngayChot }) => {
  const { t } = useTranslation();
  const tong = tongThuongThang(ds);
  const th = cn(TH_IN, 'px-1.5 py-1');
  const td = cn(TD_IN, 'px-1.5 py-1');
  return (
    <KhungPhieu
      title={t('baoCaoNhanCong.vuot.inTieuDe', { thang: thangHienThi })}
      subtitle={tenNhaSoChe}
      ngay={ngayChot ? formatYmdToDisplay(ngayChot.slice(0, 10)) : undefined}
    >
      <p className="m-0 mb-2 text-[0.85em] italic text-gray-600">
        {t('baoCaoNhanCong.vuot.inGhiChu', {
          nguongPct: formatNumberVN(caiDat.nguongPct, { maxFractionDigits: 2 }),
          donGia: formatNumberVN(caiDat.donGia),
        })}
      </p>
      <table className="w-full border-collapse text-[0.9em]">
        <thead>
          <tr>
            <th className={cn(th, 'w-8 text-center')}>{t('baoCaoNhanCong.vuot.colStt')}</th>
            <th className={cn(th, 'text-left')}>{t('baoCaoNhanCong.nsNhom.colHoTen')}</th>
            <th className={cn(th, 'text-left')}>{t('baoCaoNhanCong.vuot.colViTri')}</th>
            <th className={cn(th, 'text-right')}>{t('baoCaoNhanCong.vuot.colSoNgay')}</th>
            <th className={cn(th, 'text-right')}>{t('baoCaoNhanCong.nv.gioCong')}</th>
            <th className={cn(th, 'text-right')}>{t('baoCaoNhanCong.vuot.colThungQuyDoi')}</th>
            <th className={cn(th, 'text-right')}>{t('baoCaoNhanCong.vuot.colTruocKi')}</th>
            <th className={cn(th, 'text-right')}>{t('baoCaoNhanCong.vuot.colKi')}</th>
            <th className={cn(th, 'text-right')}>{t('baoCaoNhanCong.vuot.colThuong')}</th>
            <th className={cn(th, 'w-[18mm] text-center')}>{t('baoCaoNhanCong.vuot.colKyNhan')}</th>
          </tr>
        </thead>
        <tbody>
          {ds.map((d, i) => (
            <tr key={d.khoa}>
              <td className={cn(td, 'text-center')}>{i + 1}</td>
              <td className={cn(td, 'whitespace-nowrap')}>{d.ho_ten}</td>
              <td className={td}>{d.vi_tri ?? ''}</td>
              <td className={cn(td, so)}>{d.soNgay}</td>
              <td className={cn(td, so)}>{fmt2(d.gioCong)}</td>
              <td className={cn(td, so)}>{fmt2(d.thungVuotQuyDoi)}</td>
              <td className={cn(td, so)}>{formatNumberVN(Math.round(d.tienTruocKi))}</td>
              <td className={cn(td, so)}>{fmt2(d.ki)}</td>
              <td className={cn(td, so, 'font-semibold')}>{formatNumberVN(d.tien)}</td>
              <td className={td} />
            </tr>
          ))}
          <tr className="font-bold bg-gray-50">
            <td className={td} />
            <td className={td} colSpan={3}>
              {t('baoCaoNhanCong.vuot.tongCongNhan', { n: ds.length })}
            </td>
            <td className={cn(td, so)}>{fmt2(tong.gio)}</td>
            <td className={cn(td, so)}>{fmt2(tong.thung)}</td>
            <td className={cn(td, so)}>{formatNumberVN(Math.round(tong.truocKi))}</td>
            <td className={td} />
            <td className={cn(td, so)}>{formatNumberVN(tong.tien)}</td>
            <td className={td} />
          </tr>
        </tbody>
      </table>
      <HangKyTen
        className="mt-5"
        labels={[
          t('baoCaoNhanCong.vuot.kyNguoiLap'),
          t('baoCaoNhanCong.vuot.kyQuanLy'),
          t('baoCaoNhanCong.vuot.kyKeToan'),
          t('baoCaoNhanCong.vuot.kyGiamDoc'),
        ]}
      />
    </KhungPhieu>
  );
};

const ThuongVuotThangPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const thangParam = searchParams.get('thang') ?? '';
  const thang = /^\d{4}-\d{2}$/.test(thangParam) ? thangParam : '';
  const { options, scope, isLoading: dangTaiNha } = useNhaSoCheTrongPhamVi();
  const cnParam = searchParams.get('cn') ?? '';
  const nha = options.find((o) => o.value === cnParam);
  const idChiNhanh = nha ? cnParam : '';
  const bang = useBangThuongThang(idChiNhanh, thang, scope);
  const thangHienThi = thang ? `${thang.slice(5, 7)}/${thang.slice(0, 4)}` : '';
  const tenNhaSoChe = nha?.label ?? '';

  const isLoading = dangTaiNha || bang.isLoading;
  const loi = !thang || (!dangTaiNha && !nha)
    ? t('baoCaoNhanCong.vuot.inKhongHopLe')
    : bang.isError
      ? t('baoCaoNhanCong.preview.loadError')
      : !isLoading && bang.ds.length === 0
        ? t('baoCaoNhanCong.vuot.thangTrong')
        : null;

  return (
    <PhieuInPage
      title={t('baoCaoNhanCong.vuot.inTieuDe', { thang: thangHienThi }) + (tenNhaSoChe ? ` - ${tenNhaSoChe}` : '')}
      mauKey="bao-cao-nhan-cong-thuong-vuot-thang"
      macDinh={MAC_DINH}
      tenFile={`thuong_vuot_${thang.replace('-', '_')}`}
      duongDanVe={`/quan-ly-nha-so-che/bao-cao-nhan-cong?tab=thuong-vuot&cn=${encodeURIComponent(cnParam)}&thang=${encodeURIComponent(thang)}`}
      duongDanGoc={thang && cnParam ? duongDanInThuongThang(cnParam, thang) : null}
      dauChim={bang.chot ? null : t('common.phieuIn.dauChim_nhap')}
      isLoading={isLoading}
      loi={loi}
      onRetry={bang.isError ? bang.refetch : undefined}
      taiThem={
        bang.ds.length > 0
          ? [
              {
                key: 'xlsx',
                label: 'XLSX',
                icon: <FileSpreadsheet size={16} />,
                onClick: () => void exportThuongVuotThangToXLSX({ ds: bang.ds, thang, tenNhaSoChe, caiDat: bang.caiDat }),
              },
            ]
          : undefined
      }
    >
      {bang.ds.length > 0 && (
        <NoiDungBangThuong ds={bang.ds} thangHienThi={thangHienThi} tenNhaSoChe={tenNhaSoChe} caiDat={bang.caiDat} ngayChot={bang.chot?.tgChot ?? null} />
      )}
    </PhieuInPage>
  );
};

export default ThuongVuotThangPreviewPage;
