import { describe, expect, it } from 'vitest';
import { chuanHoaCaiDatIn } from './cai-dat-in';
import { chuoiCss, cssPage, cssTrangDayDu, dongChanTrai } from './css-trang';

describe('cssPage', () => {
  it('khổ, hướng, lề từng cạnh, số trang', () => {
    const c = chuanHoaCaiDatIn({ kho: 'a5', huong: 'ngang', le: { tren: 10, phai: 8, duoi: 12, trai: 15 } });
    const css = cssPage(c, { chanTrai: 'In lúc 08:00' });
    expect(css).toContain('size: A5 landscape;');
    expect(css).toContain('margin: 10mm 8mm 12mm 15mm;');
    expect(css).toContain('@bottom-right { content: "Trang " counter(page) "/" counter(pages);');
    expect(css).toContain('@bottom-left { content: "In lúc 08:00";');
  });

  it('tắt số trang và không có dòng chân trái → không margin box', () => {
    const c = chuanHoaCaiDatIn({ dauChan: { soTrang: false } });
    expect(cssPage(c)).not.toContain('@bottom');
  });
});

describe('cssTrangDayDu', () => {
  it('bỏ @import, ẩn logo / ô ký / tiêu đề lặp theo cài đặt', () => {
    const c = chuanHoaCaiDatIn({ hienLogo: false, hienChuKy: false, dauChan: { lapTieuDeBang: false } });
    const css = cssTrangDayDu(c, {}, "@import url('https://fonts.googleapis.com/css2?family=Roboto');\n.a{color:red}");
    expect(css).not.toContain('@import');
    expect(css).toContain('.a{color:red}');
    expect(css).toContain('[data-in-logo] { display: none');
    expect(css).toContain('[data-in-chu-ky] { display: none');
    expect(css).toContain('thead[data-in-lap] { display: none');
  });

  it('mặc định giữ logo, ô ký, tiêu đề lặp', () => {
    const css = cssTrangDayDu(chuanHoaCaiDatIn({}));
    expect(css).not.toContain('display: none');
  });
});

describe('dongChanTrai + chuoiCss', () => {
  it('ghép giờ in · người in theo cài đặt', () => {
    const c = chuanHoaCaiDatIn({ dauChan: { gioIn: true, nguoiIn: true } });
    expect(dongChanTrai(c, '08:00 06/11/2026', 'Nguyễn A')).toBe('In lúc 08:00 06/11/2026 · Người in: Nguyễn A');
    expect(dongChanTrai(c, 'x', null)).toBe('In lúc x');
  });

  it('thoát nháy kép và gạch chéo', () => {
    expect(chuoiCss('a"b\\c\nd')).toBe('"a\\"b\\\\c d"');
  });
});
