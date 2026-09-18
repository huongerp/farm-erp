import { describe, it, expect } from 'vitest';
import { base64UrlSangUint8Array } from './push-service';

describe('base64UrlSangUint8Array', () => {
  it('giải mã base64 thường', () => {
    // "Hi" = 0x48 0x69
    expect(Array.from(base64UrlSangUint8Array('SGk='))).toEqual([0x48, 0x69]);
  });

  it('hoàn nguyên ký tự base64url: - thành + và _ thành /', () => {
    // 0xFB 0xFF = "+/8=" ở base64 thường, "-_8" ở base64url (không padding)
    expect(Array.from(base64UrlSangUint8Array('-_8'))).toEqual([0xfb, 0xff]);
  });

  it('tự thêm padding khi chuỗi thiếu dấu =', () => {
    expect(Array.from(base64UrlSangUint8Array('SGk'))).toEqual([0x48, 0x69]);
  });

  it('khoá VAPID thật dài 65 byte và bắt đầu bằng 0x04 (điểm EC chưa nén)', () => {
    const khoa = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    const bytes = base64UrlSangUint8Array(khoa);
    expect(bytes.length).toBe(65);
    expect(bytes[0]).toBe(0x04);
  });

  it('chuỗi rỗng trả mảng rỗng', () => {
    expect(base64UrlSangUint8Array('').length).toBe(0);
  });
});
