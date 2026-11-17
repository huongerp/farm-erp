import { describe, expect, it } from 'vitest';
import { taoBanSaoPhieuKho } from './sao-chep-phieu';
import type { PhieuKho } from './types';

const phieuNhap = {
  id: '3105',
  so_phieu: 'NK-3105',
  ngay: '2026-11-16',
  loai: 'nhập',
  kho_id: '2',
  id_nha_cung_cap: '9',
  id_don_dat_hang: '647',
  trang_thai: 'Đã duyệt',
  id_nguoi_duyet: 5,
  mo_ta: 'Nhập theo đơn PO-2026-00964',
  tg_tao: '',
  tg_cap_nhat: '',
  chi_tiet: [{ id: '1', id_phieu_kho: '3105', id_hang_hoa: '1493', so_luong: 2, don_gia: 35000, so_lot: 'L1' }],
} as PhieuKho;

const opts = { homNay: '2026-11-17', moTaKhiDoiLoai: 'Sao chép từ phiếu NK-3105' };

describe('taoBanSaoPhieuKho', () => {
  it('cùng loại: giữ NCC, đơn PO, mô tả; reset số phiếu, trạng thái, người duyệt, ngày', () => {
    const p = taoBanSaoPhieuKho(phieuNhap, 'nhap', opts);
    expect(p).toMatchObject({
      id: '',
      so_phieu: '',
      loai: 'nhập',
      trang_thai: 'Chờ duyệt',
      ngay: '2026-11-17',
      id_nha_cung_cap: '9',
      id_don_dat_hang: '647',
      mo_ta: 'Nhập theo đơn PO-2026-00964',
    });
    expect(p.id_nguoi_duyet).toBeUndefined();
  });

  it('nhập → xuất: bỏ NCC + đơn PO, giữ kho, hàng, SL, đơn giá, số lô', () => {
    const p = taoBanSaoPhieuKho(phieuNhap, 'xuat', opts);
    expect(p).toMatchObject({ loai: 'xuất', kho_id: '2', id_nha_cung_cap: null, id_don_dat_hang: null, mo_ta: opts.moTaKhiDoiLoai });
    expect(p.chi_tiet?.[0]).toMatchObject({ id_hang_hoa: '1493', so_luong: 2, don_gia: 35000, so_lot: 'L1' });
  });

  it('nhập → chuyển: bỏ NCC, kho đến để trống cho người dùng chọn', () => {
    const p = taoBanSaoPhieuKho(phieuNhap, 'chuyen', opts);
    expect(p).toMatchObject({ loai: 'chuyển', id_nha_cung_cap: null, kho_den_id: null, id_khach_hang: null });
  });
});
