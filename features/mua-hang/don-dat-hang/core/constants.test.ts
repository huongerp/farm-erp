import { describe, it, expect } from 'vitest';
import {
  TRANG_THAI_NHAP,
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DA_GUI,
  TRANG_THAI_DA_XAC_NHAN,
  TRANG_THAI_DANG_GIAO,
  TRANG_THAI_DA_NHAN_DU,
  TRANG_THAI_DA_DONG,
  TRANG_THAI_HUY,
} from './types';
import { canBulkApproveDonDatHang, TRANG_THAI_DICH_DUYET_DON } from './constants';

describe('canBulkApproveDonDatHang — cổng lọc đơn cho duyệt/hủy hàng loạt', () => {
  it('không có quyền duyệt → false với mọi trạng thái', () => {
    expect(canBulkApproveDonDatHang(TRANG_THAI_CHO_DUYET, false)).toBe(false);
    expect(canBulkApproveDonDatHang(TRANG_THAI_DA_GUI, false)).toBe(false);
  });

  it('chỉ đơn Chờ duyệt mới vào được lô', () => {
    expect(canBulkApproveDonDatHang(TRANG_THAI_CHO_DUYET, true)).toBe(true);
  });

  it('đơn đã đi tiếp trong luồng bị loại khỏi lô', () => {
    const khac = [
      TRANG_THAI_NHAP,
      TRANG_THAI_DA_GUI,
      TRANG_THAI_DA_XAC_NHAN,
      TRANG_THAI_DANG_GIAO,
      TRANG_THAI_DA_NHAN_DU,
      TRANG_THAI_DA_DONG,
      TRANG_THAI_HUY,
    ];
    for (const tt of khac) {
      expect(canBulkApproveDonDatHang(tt, true)).toBe(false);
    }
  });

  it('trạng thái lạ trong DB không lọt vào lô', () => {
    expect(canBulkApproveDonDatHang('giá trị lạ', true)).toBe(false);
  });
});

describe('TRANG_THAI_DICH_DUYET_DON', () => {
  it('đúng cặp trạng thái đích của thao tác duyệt đơn', () => {
    expect(TRANG_THAI_DICH_DUYET_DON).toEqual([TRANG_THAI_DA_XAC_NHAN, TRANG_THAI_HUY]);
  });
});
