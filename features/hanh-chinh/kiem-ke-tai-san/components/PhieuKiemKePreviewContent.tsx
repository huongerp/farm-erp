/**
 * Nội dung in phiếu kiểm kê tài sản — khung chuẩn hệ thống (PhieuInParts): thông tin đợt, tổng hợp
 * số tài sản theo kết quả, bảng chi tiết (STT · mã · tên · nơi lưu · người giữ · kết quả), ô ký ban kiểm kê.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatYmdToDisplay } from '../../../../lib/utils';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
} from '../../../../components/shared/phieu-in/PhieuInParts';
import { getTrangThaiDotLabel, getKetQuaLabel, KET_QUA_OPTIONS } from '../core/constants';
import type { DotKiemKe, ChiTietKiemKe } from '../core/types';

const th = `${TH_IN} p-1.5 text-[9pt]`;
const td = `${TD_IN} p-1.5`;
const ngayIn = (v?: string | null) => formatYmdToDisplay(v?.slice(0, 10));

interface Props {
  dot: DotKiemKe;
  chiTiet: ChiTietKiemKe[];
}

const PhieuKiemKePreviewContent: React.FC<Props> = ({ dot, chiTiet }) => {
  const { t } = useTranslation();
  // "Khớp: 12 · Thiếu: 1 …" — chỉ kể kết quả có tài sản.
  const tongHop = useMemo(
    () =>
      KET_QUA_OPTIONS.map((o) => ({ nhan: o.label, so: chiTiet.filter((c) => c.ket_qua === o.value).length }))
        .filter((x) => x.so > 0)
        .map((x) => `${x.nhan}: ${x.so}`)
        .join(' · '),
    [chiTiet]
  );

  return (
    <KhungPhieu title={t('kiemKeTaiSan.preview.title')} soPhieu={dot.ma_dot}>
      <BangThongTin
        rows={[
          [t('kiemKeTaiSan.store.tenDotCol'), dot.ten_dot],
          [t('kiemKeTaiSan.store.trangThaiCol'), getTrangThaiDotLabel(dot.trang_thai)],
          [t('kiemKeTaiSan.store.ngayBatDauCol'), ngayIn(dot.ngay_bat_dau)],
          [t('kiemKeTaiSan.store.ngayKetThucCol'), ngayIn(dot.ngay_ket_thuc)],
          [t('kiemKeTaiSan.store.nguoiPhuTrachCol'), dot.ten_nguoi_phu_trach || dot.ma_nguoi_phu_trach],
        ]}
      />
      {dot.ghi_chu?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('kiemKeTaiSan.store.ghiChuCol')}: </span>
          {dot.ghi_chu}
        </p>
      )}

      {chiTiet.length > 0 && (
        <>
          <p className="font-bold uppercase mt-3 mb-0.5">{t('kiemKeTaiSan.chiTietSection')}</p>
          <p className="text-[0.9em] text-gray-600 mt-0 mb-1">
            {t('kiemKeTaiSan.preview.tongTaiSan', { so: chiTiet.length })}
            {tongHop && ` — ${tongHop}`}
          </p>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${th} text-center w-10`}>{t('common.phieuIn.stt')}</th>
                <th className={`${th} text-left w-[14%]`}>{t('kiemKeTaiSan.preview.maTaiSan')}</th>
                <th className={`${th} text-left`}>{t('kiemKeTaiSan.store.taiSanCol')}</th>
                <th className={`${th} text-left`}>{t('kiemKeTaiSan.store.noiLuuSoCol')}</th>
                <th className={`${th} text-left`}>{t('kiemKeTaiSan.store.nguoiGiuSoCol')}</th>
                <th className={`${th} text-left w-[14%]`}>{t('kiemKeTaiSan.store.ketQuaCol')}</th>
              </tr>
            </thead>
            <tbody>
              {chiTiet.map((c, idx) => (
                <tr key={c.id}>
                  <td className={`${td} text-center`}>{idx + 1}</td>
                  <td className={`${td} text-[0.9em] break-all`}>{c.ma_tai_san}</td>
                  <td className={td}>{c.ten_tai_san}</td>
                  <td className={td}>{c.ten_noi_luu_so}</td>
                  <td className={td}>{c.ten_nguoi_giu_so}</td>
                  <td className={td}>{getKetQuaLabel(c.ket_qua)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          { label: t('common.phieuIn.ky.truongBanKiemKe'), ten: dot.ten_nguoi_phu_trach },
          t('common.phieuIn.ky.thanhVienKiemKe'),
          t('common.phieuIn.ky.nguoiGiuTaiSan'),
          t('common.phieuIn.ky.nguoiDuyet'),
        ]}
      />
    </KhungPhieu>
  );
};

export default PhieuKiemKePreviewContent;
