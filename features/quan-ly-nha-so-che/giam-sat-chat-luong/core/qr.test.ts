import { describe, expect, it } from 'vitest';
import { docMaTem, taoNoiDungQr } from './qr';

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
