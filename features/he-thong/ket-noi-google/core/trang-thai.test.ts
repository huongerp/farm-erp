import { describe, expect, it } from 'vitest';
import { tinhTrangKetNoi, tinhTrangLich } from './trang-thai';

describe('tinhTrangKetNoi', () => {
  const ok = { trang_thai: 'hoat_dong' as const, trang_thai_nhan_vien: 'Đang làm việc', so_lich_loi: 0 };

  it('bình thường', () => {
    expect(tinhTrangKetNoi(ok)).toBe('hoat_dong');
  });

  it('token hỏng ưu tiên cao nhất, kể cả khi nhân viên đã nghỉ và có lịch lỗi', () => {
    expect(tinhTrangKetNoi({ trang_thai: 'hong', trang_thai_nhan_vien: 'Nghỉ việc', so_lich_loi: 3 })).toBe('hong');
  });

  it('nhân viên nghỉ việc đứng trước lịch lỗi', () => {
    expect(tinhTrangKetNoi({ ...ok, trang_thai_nhan_vien: ' Nghỉ việc ', so_lich_loi: 2 })).toBe('nghi_viec');
  });

  it('có lịch lỗi', () => {
    expect(tinhTrangKetNoi({ ...ok, so_lich_loi: 1 })).toBe('co_loi');
  });

  it('thiếu trạng thái nhân viên (đã xoá khỏi danh mục) vẫn suy được', () => {
    expect(tinhTrangKetNoi({ ...ok, trang_thai_nhan_vien: null })).toBe('hoat_dong');
  });
});

describe('tinhTrangLich', () => {
  it('tắt kèm lỗi = hệ thống tự dừng; tắt không lỗi = tạm dừng tay', () => {
    expect(tinhTrangLich({ bat: false, ket_qua_cuoi: 'loi', can_chay: false })).toBe('da_dung');
    expect(tinhTrangLich({ bat: false, ket_qua_cuoi: 'ok', can_chay: true })).toBe('tam_dung');
    expect(tinhTrangLich({ bat: false, ket_qua_cuoi: null, can_chay: false })).toBe('tam_dung');
  });

  it('đang bật: lỗi > chờ ghi > bình thường', () => {
    expect(tinhTrangLich({ bat: true, ket_qua_cuoi: 'loi', can_chay: true })).toBe('loi');
    expect(tinhTrangLich({ bat: true, ket_qua_cuoi: 'ok', can_chay: true })).toBe('cho_ghi');
    expect(tinhTrangLich({ bat: true, ket_qua_cuoi: 'ok', can_chay: false })).toBe('binh_thuong');
  });
});
