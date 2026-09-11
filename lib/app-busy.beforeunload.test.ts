// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { registerBusy, setMutationCount } from './app-busy';

/**
 * Trước đây app không chặn gì khi F5 / đóng tab: lỡ tay là mất phiếu đang điền.
 * Listener beforeunload được cài ngay khi import module, nên chỉ cần bắn event để soi.
 */
function fireBeforeUnload(): boolean {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

const releases: Array<() => void> = [];
afterEach(() => {
  releases.splice(0).forEach((fn) => fn());
  setMutationCount(0);
});

describe('cảnh báo beforeunload', () => {
  it('không chặn khi không có gì chưa lưu', () => {
    expect(fireBeforeUnload()).toBe(false);
  });

  it('chặn khi có form đang nhập dở', () => {
    releases.push(registerBusy('dirty'));
    expect(fireBeforeUnload()).toBe(true);
  });

  it('không chặn chỉ vì có drawer xem chi tiết đang mở hay mutation đang chạy', () => {
    releases.push(registerBusy('overlay'));
    setMutationCount(1);
    expect(fireBeforeUnload()).toBe(false);
  });

  it('hết dirty thì thôi chặn', () => {
    const release = registerBusy('dirty');
    expect(fireBeforeUnload()).toBe(true);
    release();
    expect(fireBeforeUnload()).toBe(false);
  });
});
