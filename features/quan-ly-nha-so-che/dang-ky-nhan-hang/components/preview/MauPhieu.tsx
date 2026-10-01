/** Ba mẫu in: phiếu đăng ký ra/vào cổng, phiếu kiểm hàng, phiếu tổng hợp. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTimeShort, formatYmdToDisplay, getTimezone } from '../../../../../lib/utils';
import type { DangKyNhanHang } from '../../core/types';
import type { NhomHangHoa } from '../../core/gop-hang-hoa';
import type { HuongGiay, KhoGiay } from '../../core/mau-in';
import {
  NGUONG_TRE_PHUT,
  formatThoiLuong,
  soPhutRaQuaGio,
  soPhutTrongFarm,
  soPhutVaoTre,
} from '../../core/thoi-gian';
import { BangHangHoa, BangThongTin, DongCham, HangKyTen, KhungPhieu, TieuDeMuc } from './PreviewParts';

export interface MauPhieuProps {
  phieu: DangKyNhanHang;
  nhom: NhomHangHoa[];
  kho: KhoGiay;
  huong: HuongGiay;
}

const xeCont = (p: DangKyNhanHang) => [p.so_xe, p.so_cont].filter(Boolean).join(' / ');
const taiXe = (p: DangKyNhanHang) => [p.ten_tai_xe, p.sdt_tai_xe].filter(Boolean).join(' – ');
const gio = (iso: string | null) => (iso ? formatDateTimeShort(iso) : '');

/** Khối ký "Tổ chức hành chính" — chỗ ký + đóng dấu như phiếu giấy. */
const KhoiHanhChinh: React.FC<{ nho: boolean }> = ({ nho }) => {
  const { t } = useTranslation();
  return (
    <div className="text-center break-inside-avoid">
      <p className="font-bold m-0">{t('dangKyNhanHang.preview.kyHanhChinh')}</p>
      <p className="text-[0.8em] italic text-gray-500 m-0">{t('dangKyNhanHang.preview.kyDongDau')}</p>
      <div className={nho ? 'h-[20mm]' : 'h-[26mm]'} />
    </div>
  );
};

/** 1) Phiếu đăng ký ra/vào cổng — bám mẫu giấy "PHIẾU ĐĂNG KÝ NHẬN HÀNG". */
export const PhieuDangKyPreview: React.FC<MauPhieuProps> = ({ phieu, kho, huong }) => {
  const { t } = useTranslation();
  const nho = kho === 'a5';
  const ngang = huong === 'ngang';
  const gap = nho ? 'space-y-2' : 'space-y-3';

  const thongTin = (
    <div className={gap}>
      <DongCham label={t('dangKyNhanHang.col.khachHang')} value={phieu.khach_hang} />
      <DongCham label={t('dangKyNhanHang.col.loaiHang')} value={phieu.loai_hang_hoa} />
      <DongCham label={t('dangKyNhanHang.preview.soXeSoCont')} value={xeCont(phieu)} />
      <DongCham label={t('dangKyNhanHang.preview.tenTaiXe')} value={taiXe(phieu)} />
      <p className="font-semibold m-0 pt-1">{t('dangKyNhanHang.form.xinPhepRaVao')}</p>
      <div className="flex gap-3">
        <DongCham className="flex-[1.3]" label={t('dangKyNhanHang.preview.ngay')} value={formatYmdToDisplay(phieu.ngay_dang_ky)} />
        <DongCham className="flex-1" label={t('dangKyNhanHang.form.tuGio')} value={phieu.gio_dang_ky_tu} />
        <DongCham className="flex-1" label={t('dangKyNhanHang.form.denGio')} value={phieu.gio_dang_ky_den} />
      </div>
    </div>
  );

  const thucTe = (
    <div className={gap}>
      <DongCham label={t('dangKyNhanHang.col.ghiChu')} value={phieu.ghi_chu} />
      <DongCham label={t('dangKyNhanHang.preview.thucTeGioVao')} value={gio(phieu.tg_vao_thuc_te)} />
      <DongCham label={t('dangKyNhanHang.preview.thucTeGioRa')} value={gio(phieu.tg_ra_thuc_te)} />
    </div>
  );

  return (
    <KhungPhieu kho={kho} huong={huong} title={t('dangKyNhanHang.preview.title.dang-ky')}>
      {ngang ? (
        <div className="grid grid-cols-[1.4fr_1fr] gap-6 flex-1">
          <div className={gap}>
            {thongTin}
            {thucTe}
          </div>
          <div className="flex flex-col justify-start pt-2">
            <KhoiHanhChinh nho={nho} />
          </div>
        </div>
      ) : (
        <div className={gap}>
          {thongTin}
          <div className="grid grid-cols-[1fr_auto] gap-4 items-start pt-1">
            {thucTe}
            <div className="min-w-[38%]">
              <KhoiHanhChinh nho={nho} />
            </div>
          </div>
        </div>
      )}
    </KhungPhieu>
  );
};

