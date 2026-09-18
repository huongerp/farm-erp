import { describe, it, expect } from 'vitest';
import {
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_KHONG_DUYET,
  canBulkApproveDeXuatMuaHang,
} from './constants';

describe('canBulkApproveDeXuatMuaHang — cổng lọc phiếu cho duyệt hàng loạt', () => {
  it('không có quyền duyệt → false với mọi trạng thái', () => {
    expect(canBulkApproveDeXuatMuaHang(TRANG_THAI_CHO_DUYET, false)).toBe(false);
    expect(canBulkApproveDeXuatMuaHang(TRANG_THAI_DOI_DUYET, false)).toBe(false);
  });

  it('có quyền duyệt: chỉ phiếu còn trong luồng duyệt mới vào được lô', () => {
    expect(canBulkApproveDeXuatMuaHang(TRANG_THAI_CHO_DUYET, true)).toBe(true);
    expect(canBulkApproveDeXuatMuaHang(TRANG_THAI_DOI_DUYET, true)).toBe(true);
  });

  it('phiếu đã có quyết định bị loại khỏi lô', () => {
    expect(canBulkApproveDeXuatMuaHang(TRANG_THAI_DA_DUYET, true)).toBe(false);
    expect(canBulkApproveDeXuatMuaHang(TRANG_THAI_KHONG_DUYET, true)).toBe(false);
  });

  it('trạng thái lạ trong DB không lọt vào lô', () => {
    expect(canBulkApproveDeXuatMuaHang('giá trị lạ', true)).toBe(false);
  });
});
