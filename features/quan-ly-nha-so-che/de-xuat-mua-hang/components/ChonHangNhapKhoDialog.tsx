import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ChonHangTaoPhieuDialog from '../../../../components/shared/ChonHangTaoPhieuDialog';
import { ganThongTinHang, tinhConLai, type DongDaChon } from '../../../../lib/thuc-hien-tung-phan';
import { useDaNhapTheoDeXuat } from '../../phieu-kho-phan-thuoc/hooks/use-phieu-kho-pt';
import type { DeXuatMuaHang } from '../core/types';

interface Props {
  phieu: DeXuatMuaHang;
  onClose: () => void;
  onConfirm: (lines: DongDaChon[]) => void;
}

/** Chọn hàng + SL nhập lần này trước khi mở form phiếu kho nhập từ đề xuất (nhập từng phần). */
const ChonHangNhapKhoDialog: React.FC<Props> = ({ phieu, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const daNhap = useDaNhapTheoDeXuat(phieu.id);
  const rows = useMemo(
    () =>
      ganThongTinHang(tinhConLai(phieu.chi_tiet, daNhap.data ?? []), phieu.chi_tiet, (d) => ({
        ten_hang: d.ten_hang,
        ma_hang: d.ma_hang,
        don_vi_tinh: d.don_vi_tinh,
      })),
    [phieu.chi_tiet, daNhap.data]
  );

  return (
    <ChonHangTaoPhieuDialog
      title={t('deXuatMuaHang.detail.toolbar.createPhieuKho')}
      subtitle={phieu.so_phieu}
      rows={rows}
      nhanDaThucHien={t('common.tungPhan.daNhap')}
      isLoading={daNhap.isPending}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
};

export default ChonHangNhapKhoDialog;