/** Dòng thông tin chung của phiếu kiểm hàng / tổng hợp. */
function useThongTinChung(phieu: DangKyNhanHang): [string, React.ReactNode][] {
  const { t } = useTranslation();
  return [
    [t('dangKyNhanHang.col.ngay'), formatYmdToDisplay(phieu.ngay_dang_ky)],
    [t('dangKyNhanHang.col.chiNhanh'), phieu.ten_chi_nhanh],
    [t('dangKyNhanHang.col.khachHang'), phieu.khach_hang],
    [t('dangKyNhanHang.col.loaiHang'), phieu.loai_hang_hoa],
    [t('dangKyNhanHang.col.soXe'), phieu.so_xe],
    [t('dangKyNhanHang.col.soCont'), phieu.so_cont],
    [t('dangKyNhanHang.col.taiXe'), phieu.ten_tai_xe],
    [t('dangKyNhanHang.col.sdtTaiXe'), phieu.sdt_tai_xe],
  ];
}

/** 2) Phiếu kiểm hàng xuất (A4 dọc). */
export const PhieuKiemHangPreview: React.FC<MauPhieuProps> = ({ phieu, nhom }) => {
  const { t } = useTranslation();
  const chung = useThongTinChung(phieu);
  return (
    <KhungPhieu kho="a4" huong="doc" title={t('dangKyNhanHang.preview.title.kiem-hang')}>
      <BangThongTin
        rows={[
          ...chung,
          [t('dangKyNhanHang.col.gioVao'), gio(phieu.tg_vao_thuc_te)],
          [t('dangKyNhanHang.col.gioRa'), gio(phieu.tg_ra_thuc_te)],
        ]}
      />
      <TieuDeMuc>{t('dangKyNhanHang.hangHoa.title')}</TieuDeMuc>
      <BangHangHoa nhom={nhom} />
      <HangKyTen
        labels={[
          t('dangKyNhanHang.preview.kyNguoiKiem'),
          t('dangKyNhanHang.preview.kyTaiXe'),
          t('dangKyNhanHang.preview.kyBaoVe'),
          t('dangKyNhanHang.preview.kyQuanLy'),
        ]}
      />
    </KhungPhieu>
  );
};

const ANH_TOI_DA = 6;

