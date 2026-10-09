import { describe, expect, it } from 'vitest';
import { idDanhMucThanhPham, locThanhPham } from './thanh-pham';

const danhMuc = [
  { id: '16', ma_danh_muc: 'PHUCVU-SX', id_cha: null },
  { id: '21', ma_danh_muc: 'VT-SXHN', id_cha: '16' },
  { id: '149', ma_danh_muc: 'THANH-PHAM', id_cha: null },
  { id: '151', ma_danh_muc: 'THANHPHAM', id_cha: '149' },
  { id: '154', ma_danh_muc: 'TP-SIEUTHICP7KG', id_cha: '151' },
];

describe('idDanhMucThanhPham', () => {
  it('lấy gốc Thành phẩm và mọi cấp con', () => {
    expect([...idDanhMucThanhPham(danhMuc)].sort()).toEqual(['149', '151', '154']);
  });
});

describe('locThanhPham', () => {
  const hh = [
    { id: 'a', danh_muc_id: '151', danh_muc_cha_id: '149' },
    { id: 'b', danh_muc_id: '154', danh_muc_cha_id: '151' },
    { id: 'c', danh_muc_id: '21', danh_muc_cha_id: '16' },
    { id: 'd', danh_muc_id: null, danh_muc_cha_id: null },
  ];

  it('chỉ giữ hàng thuộc nhánh Thành phẩm', () => {
    expect(locThanhPham(hh, danhMuc).map((h) => h.id)).toEqual(['a', 'b']);
  });

  it('chưa có danh mục Thành phẩm → không lọc', () => {
    expect(locThanhPham(hh, danhMuc.slice(0, 2))).toHaveLength(4);
  });
});
