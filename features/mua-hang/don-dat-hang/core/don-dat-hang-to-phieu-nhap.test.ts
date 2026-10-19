import { describe, expect, it } from 'vitest';
import { donDatHangToPhieuNhapPrefill } from './don-dat-hang-to-phieu-nhap';
import type { DonDatHang } from './types';
import { phieuDeXuatToDonDatHangPrefill } from './don-dat-hang-to-form-values';
import type { PhieuDeXuatVatTu } from '../../../kho-van/phieu-de-xuat-vat-tu/core/types';

const don = {
  id: '5',
  so_po: 'PO-0005',
  ngay_dat: '2026-10-01T08:00:00',
  id_kho_nhan: '2',
  id_nha_cung_cap: '9',
  chi_tiet: [
    { id: '1', id_don_dat_hang: '5', id_hang_hoa: '11', so_luong: 10, don_gia: 2000, ghi_chu: 'gấp' },
    { id: '2', id_don_dat_hang: '5', id_hang_hoa: '12', so_luong: 4, don_gia: 500 },
  ],
} as DonDatHang;

describe('donDatHangToPhieuNhapPrefill', () => {
  it('chỉ lấy hàng được chọn với SL lần này, giữ đơn giá + ghi chú của đơn', () => {
    const p = donDatHangToPhieuNhapPrefill(don, [{ id_hang_hoa: '11', so_luong: 3 }]);
    expect(p.chi_tiet).toEqual([{ id_hang_hoa: '11', so_luong: 3, don_gia: 2000, so_lot: '', ghi_chu: 'gấp' }]);
  });

  it('gắn liên kết đơn, kho nhận, nhà cung cấp và ngày đặt', () => {
    const p = donDatHangToPhieuNhapPrefill(don, []);
    expect(p).toMatchObject({ id_don_dat_hang: '5', kho_id: '2', id_nha_cung_cap: '9', ngay: '2026-10-01', mo_ta: 'Nhập theo đơn PO-0005' });
  });
});

describe('phieuDeXuatToDonDatHangPrefill — đặt từng phần', () => {
  it('chỉ lấy hàng được chọn với SL lần này, mục đích lấy từ ghi chú dòng phiếu', () => {
    const phieu = {
      id: '3',
      ngay_can: '2026-10-20',
      ghi_chu: '',
      chi_tiet: [
        { id: '1', id_phieu_de_xuat_vat_tu: '3', id_hang_hoa: '11', so_luong: 10, ghi_chu: 'sửa máy' },
        { id: '2', id_phieu_de_xuat_vat_tu: '3', id_hang_hoa: '12', so_luong: 4 },
      ],
    } as PhieuDeXuatVatTu;
    expect(phieuDeXuatToDonDatHangPrefill(phieu, [{ id_hang_hoa: '11', so_luong: 6 }]).chi_tiet).toEqual([
      { id_hang_hoa: '11', phan_loai: null, muc_dich_su_dung: 'sửa máy', so_luong: 6, don_gia: undefined, ghi_chu: '' },
    ]);
  });
});
