/**
 * Nội dung in phiếu thanh toán đối tác — khung chuẩn hệ thống (PhieuInParts): thông tin phiếu,
 * số tiền nổi bật kèm bằng chữ, ô ký (người lập · kế toán · người nhận tiền · giám đốc).
 * Trạng thái in chữ đen — màu trạng thái người dùng tự đặt có thể không đọc được trên giấy.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { soTienBangChu } from '../../../../lib/so-tien-bang-chu';
import { BangThongTin, HangKyTen, KhungPhieu, TD_IN } from '../../../../components/shared/phieu-in/PhieuInParts';
import type { ThanhToanDoiTac } from '../core/types';

const ngayIn = (v?: string | null) => formatYmdToDisplay(v?.slice(0, 10));

interface Props {
  data: ThanhToanDoiTac;
}

const ThanhToanDoiTacPreviewContent: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const coTien = data.so_tien != null;

  const thongTin: [string, React.ReactNode][] = [
    [t('thanhToanDoiTac.form.doiTac'), data.ten_doi_tac],
    [t('thanhToanDoiTac.store.nhomDoiTacCol'), data.ten_nhom],
    [t('thanhToanDoiTac.form.donVi'), data.ten_don_vi],
    [t('thanhToanDoiTac.form.trangThai'), data.ten_trang_thai],
    [t('thanhToanDoiTac.form.ngayXuLy'), ngayIn(data.ngay_xu_ly)],
    [t('thanhToanDoiTac.form.nguoiTao'), data.ten_nguoi_tao],
  ];

  return (
    <KhungPhieu title={t('thanhToanDoiTac.preview.title')} soPhieu={data.so_phieu} ngay={ngayIn(data.ngay)}>
      <p className="mt-0 mb-2">
        <span className="font-semibold">{t('thanhToanDoiTac.form.hangMuc')}: </span>
        {data.hang_muc_thanh_toan}
      </p>
      <BangThongTin rows={thongTin} />

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

      {data.ghi_chu?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('thanhToanDoiTac.form.ghiChu')}: </span>
          {data.ghi_chu}
        </p>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          { label: t('common.phieuIn.ky.nguoiLap'), ten: data.ten_nguoi_tao },
          t('common.phieuIn.ky.keToan'),
          t('common.phieuIn.ky.nguoiNhanTien'),
          t('common.phieuIn.ky.giamDoc'),
        ]}
      />
    </KhungPhieu>
  );
};

export default ThanhToanDoiTacPreviewContent;
