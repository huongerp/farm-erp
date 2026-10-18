/**
 * Nội dung phiếu lương — khung chuẩn hệ thống (PhieuInParts): thông tin nhân viên, chi tiết lương,
 * cộng/trừ khác, tổng lương + bằng chữ, ô ký (người lập · kế toán · người nhận lương).
 * Tiền in số thuần + "Đơn vị tính: đồng" một lần, khoản trừ có dấu "−".
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberVN } from '../../../../lib/utils';
import { soTienBangChu } from '../../../../lib/so-tien-bang-chu';
import { BangThongTin, HangKyTen, KhungPhieu, TD_IN, TH_IN } from '../../../../components/shared/phieu-in/PhieuInParts';
import type { BangLuongRecord } from '../core/types';
import { kyLuongIn } from '../utils/ky-luong-in';

const tien = (v: number) => formatNumberVN(v, { maxFractionDigits: 0 });
const td = `${TD_IN} px-2 py-1`;

const DongTien: React.FC<{ label: React.ReactNode; value: React.ReactNode; dam?: boolean }> = ({ label, value, dam }) => (
  <tr className={dam ? 'font-bold bg-gray-100' : undefined}>
    <td className={td}>{label}</td>
    <td className={`${td} text-right tabular-nums w-[30%]`}>{value}</td>
  </tr>
);

const Muc: React.FC<{ tieuDe: string; children: React.ReactNode }> = ({ tieuDe, children }) => (
  <table className="w-full border-collapse mt-3 break-inside-avoid">
    <thead>
      <tr>
        <th colSpan={2} className={`${TH_IN} px-2 py-1 text-left uppercase text-[0.9em]`}>
          {tieuDe}
        </th>
      </tr>
    </thead>
    <tbody>{children}</tbody>
  </table>
);

interface Props {
  record: BangLuongRecord;
}

const PayslipPreviewContent: React.FC<Props> = ({ record }) => {
  const { t } = useTranslation();
  const ky = kyLuongIn(record.thang, record.nam);
  const empLabel = record.ten_nhan_vien
    ? `${record.ten_nhan_vien}${record.ma_nhan_vien ? ` (${record.ma_nhan_vien})` : ''}`
    : record.ma_nhan_vien;
  const kpi = `${formatNumberVN(record.diem_kpi, { maxFractionDigits: 1 })}${
    record.kpi_dat ? '' : ` (${formatNumberVN(record.ty_le_kpi_khong_dat * 100, { maxFractionDigits: 0 })}%)`
  }`;

  return (
    <KhungPhieu title={t('bangLuong.pdf.title')} subtitle={t('bangLuong.preview.kyLuong', ky)}>
      <BangThongTin
        rows={[
          [t('bangLuong.detail.employee'), empLabel],
          [t('bangLuong.detail.department'), record.ten_phong_ban],
          [t('bangLuong.detail.ngayCong'), `${formatNumberVN(record.ngay_cong)} / ${formatNumberVN(record.ngay_cong_chuan)}`],
          [record.kpi_dat ? t('bangLuong.detail.kpiDat') : t('bangLuong.detail.kpiKhongDat'), kpi],
        ]}
      />

      <p className="text-right italic text-[0.9em] mt-2 mb-0">{t('common.phieuIn.donViTinhDong')}</p>
      <Muc tieuDe={t('bangLuong.pdf.salaryBreakdown')}>
        <DongTien label={t('bangLuong.detail.luongCoBan')} value={tien(record.luong_co_ban_tinh)} />
        <DongTien label={t('bangLuong.detail.luongKpi')} value={tien(record.luong_kpi_tinh)} />
        <DongTien label={t('bangLuong.detail.luongTrachNhiem')} value={tien(record.luong_trach_nhiem_tinh)} />
        <DongTien label={t('bangLuong.detail.phuCap')} value={tien(record.phu_cap_tinh)} />
      </Muc>

      {record.cong_tru_khac && record.cong_tru_khac.length > 0 && (
        <Muc tieuDe={t('bangLuong.detail.congTruKhac')}>
          {record.cong_tru_khac.map((item) => (
            <DongTien
              key={item.id}
              label={`${item.loai === 'cong' ? t('bangLuong.detail.cong') : t('bangLuong.detail.tru')}${item.ly_do ? `: ${item.ly_do}` : ''}`}
              value={`${item.loai === 'cong' ? '' : '−'}${tien(Math.abs(item.so_tien))}`}
            />
          ))}
          <DongTien
            dam
            label={t('bangLuong.store.congTruNetCol')}
            value={`${record.cong_tru_net > 0 ? '+' : record.cong_tru_net < 0 ? '−' : ''}${tien(Math.abs(record.cong_tru_net))}`}
          />
        </Muc>
      )}

      <table className="w-full border-collapse mt-3 break-inside-avoid">
        <tbody>
          <DongTien dam label={t('bangLuong.detail.tongLuong')} value={tien(record.tong_luong)} />
          {record.tong_luong !== 0 && (
            <tr>
              <td colSpan={2} className={td}>
                <span className="font-semibold">{t('common.phieuIn.bangChu')}: </span>
                <span className="italic">{soTienBangChu(record.tong_luong)}</span>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <HangKyTen
        className="mt-6"
        labels={[
          t('common.phieuIn.ky.nguoiLap'),
          t('common.phieuIn.ky.keToan'),
          { label: t('bangLuong.signature.nguoiNhan'), ten: record.ten_nhan_vien },
        ]}
      />
    </KhungPhieu>
  );
};

export default PayslipPreviewContent;
