/**
 * Nội dung in phiếu đề xuất mua hàng (Nhà sơ chế / Phân thuốc) — khung chuẩn hệ thống (PhieuInParts): đầu phiếu, thông tin phiếu,
 * bảng vật tư (ẩn cột trống) + tổng theo ĐVT, ô ký kèm tên người đề xuất / người duyệt.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { cotCoDuLieu, tongTheoDvt } from '../../../../lib/phieu-in/tong-so-luong';
import {
  BangThongTin,
  DongTongTheoDvt,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
} from '../../../../components/shared/phieu-in/PhieuInParts';
import type { DeXuatMuaHang } from '../core/types';
import { trangThaiToI18nKey } from '../core/constants';

const th = `${TH_IN} p-1.5 text-[9pt]`;
const td = `${TD_IN} p-1.5`;
const ngayIn = (v?: string | null) => formatYmdToDisplay(v?.slice(0, 10));

interface Props {
  phieu: DeXuatMuaHang;
}

const DeXuatMuaHangPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const chiTiet = phieu.chi_tiet ?? [];
  const coThongSo = cotCoDuLieu(chiTiet, (c) => c.thong_so);
  const coGhiChu = cotCoDuLieu(chiTiet, (c) => c.ghi_chu);
  const theoDvt = tongTheoDvt(chiTiet);
  const soCotTruocDvt = 2 + (coThongSo ? 1 : 0);

  const thongTin: [string, React.ReactNode][] = [
    [t('deXuatMuaHang.preview.donVi'), phieu.ten_noi_de_xuat],
    [t('deXuatMuaHang.preview.nguoiTao'), phieu.ten_nguoi_de_xuat],
    [t('deXuatMuaHang.form.requiredDate'), ngayIn(phieu.ngay_can)],
    [t('deXuatMuaHang.preview.trangThai'), t(`deXuatMuaHang.status.${trangThaiToI18nKey(phieu.trang_thai)}`)],
  ];

  return (
    <KhungPhieu title={t('deXuatMuaHang.preview.title')} soPhieu={phieu.so_phieu} ngay={ngayIn(phieu.ngay)}>
      <BangThongTin rows={thongTin} />
      {phieu.ghi_chu?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('deXuatMuaHang.form.notes')}: </span>
          {phieu.ghi_chu}
        </p>
      )}

      <p className="font-bold uppercase mt-3 mb-1">{t('deXuatMuaHang.preview.danhSachChiTiet')}</p>
      {chiTiet.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} text-center w-10`}>{t('common.phieuIn.stt')}</th>
              <th className={`${th} text-left`}>{t('deXuatMuaHang.form.itemName')}</th>
              {coThongSo && <th className={`${th} text-left`}>{t('deXuatMuaHang.form.specs')}</th>}
              <th className={`${th} text-center w-16`}>{t('common.phieuIn.dvt')}</th>
              <th className={`${th} text-right w-20`}>{t('deXuatMuaHang.form.quantity')}</th>
              {coGhiChu && <th className={`${th} text-left`}>{t('deXuatMuaHang.form.note')}</th>}
            </tr>
          </thead>
          <tbody>
            {chiTiet.map((c, idx) => (
              <tr key={c.id}>
                <td className={`${td} text-center`}>{idx + 1}</td>
                <td className={td}>{c.ten_hang}</td>
                {coThongSo && <td className={`${td} text-[0.9em]`}>{c.thong_so}</td>}
                <td className={`${td} text-center`}>{c.don_vi_tinh}</td>
                <td className={`${td} tabular-nums text-right`}>{formatNumberVN(c.so_luong)}</td>
                {coGhiChu && <td className={`${td} text-[0.9em]`}>{c.ghi_chu}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot className="break-inside-avoid">
            <DongTongTheoDvt
              nhan={t('common.phieuIn.tongCong')}
              theoDvt={theoDvt}
              soCotTruocDvt={soCotTruocDvt}
              soCotSau={coGhiChu ? 1 : 0}
            />
          </tfoot>
        </table>
      ) : (
        <p className="text-gray-500 italic m-0">{t('deXuatMuaHang.form.noItems')}</p>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          { label: t('common.phieuIn.ky.nguoiDeXuat'), ten: phieu.ten_nguoi_de_xuat },
          t('deXuatMuaHang.preview.signChecker'),
          {
            label: t('common.phieuIn.ky.nguoiDuyet'),
            ten: phieu.trang_thai === 'Đã duyệt' ? phieu.ten_nguoi_duyet : null,
          },
        ]}
      />
    </KhungPhieu>
  );
};

export default DeXuatMuaHangPreviewContent;
