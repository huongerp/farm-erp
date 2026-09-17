// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetAppBusy, hasUnsavedInput, isAppBusy } from './app-busy';
import {
  TYPING_GRACE_MS,
  isEditableElement,
  isTypingNow,
  startTypingBusy,
} from './typing-busy';

let stop: (() => void) | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
  __resetAppBusy();
});

afterEach(() => {
  stop?.();
  stop = null;
  vi.useRealTimers();
});

function mount(html: string): void {
  document.body.innerHTML = html;
  stop = startTypingBusy();
}

describe('isEditableElement', () => {
  it('nhận ô nhập, bỏ qua nút và phần tử thường', () => {
    document.body.innerHTML = `
      <input id="text" />
      <input id="nut" type="submit" />
      <textarea id="vung"></textarea>
      <select id="chon"></select>
      <div id="ghi-chu" contenteditable="true"></div>
      <div id="thuong"></div>
    `;
    const byId = (id: string) => document.getElementById(id);
    expect(isEditableElement(byId('text'))).toBe(true);
    expect(isEditableElement(byId('vung'))).toBe(true);
    expect(isEditableElement(byId('chon'))).toBe(true);
    expect(isEditableElement(byId('ghi-chu'))).toBe(true);
    expect(isEditableElement(byId('nut'))).toBe(false);
    expect(isEditableElement(byId('thuong'))).toBe(false);
    expect(isEditableElement(null)).toBe(false);
  });
});

describe('startTypingBusy', () => {
  it('focus vào ô nhập là bận, nhưng không tính là dữ liệu chưa lưu', () => {
    mount('<input />');
    (document.querySelector('input') as HTMLInputElement).focus();
    expect(isAppBusy()).toBe(true);
    expect(hasUnsavedInput()).toBe(false);
  });

  it('ngừng gõ đủ lâu thì cờ tự tắt', () => {
    mount('<input />');
    const input = document.querySelector('input') as HTMLInputElement;
    input.focus();

    vi.advanceTimersByTime(TYPING_GRACE_MS - 1);
    expect(isAppBusy()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(isAppBusy()).toBe(false);
  });

  it('gõ tiếp thì hẹn lại giờ, không bị tắt giữa chừng', () => {
    mount('<input />');
    const input = document.querySelector('input') as HTMLInputElement;
    input.focus();

    for (let i = 0; i < 5; i += 1) {
      vi.advanceTimersByTime(TYPING_GRACE_MS - 100);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      expect(isAppBusy()).toBe(true);
    }

    vi.advanceTimersByTime(TYPING_GRACE_MS);
    expect(isAppBusy()).toBe(false);
  });

  it('ô nhập biến mất khỏi DOM mà không phát focusout thì cờ vẫn tự tắt', () => {
    // Ca thật: gõ trong drawer rồi bấm Lưu, drawer đóng, input bị gỡ khỏi DOM. Trình duyệt
    // không phát `focusout` — nếu cờ chỉ tắt theo focusout thì app kẹt, không bao giờ cập nhật.
    mount('<input />');
    const input = document.querySelector('input') as HTMLInputElement;
    input.focus();
    expect(isAppBusy()).toBe(true);

    input.remove();
    expect(isTypingNow()).toBe(false);

    vi.advanceTimersByTime(TYPING_GRACE_MS);
    expect(isAppBusy()).toBe(false);
  });

  it('focus vào phần tử thường thì không bận', () => {
    mount('<div tabindex="0"></div>');
    (document.querySelector('div') as HTMLElement).focus();
    expect(isAppBusy()).toBe(false);
    expect(isTypingNow()).toBe(false);
  });

  it('ô nhập đang được focus sẵn lúc gắn listener cũng tính là bận', () => {
    document.body.innerHTML = '<input />';
    (document.querySelector('input') as HTMLInputElement).focus();
    stop = startTypingBusy();
    expect(isAppBusy()).toBe(true);
  });

  it('dừng theo dõi thì gỡ hết trạng thái bận', () => {
    mount('<input />');
    (document.querySelector('input') as HTMLInputElement).focus();
    expect(isAppBusy()).toBe(true);

    stop?.();
    stop = null;
    expect(isAppBusy()).toBe(false);
  });
});

describe('isTypingNow', () => {
  it('true khi con trỏ đang đậu trong ô nhập, kể cả đã ngừng gõ rất lâu', () => {
    mount('<input />');
    const input = document.querySelector('input') as HTMLInputElement;
    input.focus();

    vi.advanceTimersByTime(TYPING_GRACE_MS * 10);
    expect(isAppBusy()).toBe(false);
    // Cờ đếm đã tắt, nhưng con trỏ vẫn trong ô — vẫn chưa phải lúc reload.
    expect(isTypingNow()).toBe(true);
  });
});
