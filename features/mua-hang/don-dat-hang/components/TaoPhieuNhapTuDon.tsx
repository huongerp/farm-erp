import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChonHangTaoPhieuDialog from '../../../../components/shared/ChonHangTaoPhieuDialog';
import PhieuKhoForm from '../../../kho-van/phieu-kho/components/PhieuKhoForm';
import { useDaNhapTheoDonDatHang } from '../../../kho-van/phieu-kho/hooks/use-phieu-kho';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import { ganThongTinHang, tinhConLai, type DongDaChon } from '../../../../lib/thuc-hien-tung-phan';
import { donDatHangToPhieuNhapPrefill } from '../core/don-dat-hang-to-phieu-nhap';
import type { DonDatHang } from '../core/types';
import type { DonDatHangSoPoOption } from '../services/don-dat-hang-db.service';

interface Props {
  /** Đơn đã tải đủ chi_tiet. */
  don: DonDatHang;
  khoList: Kho[];
  onClose: () => void;
}

/**
 * Tạo phiếu nhập kho từ đơn đặt hàng theo từng đợt giao: popup chọn hàng + SL nhập lần này
 * (mặc định phần còn lại), rồi mở form phiếu nhập với đúng các dòng đó.
 */
const TaoPhieuNhapTuDon: React.FC<Props> = ({ don, khoList, onClose }) => {
  const { t } = useTranslation();
  const [dongChon, setDongChon] = useState<DongDaChon[] | null>(null);
  const daNhap = useDaNhapTheoDonDatHang(don.id);

  const rows = useMemo(
    () =>
      ganThongTinHang(tinhConLai(don.chi_tiet, daNhap.data ?? []), don.chi_tiet, (d) => ({
        ten_hang: d.ten_hang,
        ma_hang: d.ma_hang,
        don_vi_tinh: d.don_vi_tinh,
      })),
    [don.chi_tiet, daNhap.data]
  );
  /** Ổn định tham chiếu để form không reset lại mỗi lần render. */
  const prefill = useMemo(() => (dongChon ? donDatHangToPhieuNhapPrefill(don, dongChon) : null), [don, dongChon]);
  const donOpt: DonDatHangSoPoOption[] = useMemo(
    () => [{ id: don.id, so_po: don.so_po, ngay: (don.ngay_dat ?? '').slice(0, 10) }],
    [don.id, don.so_po, don.ngay_dat]
  );

  if (!prefill) {
    return (
      <ChonHangTaoPhieuDialog
        title={t('donDatHang.detail.toolbar.createPhieuNhapKho')}
        subtitle={don.so_po}
        rows={rows}
        nhanDaThucHien={t('common.tungPhan.daNhap')}
        isLoading={daNhap.isPending}
        onClose={onClose}
        onConfirm={setDongChon}
      />
    );
  }
  return (
    <PhieuKhoForm
      key={`phieu-nhap-from-ddh-${don.id}`}
      loai="nhap"
      khoList={khoList}
      prefillValues={prefill}
      donDatHangExtraOptions={donOpt}
      onClose={onClose}
    />
  );
};

export default TaoPhieuNhapTuDon;
