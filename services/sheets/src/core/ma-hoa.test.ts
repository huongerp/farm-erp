import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import { giaiMa, maHoa } from './ma-hoa.ts';

describe('ma-hoa token', () => {
  const khoa = randomBytes(32);

  it('mã hoá rồi giải mã ra đúng bản rõ, mỗi lần một bản mã khác', () => {
    const a = maHoa('1//refresh-token-xyz', khoa);
    const b = maHoa('1//refresh-token-xyz', khoa);
    expect(a).not.toBe(b);
    expect(a.startsWith('v1:')).toBe(true);
    expect(giaiMa(a, khoa)).toBe('1//refresh-token-xyz');
  });

  it('sai khoá thì ném lỗi, không trả rác', () => {
    const a = maHoa('bi-mat', khoa);
    expect(() => giaiMa(a, randomBytes(32))).toThrow();
  });

  it('bản mã bị sửa một byte thì ném lỗi', () => {
    const a = maHoa('bi-mat', khoa);
    const buf = Buffer.from(a.slice(3), 'base64');
    buf[buf.length - 1] ^= 1;
    expect(() => giaiMa(`v1:${buf.toString('base64')}`, khoa)).toThrow();
  });

  it('chuỗi không có tiền tố phiên bản bị từ chối', () => {
    expect(() => giaiMa('abc', khoa)).toThrow(/định dạng/);
  });
});
