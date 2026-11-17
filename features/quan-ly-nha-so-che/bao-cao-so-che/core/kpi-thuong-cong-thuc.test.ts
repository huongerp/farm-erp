import { describe, it, expect } from 'vitest';
import { computeBcscThuongTheoCongThuc, thuongNguong85 } from './kpi-thuong-cong-thuc';

describe('thuongNguong85', () => {
  it('dưới 85% = 0, từ 85% tính theo tỷ lệ, trần 100%', () => {
    expect(thuongNguong85(84.99, 36429)).toBe(0);
    expect(thuongNguong85(85, 36429)).toBe(Math.round(0.85 * 36429));
    expect(thuongNguong85(90, 36429)).toBe(32786);
    expect(thuongNguong85(100, 36429)).toBe(36429);
    expect(thuongNguong85(120, 36429)).toBe(36429);
  });
  it('thiếu số = 0', () => {
    expect(thuongNguong85(null, 36429)).toBe(0);
    expect(thuongNguong85(Number.NaN, 36429)).toBe(0);
  });
});

describe('computeBcscThuongTheoCongThuc', () => {
  it('số liệu phiếu mẫu 16/11: NS 77% → 0; thu hồi 324/284', () => {
    expect(computeBcscThuongTheoCongThuc(0, (2.7 / 3.5) * 100)).toEqual({
      thuong_ql: 0,
      thuong_nhom_tia: 0,
      thuong_nhom_cp: 0,
    });
    expect(computeBcscThuongTheoCongThuc(2, (324 / 284) * 100)).toEqual({
      thuong_ql: 12143,
      thuong_nhom_tia: 21429,
      thuong_nhom_cp: 0,
    });
  });
  it('NS đạt đủ → cả 3 nhóm có thưởng', () => {
    expect(computeBcscThuongTheoCongThuc(0, 100)).toEqual({
      thuong_ql: 36429,
      thuong_nhom_tia: 10714,
      thuong_nhom_cp: 10714,
    });
  });
  it('dòng lỗi: % đạt (mục tiêu ÷ thực tế) dưới 85% → 0, KHÔNG trừ âm', () => {
    // mục tiêu 5%, thực tế 10,28% → 48,64%
    expect(computeBcscThuongTheoCongThuc(1, (5 / 10.28) * 100)).toEqual({
      thuong_ql: 0,
      thuong_nhom_tia: 0,
      thuong_nhom_cp: 0,
    });
  });
  it('dòng lỗi: ≥ 85% tính theo tỷ lệ, trần 100%; QL 12.143đ, CP 21.429đ', () => {
    expect(computeBcscThuongTheoCongThuc(1, 90)).toEqual({
      thuong_ql: Math.round(0.9 * 12143),
      thuong_nhom_tia: 0,
      thuong_nhom_cp: Math.round(0.9 * 21429),
    });
    expect(computeBcscThuongTheoCongThuc(1, 125)).toEqual({
      thuong_ql: 12143,
      thuong_nhom_tia: 0,
      thuong_nhom_cp: 21429,
    });
    expect(computeBcscThuongTheoCongThuc(1, null)).toEqual({
      thuong_ql: 0,
      thuong_nhom_tia: 0,
      thuong_nhom_cp: 0,
    });
  });
  it('dòng ngoài preset không đụng', () => {
    expect(computeBcscThuongTheoCongThuc(3, 100)).toEqual({});
  });
});
