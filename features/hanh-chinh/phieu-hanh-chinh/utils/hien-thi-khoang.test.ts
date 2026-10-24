import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { AdminFormRequest } from '../core/types';
import { moTaThoiGianPhieu } from './hien-thi-khoang';

const NHAN: Record<string, string> = {
  'adminForm.session.morning': 'Sáng',
  'adminForm.session.afternoon': 'Chiều',
  'adminForm.shift.morning': 'Sáng',
  'adminForm.shift.afternoon': 'Chiều',
  'adminForm.shift.full': 'Cả ngày',
};
const t = ((key: string, opts?: { soNgay?: string }) =>
  key === 'adminForm.card.soNgay' ? `${opts?.soNgay} ngày` : (NHAN[key] ?? key)) as unknown as TFunction;

const phieu = (p: Partial<AdminFormRequest>): AdminFormRequest =>
  ({ loai_phieu: 'leave_paid', ca: 'full', ngay: '2026-10-21', den_ngay: '2026-10-21', tu_buoi: 'morning', den_buoi: 'afternoon', ...p }) as AdminFormRequest;

describe('moTaThoiGianPhieu', () => {
  it('nghỉ nhiều ngày: khoảng + số ngày', () => {
    expect(moTaThoiGianPhieu(phieu({ den_ngay: '2026-10-22' }), t)).toBe('21/10 sáng → 22/10 chiều · 2 ngày');
  });

  it('nghỉ nửa ngày: ngày đủ năm + ca + số ngày', () => {
    const p = phieu({ loai_phieu: 'leave_unpaid', ca: 'afternoon', tu_buoi: 'afternoon', den_buoi: 'afternoon' });
    expect(moTaThoiGianPhieu(p, t)).toBe('21/10/2026 · Chiều · 0,5 ngày');
  });

  it('đi muộn / tăng ca: không ghi số ngày', () => {
    expect(moTaThoiGianPhieu(phieu({ loai_phieu: 'late_early' }), t)).toBe('21/10/2026 · Cả ngày');
    expect(moTaThoiGianPhieu(phieu({ loai_phieu: 'overtime', ca: 'afternoon' }), t)).toBe('21/10/2026 · Chiều');
  });
});
