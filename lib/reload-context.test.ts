import { describe, expect, it } from 'vitest';
import { RELOAD_CONTEXT_TTL_MS, matchReloadContext, type ReloadContext } from './reload-context';

const NOW = 1_700_000_000_000;

function raw(ctx: Partial<ReloadContext>): string {
  return JSON.stringify({ path: '/kho-van/phieu-nhap', scrollTop: 420, savedAt: NOW, ...ctx });
}

describe('matchReloadContext', () => {
  it('khớp trang và còn hạn thì dùng được', () => {
    const ctx = matchReloadContext(raw({}), '/kho-van/phieu-nhap', NOW + 1_000);
    expect(ctx).toEqual({ path: '/kho-van/phieu-nhap', scrollTop: 420, savedAt: NOW });
  });

  it('khác trang thì bỏ qua — không kéo người dùng về vị trí của trang khác', () => {
    expect(matchReloadContext(raw({}), '/quan-ly-nha-so-che/thu-hoach', NOW)).toBeNull();
  });

  it('phân biệt cả query string', () => {
    const stored = raw({ path: '/kho-van/phieu-nhap?trang=3' });
    expect(matchReloadContext(stored, '/kho-van/phieu-nhap', NOW)).toBeNull();
    expect(matchReloadContext(stored, '/kho-van/phieu-nhap?trang=3', NOW)).not.toBeNull();
  });

  it('quá hạn thì bỏ qua — đó là ngữ cảnh của phiên trước', () => {
    const late = NOW + RELOAD_CONTEXT_TTL_MS + 1;
    expect(matchReloadContext(raw({}), '/kho-van/phieu-nhap', late)).toBeNull();
  });

  it('còn đúng mốc hạn thì vẫn dùng', () => {
    const edge = NOW + RELOAD_CONTEXT_TTL_MS;
    expect(matchReloadContext(raw({}), '/kho-van/phieu-nhap', edge)).not.toBeNull();
  });

  it('không có gì, JSON hỏng, hoặc thiếu trường thì bỏ qua', () => {
    expect(matchReloadContext(null, '/a', NOW)).toBeNull();
    expect(matchReloadContext('', '/a', NOW)).toBeNull();
    expect(matchReloadContext('{khong-phai-json', '/a', NOW)).toBeNull();
    expect(matchReloadContext('"chuoi"', '/a', NOW)).toBeNull();
    expect(matchReloadContext(JSON.stringify({ path: '/a' }), '/a', NOW)).toBeNull();
    expect(
      matchReloadContext(JSON.stringify({ path: '/a', scrollTop: '10', savedAt: NOW }), '/a', NOW)
    ).toBeNull();
  });

  it('mốc thời gian nằm ở tương lai (đồng hồ máy bị chỉnh) thì bỏ qua', () => {
    expect(matchReloadContext(raw({}), '/kho-van/phieu-nhap', NOW - 1)).toBeNull();
  });
});
