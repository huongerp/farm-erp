import { describe, expect, it } from 'vitest';
import { docMaTem, taoNoiDungQr, taoUrlQrTem } from './qr';

describe('QR tem dạng URL (camera điện thoại mở trang thông tin)', () => {
  it('tạo URL /qr/<ma_tem> rồi đọc lại đúng mã', () => {
    const url = taoUrlQrTem('2026-012-11-05-01', 'https://erp.vd.vn');
    expect(url).toBe('https://erp.vd.vn/qr/2026-012-11-05-01');
    expect(docMaTem(url)).toBe('2026-012-11-05-01');
  });

  it('origin có dấu / cuối không sinh //', () => {
    expect(taoUrlQrTem('2026-012-11-05-01', 'https://erp.vd.vn/')).toBe('https://erp.vd.vn/qr/2026-012-11-05-01');
  });

  it('URL kèm query/hash vẫn đọc được mã', () => {
    expect(docMaTem('https://erp.vd.vn/qr/2026-012-11-05-01?x=1')).toBe('2026-012-11-05-01');
    expect(docMaTem('http://localhost:5173/qr/2026-001-10-04-100#a')).toBe('2026-001-10-04-100');
  });

  it('URL khác đường /qr/ hoặc mã sai → null', () => {
    expect(docMaTem('https://erp.vd.vn/khac/2026-012-11-05-01')).toBeNull();
    expect(docMaTem('https://erp.vd.vn/qr/GS-00012-03')).toBeNull();
    expect(docMaTem('https://erp.vd.vn/qr/')).toBeNull();
  });
});

describe('QR tem giám sát chất lượng', () => {
  it('tạo rồi đọc lại đúng mã tem', () => {
    expect(docMaTem(taoNoiDungQr('2026-001-10-04-03'))).toBe('2026-001-10-04-03');
  });

  it('chấp nhận thiếu tiền tố, chữ thường, khoảng trắng', () => {
    expect(docMaTem(' 2026-001-10-04-03 ')).toBe('2026-001-10-04-03');
    expect(docMaTem('gscl: 2026-012-12-31-100')).toBe('2026-012-12-31-100');
  });

  it('mã cũ GS-xxxxx, QR hàng hoá hoặc chuỗi rác → null', () => {
    expect(docMaTem('GSCL:GS-00012-03')).toBeNull();
    expect(docMaTem('001-10-04')).toBeNull();
    expect(docMaTem('TP-TQ401')).toBeNull();
    expect(docMaTem('HH:TP-TQ401')).toBeNull();
    expect(docMaTem('GSCL:')).toBeNull();
    expect(docMaTem('')).toBeNull();
    expect(docMaTem(null)).toBeNull();
  });
});
