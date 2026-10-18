/**
 * Nội dung in phiếu giao việc — khung chuẩn hệ thống (PhieuInParts): thông tin công việc, mô tả /
 * kết quả, danh sách việc con, ô ký người giao · người nhận.
 * Dùng cho trang preview /hanh-chinh/cong-viec/preview/:id và lệnh in.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTimeShort, formatYmdToDisplay } from '../../../../lib/utils';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
} from '../../../../components/shared/phieu-in/PhieuInParts';
import { getTrangThaiLabel, getUuTienLabel } from '../core/constants';
import type { CongViec } from '../core/types';

interface Props {
  record: CongViec;
  /** Danh sách công việc con (khi có id_cha trỏ tới record). */
  congViecCon?: CongViec[];
  /** Tra tên nhân viên theo id. */
  getEmployeeName: (id: number | string | null | undefined) => string;
}

const KhoiChu: React.FC<{ nhan: string; noiDung?: string | null }> = ({ nhan, noiDung }) =>
  noiDung?.trim() ? (
    <div className="mt-2 break-inside-avoid">
      <p className="font-semibold m-0">{nhan}:</p>
      <p className="m-0 whitespace-pre-line break-words">{noiDung}</p>
    </div>
  ) : null;

const CongViecPreviewContent: React.FC<Props> = ({ record, congViecCon = [], getEmployeeName }) => {
  const { t } = useTranslation();
  const hoTro = (record.nguoi_ho_tro ?? []).map((id) => getEmployeeName(id)).join(', ');

  return (
    <KhungPhieu title={t('congViec.preview.title')} ngay={formatDateTimeShort(record.tg_tao)}>
      <p className="text-center font-bold text-[1.1em] mt-0 mb-2">{record.tieu_de}</p>
      <BangThongTin
        rows={[
          [t('congViec.form.nguoiGiao'), getEmployeeName(record.id_nguoi_giao)],
          [t('congViec.form.trachNhiem'), getEmployeeName(record.trach_nhiem)],
          [t('congViec.form.uuTien'), getUuTienLabel(record.uu_tien, t)],
          [t('congViec.form.trangThai'), getTrangThaiLabel(record.trang_thai, t)],
          ...(record.ngay_het_han
            ? [[t('congViec.preview.hanHoanThanh'), formatYmdToDisplay(record.ngay_het_han.slice(0, 10))] as [string, string]]
            : []),
          ...(hoTro ? [[t('congViec.form.nguoiHoTro'), hoTro] as [string, string]] : []),
        ]}
      />
      <KhoiChu nhan={t('congViec.form.moTa')} noiDung={record.mo_ta} />
      <KhoiChu nhan={t('congViec.detail.ketQua')} noiDung={record.ket_qua} />
      <KhoiChu nhan={t('congViec.detail.linkKetQua')} noiDung={record.link_ket_qua} />

      {congViecCon.length > 0 && (
        <>
          <p className="font-bold uppercase mt-3 mb-1">{t('congViec.detail.conList')}</p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${TH_IN} p-1.5 text-center w-10`}>{t('common.phieuIn.stt')}</th>
                <th className={`${TH_IN} p-1.5 text-left`}>{t('congViec.store.tieuDeCol')}</th>
                <th className={`${TH_IN} p-1.5 text-left w-[26%]`}>{t('congViec.store.trangThaiCol')}</th>
              </tr>
            </thead>
            <tbody>
              {congViecCon.map((c, i) => (
                <tr key={c.id}>
                  <td className={`${TD_IN} p-1.5 text-center tabular-nums`}>{i + 1}</td>
                  <td className={`${TD_IN} p-1.5`}>{c.tieu_de}</td>
                  <td className={`${TD_IN} p-1.5`}>{getTrangThaiLabel(c.trang_thai, t)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          { label: t('common.phieuIn.ky.nguoiGiao'), ten: getEmployeeName(record.id_nguoi_giao) },
          { label: t('common.phieuIn.ky.nguoiNhan'), ten: getEmployeeName(record.trach_nhiem) },
        ]}
      />
    </KhungPhieu>
  );
};

export default CongViecPreviewContent;
