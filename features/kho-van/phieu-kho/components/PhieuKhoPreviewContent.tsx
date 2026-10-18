/**
 * Nội dung in phiếu kho (nhập / xuất / chuyển) — khung chuẩn hệ thống (PhieuInParts): đầu phiếu
 * lặp mỗi trang, thông tin phiếu, bảng chi tiết (ẩn cột trống), tổng theo ĐVT / phẩm cấp, ô ký.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { cotCoDuLieu, tongTheoDvt, tongTheoPhamCap } from '../../../../lib/phieu-in/tong-so-luong';
import {
  BangThongTin,
  DongTongTheoDvt,
  HangKyTen,
  KhungPhieu,
  TD_IN,
  TH_IN,
} from '../../../../components/shared/phieu-in/PhieuInParts';
import type { PhieuKho, PhieuKhoChiTiet } from '../core/types';
import { trangThaiToI18nKey } from '../core/constants';
import { LOAI_DB_TO_TAB } from '../core/types';

/** Nơi đi / Nơi đến theo loại phiếu (nhập: NCC→Kho, xuất: Kho→KH, chuyển: Kho→Kho đến). */
function getNoiDiNoiDen(phieu: PhieuKho): { noiDi?: string; noiDen?: string } {
  const kho = phieu.ten_kho ?? phieu.kho_id;
  switch (phieu.loai) {
    case 'nhập':
      return { noiDi: phieu.ten_nha_cung_cap, noiDen: kho };
    case 'xuất':
      return { noiDi: kho, noiDen: phieu.ten_khach_hang };
    case 'chuyển':
      return { noiDi: kho, noiDen: phieu.ten_kho_den };
    default:
      return {};
  }
}

const th = `${TH_IN} p-1.5 text-[9pt]`;
const td = `${TD_IN} p-1.5`;

interface Props {
  phieu: PhieuKho;
}

