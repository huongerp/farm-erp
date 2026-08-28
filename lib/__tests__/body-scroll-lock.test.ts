// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { lockBodyScroll } from '../body-scroll-lock';

describe('lockBodyScroll', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  it('khoá khi mở và trả lại giá trị gốc khi đóng', () => {
    const nha = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    nha();
    expect(document.body.style.overflow).toBe('');
  });

  it('hai overlay chồng nhau: chỉ nhả khi cái cuối đóng', () => {
    // Đây là ca lỗi cũ: sheet B chụp nhầm 'hidden' của sheet A làm "giá trị gốc",
    // đóng cả hai xong trang vẫn kẹt không cuộn được.
    const nhaA = lockBodyScroll();
    const nhaB = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');

    nhaB();
    expect(document.body.style.overflow).toBe('hidden'); // A còn mở

    nhaA();
    expect(document.body.style.overflow).toBe('');
  });

  it('đóng theo thứ tự đảo ngược vẫn nhả đúng', () => {
    const nhaA = lockBodyScroll();
    const nhaB = lockBodyScroll();
    nhaA();
    expect(document.body.style.overflow).toBe('hidden');
    nhaB();
    expect(document.body.style.overflow).toBe('');
  });

  it('gọi hàm nhả nhiều lần không làm lệch bộ đếm', () => {
    const nhaA = lockBodyScroll();
    const nhaB = lockBodyScroll();
    nhaB();
    nhaB();
    nhaB();
    // Nếu bộ đếm bị trừ dư, overlay A còn mở mà trang đã nhả khoá.
    expect(document.body.style.overflow).toBe('hidden');
    nhaA();
    expect(document.body.style.overflow).toBe('');
  });

  it('giữ nguyên giá trị overflow có sẵn của trang', () => {
    document.body.style.overflow = 'auto';
    const nha = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    nha();
    expect(document.body.style.overflow).toBe('auto');
  });
});