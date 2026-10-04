import { describe, expect, it } from 'vitest';
import {
  coKetLuan,
  coTheKiemThung,
  coTheMoPhieu,
  coTheNop,
  coTheSuaPhieu,
  coTheXoaPhieu,
  trangThaiTheoSoThung,
} from './trang-thai';

describe('trangThaiTheoSoThung', () => {
  it('đủ số thùng mẫu → hoàn thành, thiếu → đang kiểm', () => {
    expect(trangThaiTheoSoThung('dang_kiem', 10, 10)).toBe('hoan_thanh');
    expect(trangThaiTheoSoThung('dang_kiem', 9, 10)).toBe('dang_kiem');
  });

  it('tăng số thùng mẫu khi chưa nộp → quay lại đang kiểm', () => {
    expect(trangThaiTheoSoThung('hoan_thanh', 10, 12)).toBe('dang_kiem');
  });

  it('phiếu huỷ / đã nộp giữ nguyên trạng thái', () => {
    expect(trangThaiTheoSoThung('huy', 10, 10)).toBe('huy');
    expect(trangThaiTheoSoThung('da_nop', 10, 12)).toBe('da_nop');
  });

  it('có kết luận khi hoàn thành hoặc đã nộp', () => {
    expect(coKetLuan('hoan_thanh')).toBe(true);
    expect(coKetLuan('da_nop')).toBe(true);
    expect(coKetLuan('dang_kiem')).toBe(false);
  });
});

describe('nộp / mở phiếu', () => {
  it('chỉ nộp được khi đã kiểm đủ thùng', () => {
    expect(coTheNop('hoan_thanh')).toBe(true);
    expect(coTheNop('dang_kiem')).toBe(false);
    expect(coTheNop('da_nop')).toBe(false);
    expect(coTheNop('huy')).toBe(false);
  });

  it('chỉ cấp cao mở được phiếu đã nộp', () => {
    expect(coTheMoPhieu('da_nop', true)).toBe(true);
    expect(coTheMoPhieu('da_nop', false)).toBe(false);
    expect(coTheMoPhieu('hoan_thanh', true)).toBe(false);
  });
});

describe('quyền thao tác theo trạng thái', () => {
  it('trước khi nộp: ai có quyền sửa cũng chấm lại / sửa được, kể cả đã hoàn thành', () => {
    expect(coTheKiemThung('dang_kiem', false)).toBe(true);
    expect(coTheKiemThung('hoan_thanh', false)).toBe(true);
    expect(coTheSuaPhieu('hoan_thanh', false)).toBe(true);
  });

  it('đã nộp: khoá với người thường, cấp cao vẫn sửa được', () => {
    expect(coTheKiemThung('da_nop', false)).toBe(false);
    expect(coTheKiemThung('da_nop', true)).toBe(true);
    expect(coTheSuaPhieu('da_nop', false)).toBe(false);
    expect(coTheSuaPhieu('da_nop', true)).toBe(true);
  });

  it('phiếu huỷ không chấm thùng; sửa phiếu huỷ chỉ cấp cao', () => {
    expect(coTheKiemThung('huy', true)).toBe(false);
    expect(coTheSuaPhieu('huy', false)).toBe(false);
  });

  it('xoá: đã nộp chỉ cấp cao; chưa nộp thì chưa kiểm thùng nào mới xoá được', () => {
    expect(coTheXoaPhieu('dang_kiem', 0, false)).toBe(true);
    expect(coTheXoaPhieu('dang_kiem', 3, false)).toBe(false);
    expect(coTheXoaPhieu('da_nop', 0, false)).toBe(false);
    expect(coTheXoaPhieu('da_nop', 10, true)).toBe(true);
  });
});
