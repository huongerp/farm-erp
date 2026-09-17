import { beforeEach, describe, expect, it } from 'vitest';
import {
  __resetPendingReload,
  decideUpdateAction,
  getPendingReloadAt,
  requestReloadWhenIdle,
  type UpdateState,
  type UpdateTrigger,
} from './app-update';

const base: UpdateState = {
  updateReady: true,
  busy: false,
  trigger: 'route',
};

const ALL_TRIGGERS: UpdateTrigger[] = ['ready', 'route', 'idle', 'visible', 'tick'];

describe('decideUpdateAction', () => {
  it('chưa có bản mới thì không làm gì', () => {
    expect(decideUpdateAction({ ...base, updateReady: false })).toBe('wait');
    expect(decideUpdateAction({ ...base, updateReady: false, busy: true })).toBe('wait');
  });

  it('rảnh thì áp bản mới, với mọi loại trigger', () => {
    for (const trigger of ALL_TRIGGERS) {
      expect(decideUpdateAction({ ...base, trigger })).toBe('apply');
    }
  });

  it('đang bận thì luôn chờ — không reload, cũng không nhắc gì', () => {
    for (const trigger of ALL_TRIGGERS) {
      expect(decideUpdateAction({ ...base, trigger, busy: true })).toBe('wait');
    }
  });
});

describe('requestReloadWhenIdle', () => {
  beforeEach(() => {
    __resetPendingReload();
  });

  it('mặc định không có yêu cầu treo', () => {
    expect(getPendingReloadAt()).toBeNull();
  });

  it('ghi nhận thời điểm yêu cầu và giữ nguyên thời điểm đầu tiên', () => {
    requestReloadWhenIdle();
    const first = getPendingReloadAt();
    expect(first).toBeTypeOf('number');
    requestReloadWhenIdle();
    expect(getPendingReloadAt()).toBe(first);
  });
});
