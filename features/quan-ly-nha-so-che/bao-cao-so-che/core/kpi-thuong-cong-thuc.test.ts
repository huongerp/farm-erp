import { describe, it, expect } from 'vitest';
import { computeBcscThuongTheoCongThuc, thuongTheoNguong } from './kpi-thuong-cong-thuc';

describe('thuongTheoNguong', () => {
  it('dưới ngưỡng = 0, từ ngưỡng tính theo tỷ lệ, trần 100%', () => {
    expect(thuongTheoNguong(85, 36429, 90)).toBe(0);
    expect(thuongTheoNguong(89.99, 36429, 90)).toBe(0);
    expect(thuongTheoNguong(90, 36429, 90)).toBe(32786);
    // phiếu mẫu: NS 90,21% vẫn qua ngưỡng
    expect(thuongTheoNguong(90.21, 36429, 90)).toBe(Math.round(0.9021 * 36429));
    expect(thuongTheoNguong(100, 36429, 90)).toBe(36429);
    expect(thuongTheoNguong(120, 36429, 90)).toBe(36429);
    expect(thuongTheoNguong(85, 12143, 85)).toBe(Math.round(0.85 * 12143));
  });
  it('thiếu số = 0', () => {
    expect(thuongTheoNguong(null, 36429, 90)).toBe(0);
    expect(thuongTheoNguong(Number.NaN, 36429, 90)).toBe(0);
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
  it('dòng Năng suất ngưỡng 90%: 89% → 0, 90,21% → có thưởng', () => {
    expect(computeBcscThuongTheoCongThuc(0, 89)).toEqual({ thuong_ql: 0, thuong_nhom_tia: 0, thuong_nhom_cp: 0 });
    expect(computeBcscThuongTheoCongThuc(0, 90.21).thuong_nhom_tia).toBe(Math.round(0.9021 * 10714));
  });
  it('dòng thu hồi giữ ngưỡng 85%', () => {
    expect(computeBcscThuongTheoCongThuc(2, 86).thuong_nhom_tia).toBe(Math.round(0.86 * 21429));
    expect(computeBcscThuongTheoCongThuc(2, 84.9).thuong_nhom_tia).toBe(0);
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
    expect(computeBcscThuongTheoCongThuc(1, 86)).toEqual({
      thuong_ql: Math.round(0.86 * 12143),
      thuong_nhom_tia: 0,
      thuong_nhom_cp: Math.round(0.86 * 21429),
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
