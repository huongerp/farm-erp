import { describe, it, expect } from 'vitest';
import {
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DA_GUI,
  TRANG_THAI_DA_XAC_NHAN,
  TRANG_THAI_DANG_GIAO,
  TRANG_THAI_DA_NHAN_DU,
  TRANG_THAI_DA_DONG,
  TRANG_THAI_HUY,
} from './types';
import {
  canBulkApproveDonDatHang,
  canHoanTacNhanDu,
  canNhanDuDonDatHang,
  trangThaiSauHoanTacNhanDu,
  TRANG_THAI_DICH_DUYET_DON,
} from './constants';

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

describe('Nhận đủ / Hoàn tác nhận đủ — điều kiện hiện nút', () => {
  it('không có quyền Tạo → không bấm được gì', () => {
    expect(canNhanDuDonDatHang(TRANG_THAI_DANG_GIAO, false)).toBe(false);
    expect(canHoanTacNhanDu(TRANG_THAI_DA_NHAN_DU, false)).toBe(false);
  });

  it('Nhận đủ chỉ cho đơn đã duyệt đang chờ hàng', () => {
    for (const tt of [TRANG_THAI_DA_XAC_NHAN, TRANG_THAI_DA_GUI, TRANG_THAI_DANG_GIAO]) {
      expect(canNhanDuDonDatHang(tt, true)).toBe(true);
    }
    for (const tt of [TRANG_THAI_CHO_DUYET, TRANG_THAI_DA_NHAN_DU, TRANG_THAI_DA_DONG, TRANG_THAI_HUY, 'giá trị lạ']) {
      expect(canNhanDuDonDatHang(tt, true)).toBe(false);
    }
  });

  it('Hoàn tác chỉ cho đơn đang Đã nhận đủ', () => {
    expect(canHoanTacNhanDu(TRANG_THAI_DA_NHAN_DU, true)).toBe(true);
    expect(canHoanTacNhanDu(TRANG_THAI_DANG_GIAO, true)).toBe(false);
    expect(canHoanTacNhanDu(TRANG_THAI_DA_DONG, true)).toBe(false);
  });
});

describe('trangThaiSauHoanTacNhanDu — trả về trạng thái trước đó', () => {
  it('trả đúng trạng thái DB đã nhớ', () => {
    expect(trangThaiSauHoanTacNhanDu(TRANG_THAI_DA_XAC_NHAN)).toBe(TRANG_THAI_DA_XAC_NHAN);
    expect(trangThaiSauHoanTacNhanDu(TRANG_THAI_DA_GUI)).toBe(TRANG_THAI_DA_GUI);
    expect(trangThaiSauHoanTacNhanDu(TRANG_THAI_CHO_DUYET)).toBe(TRANG_THAI_CHO_DUYET);
  });

  it('chưa nhớ (đơn cũ) / giá trị lạ / chính Đã nhận đủ → Đang giao', () => {
    expect(trangThaiSauHoanTacNhanDu(null)).toBe(TRANG_THAI_DANG_GIAO);
    expect(trangThaiSauHoanTacNhanDu(undefined)).toBe(TRANG_THAI_DANG_GIAO);
    expect(trangThaiSauHoanTacNhanDu('Nháp')).toBe(TRANG_THAI_DANG_GIAO);
    expect(trangThaiSauHoanTacNhanDu(TRANG_THAI_DA_NHAN_DU)).toBe(TRANG_THAI_DANG_GIAO);
  });
});
