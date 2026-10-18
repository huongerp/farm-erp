/**
 * Nội dung in đơn đặt hàng (PO) — khung chuẩn hệ thống (PhieuInParts): thông tin đơn, bảng hàng hoá
 * (chữ dài xuống dòng, không cắt "…"; cột trống tự ẩn), tổng cộng + số tiền bằng chữ, ô ký.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { soTienBangChu } from '../../../../lib/so-tien-bang-chu';
import { cotCoDuLieu } from '../../../../lib/phieu-in/tong-so-luong';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
} from '../../../../components/shared/phieu-in/PhieuInParts';
import type { DonDatHang } from '../core/types';
import { TRANG_THAI_KEY } from '../core/constants';

const th = `${TH_IN} p-1.5 text-[9pt]`;
const td = `${TD_IN} p-1.5`;
const ngayIn = (v?: string | null) => formatYmdToDisplay(v?.slice(0, 10));
const tien = (v: number | null | undefined) => (v != null ? formatNumberVN(v, { maxFractionDigits: 0 }) : '');

interface Props {
  po: DonDatHang;
}

const DonDatHangPreviewContent: React.FC<Props> = ({ po }) => {
  const { t } = useTranslation();
  const chiTiet = po.chi_tiet ?? [];
  const trangThaiKey = TRANG_THAI_KEY[po.trang_thai];
  const coDanhMuc = cotCoDuLieu(chiTiet, (c) => c.ten_danh_muc_cap2 ?? c.ten_danh_muc_cap1);
  const coMucDich = cotCoDuLieu(chiTiet, (c) => c.muc_dich_su_dung);
  const coGhiChu = cotCoDuLieu(chiTiet, (c) => c.ghi_chu);
  const tongTien = chiTiet.reduce((s, c) => s + (Number(c.thanh_tien) || 0), 0);
  const soCotTruocTien = 6 + (coDanhMuc ? 1 : 0);
  const soCotSau = (coMucDich ? 1 : 0) + (coGhiChu ? 1 : 0);

  const thongTin: [string, React.ReactNode][] = [
    [t('donDatHang.form.supplier'), [po.ma_nha_cung_cap, po.ten_nha_cung_cap].filter(Boolean).join(' - ')],
    [t('donDatHang.form.warehouse'), po.ten_kho_nhan],
    [t('donDatHang.form.deliveryDate'), ngayIn(po.ngay_giao_dk)],
    [t('donDatHang.store.statusCol'), trangThaiKey ? t(`donDatHang.status.${trangThaiKey}`) : po.trang_thai],
    [t('donDatHang.form.buyer'), po.ten_nguoi_dat],
    [t('donDatHang.form.linkRequest'), po.so_phieu_de_xuat],
    [t('donDatHang.form.paymentTerms'), po.dieu_khoan_thanh_toan],
  ];

  return (
    <KhungPhieu title={t('donDatHang.preview.title')} soPhieu={po.so_po} ngay={ngayIn(po.ngay_dat)}>
      <BangThongTin rows={thongTin} />
      {po.ghi_chu?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('donDatHang.form.notes')}: </span>
          {po.ghi_chu}
        </p>
      )}

      {chiTiet.length > 0 && (
        <>
          <div className="flex items-end justify-between mt-3 mb-1">
            <p className="font-bold uppercase m-0">{t('donDatHang.form.itemsSection')}</p>
            <p className="italic text-[0.9em] m-0">{t('common.phieuIn.donViTinhDong')}</p>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${th} text-center w-8`}>{t('common.phieuIn.stt')}</th>
                {coDanhMuc && <th className={`${th} text-left`}>{t('donDatHang.preview.danhMuc')}</th>}
                <th className={`${th} text-left w-[12%]`}>{t('donDatHang.preview.maHang')}</th>
                <th className={`${th} text-left`}>{t('donDatHang.preview.tenHang')}</th>
                <th className={`${th} text-center w-14`}>{t('common.phieuIn.dvt')}</th>
                <th className={`${th} text-right w-16`}>{t('donDatHang.form.quantity')}</th>
                <th className={`${th} text-right w-20`}>{t('donDatHang.form.unitPrice')}</th>
                <th className={`${th} text-right w-24`}>{t('donDatHang.form.amount')}</th>
                {coMucDich && <th className={`${th} text-left`}>{t('donDatHang.chiTietTab.purposeOfUseCol')}</th>}
                {coGhiChu && <th className={`${th} text-left`}>{t('donDatHang.form.note')}</th>}
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((ct, idx) => (
                <tr key={ct.id}>
                  <td className={`${td} text-center`}>{idx + 1}</td>
                  {coDanhMuc && (
                    <td className={`${td} text-[0.9em]`}>
                      {[ct.ten_danh_muc_cap1, ct.ten_danh_muc_cap2].filter(Boolean).join(' / ')}
                    </td>
                  )}
                  <td className={`${td} text-[0.9em] break-all`}>{ct.ma_hang}</td>
                  <td className={td}>{ct.ten_hang}</td>
                  <td className={`${td} text-center`}>{ct.don_vi_tinh}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatNumberVN(ct.so_luong)}</td>
                  <td className={`${td} text-right tabular-nums`}>{tien(ct.don_gia)}</td>
                  <td className={`${td} text-right tabular-nums font-medium`}>{tien(ct.thanh_tien)}</td>
                  {coMucDich && <td className={`${td} text-[0.9em]`}>{ct.muc_dich_su_dung}</td>}
                  {coGhiChu && <td className={`${td} text-[0.9em]`}>{ct.ghi_chu}</td>}
                </tr>
              ))}
            </tbody>
            <tfoot className="break-inside-avoid">
              <tr className="bg-gray-100 font-bold">
                <td colSpan={soCotTruocTien} className={td}>
                  {t('common.phieuIn.tongCong')}
                </td>
                <td className={`${td} text-right tabular-nums`}>{tien(tongTien)}</td>
                {soCotSau > 0 && <td colSpan={soCotSau} className={td} />}
              </tr>
            </tfoot>
          </table>
          {tongTien > 0 && (
            <p className="mt-1 mb-0 break-inside-avoid">
              <span className="font-semibold">{t('common.phieuIn.bangChu')}: </span>
              <span className="italic">{soTienBangChu(tongTien)}</span>
            </p>
          )}
        </>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          { label: t('donDatHang.preview.signNguoiDat'), ten: po.ten_nguoi_dat },
          t('common.phieuIn.ky.keToan'),
          { label: t('common.phieuIn.ky.nguoiDuyet'), ten: po.ten_nguoi_duyet },
          t('donDatHang.preview.signNhaCungCap'),
        ]}
      />
    </KhungPhieu>
  );
};

export default DonDatHangPreviewContent;
