import { describe, expect, it } from 'vitest';
import { CAI_DAT_TEM_MAC_DINH, bocCucTem, chuanHoaCaiDatTem } from './mau-tem';

describe('chuanHoaCaiDatTem', () => {
  it('trống / hỏng → mặc định', () => {
    expect(chuanHoaCaiDatTem(null)).toEqual(CAI_DAT_TEM_MAC_DINH);
    expect(chuanHoaCaiDatTem('abc')).toEqual(CAI_DAT_TEM_MAC_DINH);
  });

  it('kẹp khổ tem trong giới hạn, giữ trường đã tắt', () => {
    const c = chuanHoaCaiDatTem({ rong: 500, cao: 'x', truong: { ngay: false }, cheDo: 'a4' });
    expect(c.rong).toBe(150);
    expect(c.cao).toBe(CAI_DAT_TEM_MAC_DINH.cao);
    expect(c.truong.ngay).toBe(false);
    expect(c.truong.soPhieu).toBe(true);
    expect(c.cheDo).toBe('a4');
  });

  it('bỏ logo không phải ảnh data URL', () => {
    expect(chuanHoaCaiDatTem({ logo: 'https://x/y.png' }).logo).toBeNull();
    expect(chuanHoaCaiDatTem({ logo: 'data:image/png;base64,AAAA' }).logo).toBe('data:image/png;base64,AAAA');
  });
});

describe('bocCucTem', () => {
  it('tem dẹt 50×30 → xếp ngang, QR vừa chiều cao trong', () => {
    const b = bocCucTem({ ...CAI_DAT_TEM_MAC_DINH, rong: 50, cao: 30, le: 1.5, tiLeQr: 100 });
    expect(b.ngang).toBe(true);
    expect(b.qrMm).toBe(23.5); // min(27, 47 × 0,5)
  });

  it('tem vuông 50×50 → QR trên, chữ dưới', () => {
    const b = bocCucTem({ ...CAI_DAT_TEM_MAC_DINH, rong: 50, cao: 50, le: 2, tiLeQr: 100 });
    expect(b.ngang).toBe(false);
    expect(b.qrMm).toBeCloseTo(28.5, 1); // min(46, 46 × 0,62)
  });
});
