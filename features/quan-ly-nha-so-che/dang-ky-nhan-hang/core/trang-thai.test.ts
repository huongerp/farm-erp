import { describe, expect, it } from 'vitest';
import {
  coTheCheckIn,
  coTheCheckOut,
  coTheHoanTacCheckIn,
  coTheHoanTacCheckOut,
  coTheHuy,
  coTheSuaHangHoa,
  coTheSuaPhieu,
  coTheThemAnh,
  coTheXoaPhieu,
} from './trang-thai';

describe('máy trạng thái đăng ký nhận hàng', () => {
  it('check in chỉ khi chờ vào, check out chỉ khi đã vào — không đòi hàng/ảnh', () => {
    expect(coTheCheckIn('cho_vao')).toBe(true);
    expect(coTheCheckIn('da_vao')).toBe(false);
    expect(coTheCheckOut('da_vao')).toBe(true);
    expect(coTheCheckOut('cho_vao')).toBe(false);
    expect(coTheCheckOut('da_ra')).toBe(false);
  });

  it('huỷ chỉ khi xe chưa vào', () => {
    expect(coTheHuy('cho_vao')).toBe(true);
    expect(coTheHuy('da_vao')).toBe(false);
    expect(coTheHuy('da_ra')).toBe(false);
  });

  it('hoàn tác chỉ dành cho cấp cao, đúng trạng thái', () => {
    expect(coTheHoanTacCheckIn('da_vao', false)).toBe(false);
    expect(coTheHoanTacCheckIn('da_vao', true)).toBe(true);
    expect(coTheHoanTacCheckIn('da_ra', true)).toBe(false);
    expect(coTheHoanTacCheckOut('da_ra', true)).toBe(true);
    expect(coTheHoanTacCheckOut('da_ra', false)).toBe(false);
  });

  it('sửa hàng xuất: xe đang trong farm; đã ra thì chỉ cấp cao', () => {
    expect(coTheSuaHangHoa('cho_vao', true)).toBe(false);
    expect(coTheSuaHangHoa('da_vao', false)).toBe(true);
    expect(coTheSuaHangHoa('da_ra', false)).toBe(false);
    expect(coTheSuaHangHoa('da_ra', true)).toBe(true);
    expect(coTheSuaHangHoa('huy', true)).toBe(false);
  });

  it('sửa / xoá phiếu đã xong chỉ cấp cao', () => {
    expect(coTheSuaPhieu('da_vao', false)).toBe(true);
    expect(coTheSuaPhieu('da_ra', false)).toBe(false);
    expect(coTheSuaPhieu('da_ra', true)).toBe(true);
    expect(coTheXoaPhieu('huy', false)).toBe(true);
    expect(coTheXoaPhieu('da_vao', false)).toBe(false);
    expect(coTheXoaPhieu('da_vao', true)).toBe(true);
  });

  it('thêm ảnh mọi lúc trừ phiếu huỷ', () => {
    expect(coTheThemAnh('cho_vao')).toBe(true);
    expect(coTheThemAnh('da_ra')).toBe(true);
    expect(coTheThemAnh('huy')).toBe(false);
  });
});