const PhieuKhoPreviewContent: React.FC<Props> = ({ phieu }) => {
  const { t } = useTranslation();
  const chiTiet: PhieuKhoChiTiet[] = phieu.chi_tiet ?? [];
  const { noiDi, noiDen } = getNoiDiNoiDen(phieu);
  const tab = LOAI_DB_TO_TAB[phieu.loai] ?? 'nhap';
  const title = t(`phieuKho.preview.tieuDe_${tab}`);
  const soPo = phieu.so_po_don_dat_hang?.trim() || (phieu.id_don_dat_hang ? `#${phieu.id_don_dat_hang}` : '');

  const theoDvt = tongTheoDvt(chiTiet);
  const coPhamCap = cotCoDuLieu(chiTiet, (c) => c.pham_cap);
  const coLot = cotCoDuLieu(chiTiet, (c) => c.so_lot);
  const coGhiChu = cotCoDuLieu(chiTiet, (c) => c.ghi_chu);
  const soCotTruocDvt = 3 + (coPhamCap ? 1 : 0);
  const soCotSau = (coLot ? 1 : 0) + (coGhiChu ? 1 : 0);

  const thongTin: [string, React.ReactNode][] = [
    [t('phieuKho.preview.noiDi'), noiDi],
    [t('phieuKho.preview.noiDen'), noiDen],
    [t('phieuKho.store.statusCol'), t(`phieuKho.status.${trangThaiToI18nKey(phieu.trang_thai)}`)],
    ...(phieu.loai === 'nhập' && soPo ? [[t('phieuKho.detail.linkPo'), soPo] as [string, React.ReactNode]] : []),
  ];

  const dongTong = (key: string, nhan: string, dvt: string | null, soLuong: number, chinh: boolean) => (
    <tr key={key} className={chinh ? 'bg-gray-100 font-semibold' : 'bg-gray-50 text-[0.9em]'}>
      <td colSpan={soCotTruocDvt} className={td}>
        {nhan}
      </td>
      <td className={`${td} text-center`}>{dvt ?? ''}</td>
      <td className={`${td} tabular-nums text-right`}>{formatNumberVN(soLuong)}</td>
      {soCotSau > 0 && <td colSpan={soCotSau} className={td} />}
    </tr>
  );

  return (
    <KhungPhieu title={title} soPhieu={phieu.so_phieu} ngay={formatYmdToDisplay(phieu.ngay?.slice(0, 10))} lapDauTrang>
      <BangThongTin rows={thongTin} />
      {phieu.mo_ta?.trim() && (
        <p className="mt-2 mb-0 whitespace-pre-line break-words">
          <span className="font-semibold">{t('phieuKho.form.description')}: </span>
          {phieu.mo_ta}
        </p>
      )}

      <p className="font-bold uppercase mt-3 mb-1">{t('phieuKho.preview.danhSachChiTiet')}</p>
      {chiTiet.length > 0 ? (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} text-center w-10`}>{t('common.phieuIn.stt')}</th>
              <th className={`${th} text-left`}>{t('phieuKho.preview.danhMuc')}</th>
              <th className={`${th} text-left`}>{t('phieuKho.form.itemName')}</th>
              {coPhamCap && <th className={`${th} text-left w-24`}>{t('phieuKho.form.phamCap')}</th>}
              <th className={`${th} text-center w-16`}>{t('common.phieuIn.dvt')}</th>
              <th className={`${th} text-right w-20`}>{t('phieuKho.form.quantity')}</th>
              {coLot && <th className={`${th} text-center w-20`}>{t('phieuKho.preview.soLot')}</th>}
              {coGhiChu && <th className={`${th} text-left`}>{t('phieuKho.form.note')}</th>}
            </tr>
          </thead>
          <tbody>
            {chiTiet.map((c, idx) => (
              <tr key={c.id}>
                <td className={`${td} text-center`}>{idx + 1}</td>
                <td className={`${td} text-[0.9em]`}>{c.ten_danh_muc}</td>
                <td className={td}>{c.ten_hang}</td>
                {coPhamCap && <td className={`${td} text-[0.9em]`}>{c.pham_cap}</td>}
                <td className={`${td} text-center`}>{c.don_vi_tinh}</td>
                <td className={`${td} tabular-nums text-right`}>{formatNumberVN(c.so_luong)}</td>
                {coLot && <td className={`${td} text-center text-[0.9em]`}>{c.so_lot}</td>}
                {coGhiChu && <td className={`${td} text-[0.9em]`}>{c.ghi_chu}</td>}
              </tr>
            ))}
          </tbody>
          <tfoot className="break-inside-avoid">
            <DongTongTheoDvt
              nhan={t('phieuKho.preview.totalQty')}
              theoDvt={theoDvt}
              soCotTruocDvt={soCotTruocDvt}
              soCotSau={soCotSau}
            />
            {tongTheoPhamCap(chiTiet).map((d, i) =>
              dongTong(
                `pc-${i}`,
                t('phieuKho.preview.totalQtyByPhamCap', { phamCap: d.phamCap ?? t('phieuKho.preview.chuaPhanCap') }),
                d.dvt,
                d.soLuong,
                false
              )
            )}
          </tfoot>
        </table>
      ) : (
        <p className="text-gray-500 italic m-0">{t('phieuKho.form.noItems')}</p>
      )}

      <HangKyTen
        className="mt-6"
        labels={[
          { label: t('common.phieuIn.ky.nguoiLap'), ten: phieu.ten_nguoi_tao },
          t(phieu.loai === 'nhập' ? 'phieuKho.preview.signNguoiGiao' : 'phieuKho.preview.signNguoiNhan'),
          t('common.phieuIn.ky.thuKho'),
          {
            label: t('common.phieuIn.ky.nguoiDuyet'),
            ten: phieu.trang_thai === 'Đã duyệt' ? phieu.ten_nguoi_duyet : null,
          },
        ]}
      />
    </KhungPhieu>
  );
};

export default PhieuKhoPreviewContent;
