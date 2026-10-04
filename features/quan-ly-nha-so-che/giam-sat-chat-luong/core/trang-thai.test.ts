import { describe, expect, it } from 'vitest';
import { coTheKiemThung, coTheSuaPhieu, coTheXoaPhieu, trangThaiTheoSoThung } from './trang-thai';

describe('trangThaiTheoSoThung', () => {
  it('đủ số thùng mẫu → hoàn thành, thiếu → đang kiểm', () => {
    expect(trangThaiTheoSoThung('dang_kiem', 10, 10)).toBe('hoan_thanh');
    expect(trangThaiTheoSoThung('dang_kiem', 9, 10)).toBe('dang_kiem');
  });

  it('tăng số thùng mẫu sau khi xong → quay lại đang kiểm', () => {
    expect(trangThaiTheoSoThung('hoan_thanh', 10, 12)).toBe('dang_kiem');
  });

  it('phiếu huỷ giữ nguyên', () => {
    expect(trangThaiTheoSoThung('huy', 10, 10)).toBe('huy');
  });
});

describe('quyền thao tác theo trạng thái', () => {
  it('phiếu đã xong chỉ cấp cao kiểm lại / sửa', () => {
    expect(coTheKiemThung('dang_kiem', false)).toBe(true);
    expect(coTheKiemThung('hoan_thanh', false)).toBe(false);
    expect(coTheKiemThung('hoan_thanh', true)).toBe(true);
    expect(coTheKiemThung('huy', true)).toBe(false);
    expect(coTheSuaPhieu('hoan_thanh', false)).toBe(false);
    expect(coTheSuaPhieu('hoan_thanh', true)).toBe(true);
  });

  it('chỉ xoá được phiếu chưa kiểm thùng nào, trừ cấp cao', () => {
    expect(coTheXoaPhieu(0, false)).toBe(true);
    expect(coTheXoaPhieu(3, false)).toBe(false);
    expect(coTheXoaPhieu(3, true)).toBe(true);
  });
});
