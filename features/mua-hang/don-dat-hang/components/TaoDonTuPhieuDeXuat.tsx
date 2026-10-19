import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChonHangTaoPhieuDialog from '../../../../components/shared/ChonHangTaoPhieuDialog';
import { ganThongTinHang, tinhConLai, type DongDaChon } from '../../../../lib/thuc-hien-tung-phan';
import type { Kho } from '../../../kho-van/danh-sach-kho/core/types';
import type { EmployeeRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import type { PhieuDeXuatVatTu } from '../../../kho-van/phieu-de-xuat-vat-tu/core/types';
import type { PhieuDeXuatSoPhieuOption } from '../../../kho-van/phieu-de-xuat-vat-tu/services/phieu-de-xuat-vat-tu-db.service';
import { phieuDeXuatToDonDatHangPrefill } from '../core/don-dat-hang-to-form-values';
import { useDaDatTheoPhieuDeXuat } from '../hooks/use-don-dat-hang';
import DonDatHangForm from './DonDatHangForm';

interface Props {
  /** Phiếu đề xuất đã tải đủ chi_tiet. */
  phieu: PhieuDeXuatVatTu;
  khoList: Kho[];
  employees: EmployeeRef[];
  onClose: () => void;
}

/**
 * Lập đơn đặt hàng từ phiếu đề xuất vật tư theo từng phần: popup chọn hàng + SL đặt lần này
 * (mặc định phần còn lại), rồi mở form đơn với đúng các dòng đó.
 */
const TaoDonTuPhieuDeXuat: React.FC<Props> = ({ phieu, khoList, employees, onClose }) => {
  const { t } = useTranslation();
  const [dongChon, setDongChon] = useState<DongDaChon[] | null>(null);
  const daDat = useDaDatTheoPhieuDeXuat(phieu.id);

  const rows = useMemo(
    () =>
      ganThongTinHang(tinhConLai(phieu.chi_tiet, daDat.data ?? []), phieu.chi_tiet, (d) => ({
        ten_hang: d.ten_hang,
        ma_hang: d.ma_hang,
        don_vi_tinh: d.don_vi_tinh,
      })),
    [phieu.chi_tiet, daDat.data]
  );
  /** Ổn định tham chiếu để form không reset lại mỗi lần render. */
  const prefill = useMemo(() => (dongChon ? phieuDeXuatToDonDatHangPrefill(phieu, dongChon) : null), [phieu, dongChon]);
  const phieuDeXuatList: PhieuDeXuatSoPhieuOption[] = useMemo(
    () => [{ id: phieu.id, so_phieu: phieu.so_phieu, ngay: phieu.ngay }],
    [phieu.id, phieu.so_phieu, phieu.ngay]
  );

  if (!prefill) {
    return (
      <ChonHangTaoPhieuDialog
        title={t('common.tungPhan.taoDonTitle')}
        subtitle={phieu.so_phieu}
        rows={rows}
        nhanDaThucHien={t('common.tungPhan.daDat')}
        isLoading={daDat.isPending}
        onClose={onClose}
        onConfirm={setDongChon}
      />
    );
  }
  return (
    <DonDatHangForm
      khoList={khoList}
      employees={employees}
      phieuDeXuatList={phieuDeXuatList}
      prefillValues={prefill}
      onClose={onClose}
    />
  );
};

export default TaoDonTuPhieuDeXuat;
