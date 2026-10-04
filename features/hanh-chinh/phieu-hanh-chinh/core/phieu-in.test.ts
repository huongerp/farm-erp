import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { AdminFormRequest } from './types';
import { duLieuPhieuIn, escapeHtml, ketQuaIn, soPhieuIn, thoiGianIn } from './phieu-in';

const t = ((k: string) => k) as unknown as TFunction;
const fmt = (iso: string) => `fmt(${iso})`;

const phieu = (over: Partial<AdminFormRequest> = {}): AdminFormRequest => ({
  id: '127',
  loai_phieu: 'leave_paid',
  ca: 'full',
  ngay: '2026-10-01',
  den_ngay: '2026-10-03',
  tu_buoi: 'afternoon',
  den_buoi: 'morning',
  ly_do: 'Việc gia đình',
  nguoi_tao_id: '5',
  ten_nguoi_tao: 'Nguyễn Văn A',
  ten_phong_ban: 'Phòng Sản xuất',
  trang_thai_quan_ly: 'pending',
  trang_thai_hcns: 'approved',
  trang_thai: 'pending',
  tg_tao: '2026-09-30T08:00:00Z',
  tg_cap_nhat: '2026-10-01T09:00:00Z',
  ...over,
});

describe('phieu-in', () => {
  it('số phiếu đệm 5 chữ số', () => {
    expect(soPhieuIn('127')).toBe('PHC-00127');
    expect(soPhieuIn('123456')).toBe('PHC-123456');
  });

  it('thời gian: nhiều ngày ghi buổi → buổi, một ngày ghi ngày + ca', () => {
    expect(thoiGianIn(phieu(), t)).toBe('adminForm.session.afternoon 01/10/2026 → adminForm.session.morning 03/10/2026');
    expect(thoiGianIn(phieu({ den_ngay: '2026-10-01', ca: 'morning' }), t)).toBe(
      'adminForm.print.ngay 01/10/2026 – adminForm.shift.morning'
    );
  });

  it('trạng thái → ô tick; ngày xử lý chỉ có khi đã xử lý', () => {
    expect(ketQuaIn('approved')).toBe('dong_y');
    expect(ketQuaIn('rejected')).toBe('khong_dong_y');
    expect(ketQuaIn('cancelled')).toBe('huy');
    expect(ketQuaIn('manager_approved')).toBe('cho');
    expect(duLieuPhieuIn(phieu(), t, fmt).ngayXuLy).toBeNull();
    expect(duLieuPhieuIn(phieu({ trang_thai: 'approved' }), t, fmt).ngayXuLy).toBe('fmt(2026-10-01T09:00:00Z)');
  });

  it('tiêu đề theo loại; số ngày chỉ cho loại nhập theo khoảng', () => {
    const nghi = duLieuPhieuIn(phieu(), t, fmt);
    expect(nghi.tieuDe).toBe('adminForm.print.title.leave_paid');
    expect(nghi.soNgay).toBe('2');
    expect(duLieuPhieuIn(phieu({ tu_buoi: 'morning', den_ngay: '2026-10-02' }), t, fmt).soNgay).toBe('1,5');
    expect(duLieuPhieuIn(phieu({ loai_phieu: 'overtime' }), t, fmt).soNgay).toBeNull();
  });

  it('escape HTML trong nội dung người nhập', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;'
    );
  });
});
