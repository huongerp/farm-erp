import { beforeEach, describe, expect, it } from 'vitest';
import {
  SOFT_NOTIFY_AFTER_MS,
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
  msSinceReady: 1_000,
  alreadyNotified: false,
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

  it('đang bận thì không bao giờ reload, kể cả đã chờ rất lâu', () => {
    for (const trigger of ALL_TRIGGERS) {
      const decision = decideUpdateAction({
        ...base,
        trigger,
        busy: true,
        msSinceReady: 10 * SOFT_NOTIFY_AFTER_MS,
      });
      expect(decision).not.toBe('apply');
    }
  });

  it('bận lâu quá thì nhắc mềm — nhưng chỉ ở nhịp định kỳ', () => {
    const stuck = { ...base, busy: true, msSinceReady: SOFT_NOTIFY_AFTER_MS };
    expect(decideUpdateAction({ ...stuck, trigger: 'tick' })).toBe('notify');
    expect(decideUpdateAction({ ...stuck, trigger: 'route' })).toBe('wait');
    expect(decideUpdateAction({ ...stuck, trigger: 'idle' })).toBe('wait');
  });

  it('bận nhưng chưa đủ lâu thì chưa nhắc', () => {
    const decision = decideUpdateAction({
      ...base,
      busy: true,
      trigger: 'tick',
      msSinceReady: SOFT_NOTIFY_AFTER_MS - 1,
    });
    expect(decision).toBe('wait');
  });

  it('đã nhắc rồi thì không nhắc lại', () => {
    const decision = decideUpdateAction({
      ...base,
      busy: true,
      trigger: 'tick',
      msSinceReady: 5 * SOFT_NOTIFY_AFTER_MS,
      alreadyNotified: true,
    });
    expect(decision).toBe('wait');
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
