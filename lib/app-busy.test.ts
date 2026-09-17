import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetAppBusy,
  hasUnsavedInput,
  isAppBusy,
  registerBusy,
  setMutationCount,
  subscribe,
} from './app-busy';

beforeEach(() => {
  __resetAppBusy();
});

describe('isAppBusy', () => {
  it('mặc định rảnh', () => {
    expect(isAppBusy()).toBe(false);
    expect(hasUnsavedInput()).toBe(false);
  });

  it('bận khi có overlay, hết bận khi gỡ', () => {
    const release = registerBusy('overlay');
    expect(isAppBusy()).toBe(true);
    release();
    expect(isAppBusy()).toBe(false);
  });

  it('con trỏ đang nằm trong ô nhập cũng là bận', () => {
    const release = registerBusy('typing');
    expect(isAppBusy()).toBe(true);
    expect(hasUnsavedInput()).toBe(false);
    release();
    expect(isAppBusy()).toBe(false);
  });

  it('đếm chồng nhiều overlay — chỉ rảnh khi cái cuối cùng đóng', () => {
    const a = registerBusy('overlay');
    const b = registerBusy('overlay');
    a();
    expect(isAppBusy()).toBe(true);
    b();
    expect(isAppBusy()).toBe(false);
  });

  it('gọi hàm gỡ nhiều lần không làm số đếm âm', () => {
    const a = registerBusy('overlay');
    const b = registerBusy('overlay');
    a();
    a();
    a();
    expect(isAppBusy()).toBe(true);
    b();
    expect(isAppBusy()).toBe(false);
  });
});

describe('hasUnsavedInput', () => {
  it('chỉ tính dirty, không tính overlay, mutation hay typing', () => {
    const overlay = registerBusy('overlay');
    const typing = registerBusy('typing');
    setMutationCount(2);
    expect(isAppBusy()).toBe(true);
    expect(hasUnsavedInput()).toBe(false);
    typing();

    const dirty = registerBusy('dirty');
    expect(hasUnsavedInput()).toBe(true);

    dirty();
    expect(hasUnsavedInput()).toBe(false);
    overlay();
    setMutationCount(0);
    expect(isAppBusy()).toBe(false);
  });
});

describe('setMutationCount', () => {
  it('đặt thẳng số lượng, âm được kẹp về 0', () => {
    setMutationCount(3);
    expect(isAppBusy()).toBe(true);
    setMutationCount(0);
    expect(isAppBusy()).toBe(false);
    setMutationCount(-5);
    expect(isAppBusy()).toBe(false);
  });
});

describe('subscribe', () => {
  it('báo mỗi lần trạng thái đổi và dừng sau khi huỷ đăng ký', () => {
    const fn = vi.fn();
    const unsubscribe = subscribe(fn);

    const release = registerBusy('overlay');
    expect(fn).toHaveBeenCalledTimes(1);
    release();
    expect(fn).toHaveBeenCalledTimes(2);

    unsubscribe();
    registerBusy('dirty');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('không báo khi setMutationCount đặt lại cùng giá trị', () => {
    const fn = vi.fn();
    subscribe(fn);
    setMutationCount(1);
    setMutationCount(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('một listener ném lỗi không chặn listener còn lại', () => {
    const good = vi.fn();
    subscribe(() => {
      throw new Error('bùm');
    });
    subscribe(good);
    registerBusy('overlay');
    expect(good).toHaveBeenCalledTimes(1);
  });
});