/** 3) Phiếu tổng hợp: đăng ký + thời gian + hàng hoá + ảnh (A4 dọc). */
export const PhieuTongHopPreview: React.FC<MauPhieuProps> = ({ phieu, nhom }) => {
  const { t } = useTranslation();
  const tz = getTimezone();
  const chung = useThongTinChung(phieu);
  const phut = soPhutTrongFarm(phieu.tg_vao_thuc_te, phieu.tg_ra_thuc_te);
  const tre = soPhutVaoTre(phieu.ngay_dang_ky, phieu.gio_dang_ky_tu, phieu.tg_vao_thuc_te, tz);
  const qua = soPhutRaQuaGio(phieu.ngay_dang_ky, phieu.gio_dang_ky_tu, phieu.gio_dang_ky_den, phieu.tg_ra_thuc_te, tz);
  const lech = (p: number | null, keyTre: string, keySom: string) => {
    if (p == null) return '';
    if (p > NGUONG_TRE_PHUT) return <span className="text-red-700 font-semibold">{t(keyTre, { tg: formatThoiLuong(p) })}</span>;
    if (p < 0) return t(keySom, { tg: formatThoiLuong(-p) });
    return t('dangKyNhanHang.detail.dungGio');
  };
  const anh = phieu.hinh_anh_urls.slice(0, ANH_TOI_DA);
  const conLai = phieu.hinh_anh_urls.length - anh.length;

  return (
    <KhungPhieu kho="a4" huong="doc" title={t('dangKyNhanHang.preview.title.tong-hop')}>
      <TieuDeMuc>1. {t('dangKyNhanHang.detail.thongTinDangKy')}</TieuDeMuc>
      <BangThongTin
        rows={[
          ...chung,
          [t('dangKyNhanHang.col.gioDangKy'), phieu.gio_dang_ky_tu || phieu.gio_dang_ky_den ? `${phieu.gio_dang_ky_tu ?? '…'} – ${phieu.gio_dang_ky_den ?? '…'}` : ''],
          [t('dangKyNhanHang.col.trangThai'), t(`dangKyNhanHang.trangThai.${phieu.trang_thai}`)],
          [t('dangKyNhanHang.col.ghiChu'), <span key="ghiChu" className="whitespace-pre-line">{phieu.ghi_chu}</span>],
        ]}
      />

      <TieuDeMuc>2. {t('dangKyNhanHang.detail.thoiGian')}</TieuDeMuc>
      <BangThongTin
        rows={[
          [t('dangKyNhanHang.col.gioVao'), gio(phieu.tg_vao_thuc_te)],
          [t('dangKyNhanHang.col.gioRa'), gio(phieu.tg_ra_thuc_te)],
          [t('dangKyNhanHang.col.thoiLuong'), phut != null ? formatThoiLuong(phut) : ''],
          [t('dangKyNhanHang.preview.soVoiDangKy'), (
            <span key="lech" className="flex flex-col">
              <span>{lech(tre, 'dangKyNhanHang.detail.vaoTre', 'dangKyNhanHang.detail.vaoSom')}</span>
              <span>{lech(qua, 'dangKyNhanHang.detail.raQuaGio', 'dangKyNhanHang.detail.raSom')}</span>
            </span>
          )],
          [t('dangKyNhanHang.detail.nguoiCheckIn'), phieu.ten_nguoi_check_in],
          [t('dangKyNhanHang.detail.nguoiCheckOut'), phieu.ten_nguoi_check_out],
        ]}
      />

      <TieuDeMuc>3. {t('dangKyNhanHang.hangHoa.title')}</TieuDeMuc>
      <BangHangHoa nhom={nhom} />

      {anh.length > 0 && (
        <div className="break-inside-avoid">
          <TieuDeMuc>4. {t('dangKyNhanHang.anh.title')}</TieuDeMuc>
          <div className="grid grid-cols-3 gap-2">
            {anh.map((src, i) => (
              <div key={src + i} className="aspect-[16/9] border border-gray-300 overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          {conLai > 0 && <p className="text-[0.85em] text-gray-500 mt-1">{t('dangKyNhanHang.preview.conAnh', { n: conLai })}</p>}
        </div>
      )}

      <HangKyTen
        labels={[
          t('dangKyNhanHang.preview.kyHanhChinh'),
          t('dangKyNhanHang.preview.kyNguoiKiem'),
          t('dangKyNhanHang.preview.kyBaoVe'),
          t('dangKyNhanHang.preview.kyQuanLy'),
        ]}
      />
    </KhungPhieu>
  );
};
