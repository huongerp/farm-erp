/**
 * Nội dung in phiếu cấp phát / thu hồi tài sản — khung chuẩn hệ thống (PhieuInParts): người giao /
 * người nhận / người thực hiện, bảng tài sản (ẩn cột ghi chú khi trống), ô ký kèm họ tên.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { cotCoDuLieu } from '../../../../lib/phieu-in/tong-so-luong';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
} from '../../../../components/shared/phieu-in/PhieuInParts';
import type { PhieuCapPhatThuHoi, PhieuCapPhatThuHoiChiTiet } from '../core/types';
import { getLoaiPhieuLabel } from '../core/constants';

const th = `${TH_IN} p-1.5 text-[9pt]`;
const td = `${TD_IN} p-1.5`;

interface Props {
  phieu: PhieuCapPhatThuHoi;
}

const PhieuCPTHPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const chiTiet: PhieuCapPhatThuHoiChiTiet[] = phieu.chi_tiet ?? [];
  const coGhiChu = cotCoDuLieu(chiTiet, (c) => c.ghi_chu);

  return (
    <KhungPhieu
      title={t('capPhatThuHoi.preview.tieuDe', { loai: getLoaiPhieuLabel(phieu.loai_phieu, t) })}
      soPhieu={phieu.ma_phieu}
      ngay={formatYmdToDisplay(phieu.ngay_thuc_hien?.slice(0, 10))}
    >
      <BangThongTin
        rows={[
          [t('capPhatThuHoi.preview.nguoiGiao'), phieu.ten_nguoi_giu_truoc],
          [t('capPhatThuHoi.preview.nguoiNhan'), phieu.ten_nguoi_giu_sau],
          [t('capPhatThuHoi.store.nguoiThucHienCol'), phieu.ten_nguoi_thuc_hien],
        ]}
      />
      {phieu.ghi_chu?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('capPhatThuHoi.store.ghiChuCol')}: </span>
          {phieu.ghi_chu}
        </p>
      )}

      <p className="font-bold uppercase mt-3 mb-1">{t('capPhatThuHoi.detail.sectionAssets')}</p>
      {chiTiet.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} text-center w-10`}>{t('common.phieuIn.stt')}</th>
              <th className={`${th} text-left w-[15%]`}>{t('capPhatThuHoi.store.maTaiSanCol')}</th>
              <th className={`${th} text-left`}>{t('capPhatThuHoi.store.taiSanCol')}</th>
              <th className={`${th} text-left`}>{t('capPhatThuHoi.store.noiLuuTruocCol')}</th>
              <th className={`${th} text-left`}>{t('capPhatThuHoi.store.noiLuuSauCol')}</th>
              {coGhiChu && <th className={`${th} text-left`}>{t('capPhatThuHoi.store.ghiChuCol')}</th>}
            </tr>
          </thead>
          <tbody>
            {chiTiet.map((ct, idx) => (
              <tr key={ct.id}>
                <td className={`${td} text-center`}>{idx + 1}</td>
                <td className={`${td} text-[0.9em] break-all`}>{ct.ma_tai_san}</td>
                <td className={td}>{ct.ten_tai_san}</td>
                <td className={td}>{ct.ten_noi_luu_truoc}</td>
                <td className={td}>{ct.ten_noi_luu_sau}</td>
                {coGhiChu && <td className={`${td} text-[0.9em]`}>{ct.ghi_chu}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={coGhiChu ? 6 : 5} className={td}>
                {t('capPhatThuHoi.preview.totalAssets')}: {chiTiet.length}
              </td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <p className="text-gray-500 italic m-0">{t('capPhatThuHoi.empty')}</p>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          { label: t('capPhatThuHoi.preview.signNguoiGiao'), ten: phieu.ten_nguoi_giu_truoc },
          { label: t('capPhatThuHoi.preview.signNguoiNhan'), ten: phieu.ten_nguoi_giu_sau },
          { label: t('capPhatThuHoi.preview.signNguoiThucHien'), ten: phieu.ten_nguoi_thuc_hien },
        ]}
      />
    </KhungPhieu>
  );
};

export default PhieuCPTHPreviewContent;
