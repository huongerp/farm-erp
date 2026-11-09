import { describe, it, expect } from 'vitest';
import {
  TRANG_THAI_PT_CHO_DUYET,
  TRANG_THAI_PT_DA_DUYET,
  TRANG_THAI_PT_KHONG_DUYET,
  isTrangThaiPTChoPheDuyet,
  isTrangThaiPTDaQuyetDinh,
  canBulkApprovePhieuKhoPT,
  trangThaiPTToI18nKey,
  luaChonDuyetPT,
} from './constants';

describe('isTrangThaiPTChoPheDuyet / isTrangThaiPTDaQuyetDinh', () => {
  it('phân đúng hai nhóm trạng thái', () => {
    expect(isTrangThaiPTChoPheDuyet(TRANG_THAI_PT_CHO_DUYET)).toBe(true);
    expect(isTrangThaiPTChoPheDuyet(TRANG_THAI_PT_DA_DUYET)).toBe(false);
    expect(isTrangThaiPTDaQuyetDinh(TRANG_THAI_PT_DA_DUYET)).toBe(true);
    expect(isTrangThaiPTDaQuyetDinh(TRANG_THAI_PT_KHONG_DUYET)).toBe(true);
    expect(isTrangThaiPTDaQuyetDinh(TRANG_THAI_PT_CHO_DUYET)).toBe(false);
  });
});

describe('canBulkApprovePhieuKhoPT — cổng lọc phiếu cho duyệt hàng loạt', () => {
  it('không có quyền duyệt → false với mọi trạng thái', () => {
    expect(canBulkApprovePhieuKhoPT(TRANG_THAI_PT_CHO_DUYET, false)).toBe(false);
    expect(canBulkApprovePhieuKhoPT(TRANG_THAI_PT_DA_DUYET, false)).toBe(false);
  });

  it('có quyền duyệt: chỉ phiếu chờ duyệt mới vào được lô', () => {
    expect(canBulkApprovePhieuKhoPT(TRANG_THAI_PT_CHO_DUYET, true)).toBe(true);
    expect(canBulkApprovePhieuKhoPT(TRANG_THAI_PT_DA_DUYET, true)).toBe(false);
    expect(canBulkApprovePhieuKhoPT(TRANG_THAI_PT_KHONG_DUYET, true)).toBe(false);
  });

  it('trạng thái lạ trong DB không lọt vào lô', () => {
    expect(canBulkApprovePhieuKhoPT('giá trị lạ', true)).toBe(false);
  });
});

describe('trangThaiPTToI18nKey', () => {
  it('map đúng và fallback về pending', () => {
    expect(trangThaiPTToI18nKey(TRANG_THAI_PT_DA_DUYET)).toBe('approved');
    expect(trangThaiPTToI18nKey(TRANG_THAI_PT_KHONG_DUYET)).toBe('rejected');
    expect(trangThaiPTToI18nKey(TRANG_THAI_PT_CHO_DUYET)).toBe('pending');
    expect(trangThaiPTToI18nKey('giá trị lạ')).toBe('pending');
  });
});

describe('luaChonDuyetPT', () => {
  it('phiếu chờ duyệt: chỉ chọn Đã duyệt / Không duyệt', () => {
    expect(luaChonDuyetPT(TRANG_THAI_PT_CHO_DUYET)).toEqual([TRANG_THAI_PT_DA_DUYET, TRANG_THAI_PT_KHONG_DUYET]);
  });

  it('phiếu đã quyết định: thêm lựa chọn quay lại Chờ duyệt', () => {
    const ketQua = [TRANG_THAI_PT_DA_DUYET, TRANG_THAI_PT_KHONG_DUYET, TRANG_THAI_PT_CHO_DUYET];
    expect(luaChonDuyetPT(TRANG_THAI_PT_DA_DUYET)).toEqual(ketQua);
    expect(luaChonDuyetPT(TRANG_THAI_PT_KHONG_DUYET)).toEqual(ketQua);
  });

  it('trạng thái lạ coi như chờ duyệt', () => {
    expect(luaChonDuyetPT('giá trị lạ')).toEqual([TRANG_THAI_PT_DA_DUYET, TRANG_THAI_PT_KHONG_DUYET]);
  });
});
