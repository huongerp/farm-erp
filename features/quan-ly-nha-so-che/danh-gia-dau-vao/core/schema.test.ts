import { describe, expect, it } from 'vitest';
import { dgdvFormSchema } from './schema';

const phieu = (them: Record<string, unknown> = {}) => ({
  ngay: '2026-11-23',
  chuyen: 1,
  id_chi_nhanh: '1',
  ghi_chu: '',
  cot: [],
  lo: [],
  ...them,
});

describe('dgdvFormSchema — cân mẫu buồng', () => {
  it('mặc định: không nhập → 0 buồng, 0 kg, giờ null', () => {
    const r = dgdvFormSchema.safeParse(phieu());
    expect(r.success).toBe(true);
    expect(r.success && [r.data.so_buong_can_mau, r.data.tong_can_nang_mau, r.data.gio_can_mau]).toEqual([0, 0, null]);
  });

  it('ô trống (chuỗi rỗng) → 0, không phải NaN', () => {
    const r = dgdvFormSchema.safeParse(phieu({ so_buong_can_mau: '', tong_can_nang_mau: '' }));
    expect(r.success && [r.data.so_buong_can_mau, r.data.tong_can_nang_mau]).toEqual([0, 0]);
  });

  it('có kg mà không có buồng → chặn ở ô số buồng', () => {
    const r = dgdvFormSchema.safeParse(phieu({ so_buong_can_mau: 0, tong_can_nang_mau: 12.5 }));
    expect(r.success).toBe(false);
    expect(r.success === false && r.error.issues[0]?.path).toEqual(['so_buong_can_mau']);
  });

  it('có buồng, không kg → hợp lệ', () => {
    const r = dgdvFormSchema.safeParse(phieu({ so_buong_can_mau: 12, tong_can_nang_mau: 0 }));
    expect(r.success).toBe(true);
  });

  it('giờ: HH:mm hợp lệ, "" → null, sai định dạng bị chặn', () => {
    expect(dgdvFormSchema.safeParse(phieu({ gio_can_mau: '07:30' })).success).toBe(true);
    const rong = dgdvFormSchema.safeParse(phieu({ gio_can_mau: '' }));
    expect(rong.success && rong.data.gio_can_mau).toBeNull();
    expect(dgdvFormSchema.safeParse(phieu({ gio_can_mau: '7:30' })).success).toBe(false);
    expect(dgdvFormSchema.safeParse(phieu({ gio_can_mau: '25:00' })).success).toBe(false);
  });

  it('số buồng âm bị chặn', () => {
    expect(dgdvFormSchema.safeParse(phieu({ so_buong_can_mau: -1 })).success).toBe(false);
  });
});
