import { describe, expect, it } from 'vitest';
import { docMaTem, taoNoiDungQr } from './qr';

describe('QR tem giám sát chất lượng', () => {
  it('tạo rồi đọc lại đúng mã tem', () => {
    expect(docMaTem(taoNoiDungQr('GS-00012-03'))).toBe('GS-00012-03');
  });

  it('chấp nhận thiếu tiền tố, chữ thường, khoảng trắng', () => {
    expect(docMaTem(' gs-00012-03 ')).toBe('GS-00012-03');
    expect(docMaTem('gscl: GS-7-10')).toBe('GS-7-10');
  });

  it('QR hàng hoá hoặc chuỗi rác → null', () => {
    expect(docMaTem('TP-TQ401')).toBeNull();
    expect(docMaTem('HH:TP-TQ401')).toBeNull();
    expect(docMaTem('GSCL:')).toBeNull();
    expect(docMaTem('')).toBeNull();
    expect(docMaTem(null)).toBeNull();
  });
});
