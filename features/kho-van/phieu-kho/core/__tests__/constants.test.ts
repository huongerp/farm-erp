import { describe, it, expect } from 'vitest';
import {
  TRANG_THAI_CHO_DUYET,
  TRANG_THAI_DOI_DUYET,
  TRANG_THAI_DA_DUYET,
  TRANG_THAI_KHONG_DUYET,
  trangThaiToFilterKey,
  filterKeyToTrangThai,
  isTrangThaiChoPheDuyet,
  canMutatePhieuKhoByTrangThai,
} from '../constants';

describe('trangThaiToFilterKey / filterKeyToTrangThai', () => {
  it('map đúng 2 chiều cho cả 4 trạng thái', () => {
    const pairs: [string, string][] = [
      [TRANG_THAI_CHO_DUYET, 'Pending'],
      [TRANG_THAI_DOI_DUYET, 'Waiting'],
      [TRANG_THAI_DA_DUYET, 'Approved'],
      [TRANG_THAI_KHONG_DUYET, 'Rejected'],
    ];
    for (const [trangThai, key] of pairs) {
      expect(trangThaiToFilterKey(trangThai)).toBe(key);
      expect(filterKeyToTrangThai(key as never)).toBe(trangThai);
    }
  });

  it('trạng thái không xác định fallback về Pending', () => {
    expect(trangThaiToFilterKey('giá trị lạ')).toBe('Pending');
  });
});

describe('isTrangThaiChoPheDuyet', () => {
  it('true cho Chờ duyệt và Đợi duyệt', () => {
    expect(isTrangThaiChoPheDuyet(TRANG_THAI_CHO_DUYET)).toBe(true);
    expect(isTrangThaiChoPheDuyet(TRANG_THAI_DOI_DUYET)).toBe(true);
  });

  it('false cho Đã duyệt và Không duyệt', () => {
    expect(isTrangThaiChoPheDuyet(TRANG_THAI_DA_DUYET)).toBe(false);
    expect(isTrangThaiChoPheDuyet(TRANG_THAI_KHONG_DUYET)).toBe(false);
  });
});

describe('canMutatePhieuKhoByTrangThai — cổng quyền sửa/xoá phiếu kho', () => {
  it('không có quyền module → luôn false, bất kể trạng thái', () => {
    expect(canMutatePhieuKhoByTrangThai(TRANG_THAI_CHO_DUYET, false, true)).toBe(false);
    expect(canMutatePhieuKhoByTrangThai(TRANG_THAI_DA_DUYET, false, true)).toBe(false);
  });

  it('phiếu chưa duyệt (Chờ duyệt/Đợi duyệt/Không duyệt) → cho sửa dù không có quyền bypass', () => {
    expect(canMutatePhieuKhoByTrangThai(TRANG_THAI_CHO_DUYET, true, false)).toBe(true);
    expect(canMutatePhieuKhoByTrangThai(TRANG_THAI_DOI_DUYET, true, false)).toBe(true);
    expect(canMutatePhieuKhoByTrangThai(TRANG_THAI_KHONG_DUYET, true, false)).toBe(true);
  });

  it('phiếu đã duyệt: chỉ người có quyền bypass (canApprove/canAdmin) mới sửa được', () => {
    expect(canMutatePhieuKhoByTrangThai(TRANG_THAI_DA_DUYET, true, true)).toBe(true);
    expect(canMutatePhieuKhoByTrangThai(TRANG_THAI_DA_DUYET, true, false)).toBe(false);
  });
});
