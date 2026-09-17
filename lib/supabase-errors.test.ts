import { describe, it, expect } from 'vitest';
import { formatSupabaseError } from './supabase-errors';

describe('formatSupabaseError — key i18n phải giải được', () => {
  it('lỗi mạng ra câu tiếng Việt, không phải tên key', () => {
    const msg = formatSupabaseError(new TypeError('Failed to fetch'));
    expect(msg).not.toContain('errors.db.');
    expect(msg).toContain('Lỗi mạng');
  });

  it('RLS 42501 ra câu tiếng Việt kèm mã', () => {
    const msg = formatSupabaseError({ code: '42501', message: 'permission denied for table x' });
    expect(msg).not.toContain('errors.db.');
    expect(msg).toContain('42501');
  });
});

describe('formatSupabaseError — 23505 (unique index mã hàng)', () => {
  it('nhận theo code và nêu rõ cột/giá trị bị trùng', () => {
    const msg = formatSupabaseError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "uq_fp_farm_danh_sach_hang_hoa_ma"',
      details: 'Key (ma_hang_hoa)=(HH-001) already exists.',
    });
    expect(msg).toContain('23505');
    expect(msg).toContain('ma_hang_hoa = HH-001');
    expect(msg).not.toContain('duplicate key value');
  });

  it('nhận cả khi client không gắn code, chỉ có message', () => {
    const msg = formatSupabaseError({
      message: 'duplicate key value violates unique constraint "uq_fp_mh_danh_sach_hang_hoa_ma"',
    });
    expect(msg).toContain('23505');
    expect(msg).not.toContain('errors.db.');
  });

  it('thiếu details thì vẫn ra thông báo, không vỡ', () => {
    const msg = formatSupabaseError({ code: '23505', message: 'duplicate key value violates unique constraint' });
    expect(msg).toContain('23505');
    expect(msg).not.toContain('errors.db.');
  });
});
