import { describe, it, expect } from 'vitest';
import {
  kiemTraKhoang,
  tinhSoNgay,
  soNgayTrongThang,
  giaoNhau,
  khoangTuCa,
  caTuKhoang,
  chinhDenNgay,
  khoangTuForm,
  soNgayCuaPhieu,
  type KhoangPhieu,
} from './khoang-nghi';

const k = (
  tu_ngay: string,
  tu_buoi: KhoangPhieu['tu_buoi'],
  den_ngay: string,
  den_buoi: KhoangPhieu['den_buoi']
): KhoangPhieu => ({ tu_ngay, tu_buoi, den_ngay, den_buoi });

// 2026-10-01 là Thứ 5, 2026-10-03 Thứ 7, 2026-10-04 Chủ nhật.
describe('tinhSoNgay', () => {
  it('trọn một ngày = 1', () => {
    expect(tinhSoNgay(k('2026-10-01', 'morning', '2026-10-01', 'afternoon'))).toBe(1);
  });

  it('nửa ngày sáng hoặc chiều = 0,5', () => {
    expect(tinhSoNgay(k('2026-10-01', 'morning', '2026-10-01', 'morning'))).toBe(0.5);
    expect(tinhSoNgay(k('2026-10-01', 'afternoon', '2026-10-01', 'afternoon'))).toBe(0.5);
  });

  it('chiều hôm nay → sáng hôm sau = 1', () => {
    expect(tinhSoNgay(k('2026-10-01', 'afternoon', '2026-10-02', 'morning'))).toBe(1);
  });

  it('chiều 01 → sáng 03 = 0,5 + 1 + 0,5', () => {
    expect(tinhSoNgay(k('2026-10-01', 'afternoon', '2026-10-03', 'morning'))).toBe(2);
  });

  it('tính cả Chủ nhật (farm làm cả tuần)', () => {
    expect(tinhSoNgay(k('2026-10-03', 'morning', '2026-10-05', 'afternoon'))).toBe(3);
    expect(tinhSoNgay(k('2026-10-04', 'morning', '2026-10-04', 'afternoon'))).toBe(1);
  });

  it('khoảng ngược chiều = 0', () => {
    expect(tinhSoNgay(k('2026-10-02', 'morning', '2026-10-01', 'afternoon'))).toBe(0);
  });
});

describe('kiemTraKhoang', () => {
  it('hợp lệ', () => {
    expect(kiemTraKhoang(k('2026-10-01', 'afternoon', '2026-10-02', 'morning'))).toBeNull();
  });

  it('cùng ngày mà chiều → sáng là ngược chiều', () => {
    expect(kiemTraKhoang(k('2026-10-01', 'afternoon', '2026-10-01', 'morning'))).toBe('den_truoc_tu');
  });

  it('đến ngày trước từ ngày', () => {
    expect(kiemTraKhoang(k('2026-10-05', 'morning', '2026-10-01', 'afternoon'))).toBe('den_truoc_tu');
  });

  it('nghỉ riêng ngày Chủ nhật là hợp lệ', () => {
    expect(kiemTraKhoang(k('2026-10-04', 'morning', '2026-10-04', 'afternoon'))).toBeNull();
  });

  it('ngày sai định dạng hoặc không tồn tại', () => {
    expect(kiemTraKhoang(k('', 'morning', '2026-10-01', 'afternoon'))).toBe('ngay_khong_hop_le');
    expect(kiemTraKhoang(k('2026-02-30', 'morning', '2026-03-01', 'afternoon'))).toBe('ngay_khong_hop_le');
  });
});

describe('soNgayTrongThang', () => {
  it('phiếu vắt qua tháng chia đúng phần mỗi tháng', () => {
    // 29/09 (T3) chiều → 02/10 (T6) sáng
    const p = k('2026-09-29', 'afternoon', '2026-10-02', 'morning');
    expect(soNgayTrongThang(p, '2026-09')).toBe(1.5);
    expect(soNgayTrongThang(p, '2026-10')).toBe(1.5);
    expect(soNgayTrongThang(p, '2026-11')).toBe(0);
  });
});

describe('giaoNhau', () => {
  const nghiChieu01 = k('2026-10-01', 'afternoon', '2026-10-01', 'afternoon');

  it('sáng và chiều cùng ngày không trùng', () => {
    expect(giaoNhau(nghiChieu01, k('2026-10-01', 'morning', '2026-10-01', 'morning'))).toBe(false);
  });

  it('cả ngày trùng với nửa ngày', () => {
    expect(giaoNhau(nghiChieu01, k('2026-10-01', 'morning', '2026-10-01', 'afternoon'))).toBe(true);
  });

  it('chạm biên nửa ngày: kết thúc sáng 02 và bắt đầu chiều 02 không trùng', () => {
    expect(
      giaoNhau(k('2026-10-01', 'morning', '2026-10-02', 'morning'), k('2026-10-02', 'afternoon', '2026-10-03', 'afternoon'))
    ).toBe(false);
  });

  it('khoảng dài bao trọn khoảng ngắn', () => {
    expect(giaoNhau(k('2026-10-01', 'morning', '2026-10-10', 'afternoon'), k('2026-10-05', 'morning', '2026-10-05', 'morning'))).toBe(true);
  });
});

describe('khoangTuCa / caTuKhoang', () => {
  it('đổi qua lại cho phiếu 1 ngày', () => {
    for (const ca of ['morning', 'afternoon', 'full'] as const) {
      expect(caTuKhoang(khoangTuCa('2026-10-01', ca))).toBe(ca);
    }
  });

  it('khoảng nhiều ngày không có ca', () => {
    expect(caTuKhoang(k('2026-10-01', 'morning', '2026-10-02', 'afternoon'))).toBeNull();
  });
});

describe('chinhDenNgay', () => {
  it('đẩy đến ngày theo khi từ ngày vượt qua', () => {
    expect(chinhDenNgay('2026-10-05', '2026-10-01')).toBe('2026-10-05');
    expect(chinhDenNgay('2026-10-01', '2026-10-05')).toBe('2026-10-05');
    expect(chinhDenNgay('2026-10-01', '')).toBe('2026-10-01');
  });
});

describe('khoangTuForm / soNgayCuaPhieu', () => {
  const base = { ngay: '2026-10-03', den_ngay: '2026-10-05', tu_buoi: 'morning', den_buoi: 'afternoon', ca: 'morning' } as const;

  it('loại 1 ngày bỏ qua các trường khoảng, suy từ ca', () => {
    expect(khoangTuForm({ ...base, loai_phieu: 'overtime' })).toEqual(k('2026-10-03', 'morning', '2026-10-03', 'morning'));
  });

  it('loại nghỉ lấy khoảng, tính cả Chủ nhật; tăng ca Chủ nhật vẫn tính', () => {
    expect(soNgayCuaPhieu({ ...base, loai_phieu: 'leave_paid' })).toBe(3);
    expect(
      soNgayCuaPhieu({ loai_phieu: 'overtime', ngay: '2026-10-04', den_ngay: '2026-10-04', tu_buoi: 'morning', den_buoi: 'morning' })
    ).toBe(0.5);
  });
});
