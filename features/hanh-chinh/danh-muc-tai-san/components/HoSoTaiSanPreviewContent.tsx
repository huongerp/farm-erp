/**
 * Nội dung in hồ sơ tài sản — khung chuẩn hệ thống (PhieuInParts): ảnh, thông tin tài sản, ô ký
 * xác nhận người đang giữ / người lập.
 * Dùng cho trang preview /ho-so-tai-san/:id và in.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { BangThongTin, HangKyTen, KhungPhieu } from '../../../../components/shared/phieu-in/PhieuInParts';
import type { TaiSan } from '../core/types';

interface Props {
  record: TaiSan;
}

const HoSoTaiSanPreviewContent: React.FC<Props> = ({ record }) => {
  const { t } = useTranslation();
  const nguoiGiu = record.ten_nhan_vien_dang_giu
    ? `${record.ten_nhan_vien_dang_giu}${record.ma_nhan_vien_dang_giu ? ` (${record.ma_nhan_vien_dang_giu})` : ''}`
    : '';

  return (
    <KhungPhieu title={t('danhSachTaiSan.preview.title')} soPhieu={record.ma_tai_san}>
      <p className="text-center font-bold text-[1.1em] mt-0 mb-2">{record.ten_tai_san}</p>
      {record.hinh_anh && (
        <div className="flex justify-center mb-3">
          <img
            src={record.hinh_anh}
            alt={record.ten_tai_san}
            className="max-w-[35mm] max-h-[35mm] object-contain border border-gray-200 rounded"
          />
        </div>
      )}

      <BangThongTin
        rows={[
          [t('danhSachTaiSan.store.nhomCol'), record.ten_nhom],
          [t('danhSachTaiSan.store.trangThaiCol'), record.ten_trang_thai],
          [t('danhSachTaiSan.store.noiLuuCol'), record.ten_noi_luu],
          [t('danhSachTaiSan.store.nguoiGiuCol'), nguoiGiu],
          [t('danhSachTaiSan.store.ngayNhapCol'), formatYmdToDisplay(record.ngay_nhap?.slice(0, 10))],
          [
            t('danhSachTaiSan.store.nguyenGiaCol'),
            record.nguyen_gia != null ? `${formatNumberVN(record.nguyen_gia, { maxFractionDigits: 0 })} đ` : '',
          ],
        ]}
      />
      {record.ghi_chu?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('danhSachTaiSan.form.ghiChu')}: </span>
          {record.ghi_chu}
        </p>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          t('common.phieuIn.ky.nguoiLap'),
          { label: t('common.phieuIn.ky.nguoiGiuTaiSan'), ten: record.ten_nhan_vien_dang_giu },
        ]}
      />
    </KhungPhieu>
  );
};

export default HoSoTaiSanPreviewContent;
