import { describe, expect, it } from 'vitest';
import { chuanHoaDongTheoLoai, giaTriHang, goiYThucTra, tongHopCoc, truCocVuotConLai } from './tinh-tien-dot';

const DON_GIA = 9_500;

/** HĐ 60.000 cây × 9.500 = 570tr: cọc 170tr → nhận 20.000 cây → nhận 40.000 cây trừ hết cọc. */
const KICH_BAN = [
  { id: '1', loai_dot: 'coc', so_tien: 170_000_000, tien_tru_coc: 0, so_cay: 0 },
  { id: '2', loai_dot: 'thanh_toan', so_tien: 190_000_000, tien_tru_coc: 0, so_cay: 20_000 },
  { id: '3', loai_dot: 'thanh_toan', so_tien: 210_000_000, tien_tru_coc: 170_000_000, so_cay: 40_000 },
] as const;

describe('giaTriHang / goiYThucTra', () => {
  it('kịch bản 3 đợt: giá trị hàng, thực trả sau trừ cọc, tổng thực trả = giá trị HĐ', () => {
    expect(giaTriHang(20_000, DON_GIA)).toBe(190_000_000);
    expect(goiYThucTra(20_000, DON_GIA, 0)).toBe(190_000_000);
    expect(giaTriHang(40_000, DON_GIA)).toBe(380_000_000);
    expect(goiYThucTra(40_000, DON_GIA, 170_000_000)).toBe(210_000_000);

    const tongThucTra = KICH_BAN.reduce((s, d) => s + d.so_tien, 0);
    expect(tongThucTra).toBe(570_000_000);
    expect(tongHopCoc(KICH_BAN)).toEqual({ tienCoc: 170_000_000, cocDaTru: 170_000_000, cocConLai: 0 });
  });

  it('trừ cọc lớn hơn giá trị hàng → thực trả 0, không âm', () => {
    expect(goiYThucTra(10_000, DON_GIA, 170_000_000)).toBe(0);
  });

  it('thiếu số cây hoặc đơn giá → null; trừ cọc null coi như 0', () => {
    expect(giaTriHang(null, DON_GIA)).toBeNull();
    expect(giaTriHang(20_000, null)).toBeNull();
    expect(goiYThucTra(undefined, DON_GIA, 0)).toBeNull();
    expect(goiYThucTra(20_000, DON_GIA, null)).toBe(190_000_000);
  });

  it('số lẻ làm tròn 2 chữ số, không lệch số thực', () => {
    expect(giaTriHang(3, 0.1)).toBe(0.3);
  });
});

describe('tongHopCoc', () => {
  it('trước đợt 3: cọc còn lại đủ 170tr', () => {
    expect(tongHopCoc(KICH_BAN.slice(0, 2)).cocConLai).toBe(170_000_000);
  });

  it('sửa dòng đã trừ cọc: bỏ qua chính dòng đó → cọc còn lại trả về đủ để trừ lại', () => {
    expect(tongHopCoc(KICH_BAN, '3')).toEqual({ tienCoc: 170_000_000, cocDaTru: 0, cocConLai: 170_000_000 });
  });

  it('trừ cọc vượt tổng cọc → cọc còn lại âm; form chặn khi trừ quá cọc còn lại', () => {
    const r = tongHopCoc([
      { id: 'a', loai_dot: 'coc', so_tien: 100 },
      { id: 'b', loai_dot: 'thanh_toan', so_tien: 0, tien_tru_coc: 150 },
    ]);
    expect(r.cocConLai).toBe(-50);
    expect(truCocVuotConLai('thanh_toan', 1, r.cocConLai)).toBe(true);
    expect(truCocVuotConLai('thanh_toan', 170_000_001, 170_000_000)).toBe(true);
    expect(truCocVuotConLai('thanh_toan', 170_000_000, 170_000_000)).toBe(false);
    expect(truCocVuotConLai('coc', 999, 0)).toBe(false);
  });

  it('HĐ không cọc, giá trị null/chuỗi numeric từ DB', () => {
    expect(tongHopCoc([])).toEqual({ tienCoc: 0, cocDaTru: 0, cocConLai: 0 });
    expect(
      tongHopCoc([
        { loai_dot: 'thanh_toan', so_tien: '190000000.00', tien_tru_coc: null },
        { loai_dot: 'coc', so_tien: null },
      ])
    ).toEqual({ tienCoc: 0, cocDaTru: 0, cocConLai: 0 });
  });
});

describe('chuanHoaDongTheoLoai', () => {
  it('dòng cọc ép số cây và trừ cọc về 0; dòng thanh toán giữ nguyên', () => {
    expect(chuanHoaDongTheoLoai({ loai_dot: 'coc', so_cay_thuc_nhan: 5, tien_tru_coc: 9 })).toEqual({
      loai_dot: 'coc',
      so_cay_thuc_nhan: 0,
      tien_tru_coc: 0,
    });
    const tt = { loai_dot: 'thanh_toan' as const, so_cay_thuc_nhan: 5, tien_tru_coc: 9 };
    expect(chuanHoaDongTheoLoai(tt)).toBe(tt);
  });
});
