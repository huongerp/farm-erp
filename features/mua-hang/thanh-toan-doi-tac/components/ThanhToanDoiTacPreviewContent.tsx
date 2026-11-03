/**
 * Nội dung in phiếu thanh toán đối tác — khung chuẩn hệ thống (PhieuInParts): thông tin phiếu,
 * nội dung chi tiết, số tiền nổi bật kèm bằng chữ, thông tin chuyển khoản của đối tác,
 * ô ký (người đề nghị · quản lý Farm · kế toán trưởng · giám đốc).
 * Trạng thái in chữ đen — màu trạng thái người dùng tự đặt có thể không đọc được trên giấy.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { soTienBangChu } from '../../../../lib/so-tien-bang-chu';
import { BangThongTin, HangKyTen, KhungPhieu, TD_IN } from '../../../../components/shared/phieu-in/PhieuInParts';
import type { ThanhToanDoiTac } from '../core/types';
import { thongTinNganHangDoiTac } from '../utils/thong-tin-ngan-hang';

const ngayIn = (v?: string | null) => formatYmdToDisplay(v?.slice(0, 10));

interface Props {
  data: ThanhToanDoiTac;
}

const ThanhToanDoiTacPreviewContent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const coTien = data.so_tien != null;

  const thongTin = (
    [
      [t('thanhToanDoiTac.form.doiTac'), data.ten_doi_tac],
      [t('thanhToanDoiTac.store.nhomDoiTacCol'), data.ten_nhom],
      [t('thanhToanDoiTac.form.donVi'), data.ten_don_vi],
      [t('thanhToanDoiTac.form.trangThai'), data.ten_trang_thai],
      [t('thanhToanDoiTac.form.ngayXuLy'), ngayIn(data.ngay_xu_ly)],
      [t('thanhToanDoiTac.form.nguoiTao'), data.ten_nguoi_tao],
    ] as [string, React.ReactNode][]
  ).filter(([, v]) => v);

  const thongTinNganHang = thongTinNganHangDoiTac(data);
  const [nam, thang, ngay] = (data.ngay ?? '').slice(0, 10).split('-');
  const dongNgay = nam && thang && ngay ? t('thanhToanDoiTac.preview.ngayThangNam', { ngay, thang, nam }) : undefined;

  return (
    <KhungPhieu title={t('thanhToanDoiTac.preview.title')} soPhieu={data.so_phieu} ngay={ngayIn(data.ngay)}>
      <p className="mt-0 mb-2">
        <span className="font-semibold">{t('thanhToanDoiTac.form.hangMuc')}: </span>
        {data.hang_muc_thanh_toan}
      </p>
      {data.noi_dung_chi_tiet?.trim() && (
        <p className="mt-0 mb-2 whitespace-pre-line break-words">
          <span className="font-semibold">{t('thanhToanDoiTac.preview.noiDungChiTiet')}: </span>
          {data.noi_dung_chi_tiet}
        </p>
      )}
      {thongTin.length > 0 && <BangThongTin rows={thongTin} />}
      {coTien && (
        <table className="w-full border-collapse mt-3 break-inside-avoid">
          <tbody>
            <tr>
              <td className={`${TD_IN} bg-gray-50 px-2 py-1.5 font-semibold w-[18%]`}>{t('thanhToanDoiTac.preview.soTien')}</td>
              <td className={`${TD_IN} px-2 py-1.5 font-bold text-[1.15em] tabular-nums`}>
                {formatNumberVN(data.so_tien, { maxFractionDigits: 0 })} {t('thanhToanDoiTac.preview.dong')}
              </td>
            </tr>
            <tr>
              <td className={`${TD_IN} bg-gray-50 px-2 py-1.5 font-semibold`}>{t('common.phieuIn.bangChu')}</td>
              <td className={`${TD_IN} px-2 py-1.5 italic`}>{soTienBangChu(data.so_tien ?? 0)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {thongTinNganHang && (
        <p className="mt-2 mb-0 break-words">
          <span className="font-semibold">{t('thanhToanDoiTac.preview.taiKhoanNhan')}: </span>
          {thongTinNganHang}
        </p>
      )}

      {data.ghi_chu?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('thanhToanDoiTac.form.ghiChu')}: </span>
          {data.ghi_chu}
        </p>
      )}

      <HangKyTen
        className="mt-6"
        dongNgay={dongNgay}
        labels={[
          { label: t('thanhToanDoiTac.preview.ky.nguoiDeNghi'), ten: data.ten_nguoi_tao },
          t('thanhToanDoiTac.preview.ky.quanLyFarm'),
          t('common.phieuIn.ky.keToanTruong'),
          t('common.phieuIn.ky.giamDoc'),
        ]}
      />
    </KhungPhieu>
  );
};

export default ThanhToanDoiTacPreviewContent;
