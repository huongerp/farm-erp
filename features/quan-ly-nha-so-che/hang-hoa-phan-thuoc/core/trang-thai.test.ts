import { describe, expect, it } from 'vitest';
import { canDuaVaoKiemKe, chuanHoaTrangThaiHangHoa, locHangHoaChoChon } from './trang-thai';

const DANG = 'Đang hoạt động';
const NGUNG = 'Ngừng hoạt động';

describe('chuanHoaTrangThaiHangHoa', () => {
  it('chỉ "Ngừng hoạt động" là ngừng, null / chuỗi lạ coi là đang hoạt động', () => {
    expect(chuanHoaTrangThaiHangHoa(NGUNG)).toBe(NGUNG);
    expect(chuanHoaTrangThaiHangHoa(null)).toBe(DANG);
    expect(chuanHoaTrangThaiHangHoa('Tạm dừng')).toBe(DANG);
  });
});

describe('locHangHoaChoChon', () => {
  const list = [
    { id: '1', trang_thai: DANG },
    { id: '2', trang_thai: NGUNG },
    { id: '3', trang_thai: NGUNG },
    { id: '4', trang_thai: null },
  ];

  it('bỏ hàng ngừng hoạt động khỏi ô chọn phiếu mới', () => {
    expect(locHangHoaChoChon(list).map((h) => h.id)).toEqual(['1', '4']);
  });

  it('giữ hàng ngừng đang nằm trên phiếu (sửa phiếu cũ), bỏ qua id rỗng', () => {
    expect(locHangHoaChoChon(list, ['3', '', undefined]).map((h) => h.id)).toEqual(['1', '3', '4']);
  });
});

describe('canDuaVaoKiemKe', () => {
  it('hàng đang hoạt động luôn vào danh sách kiểm kê', () => {
    expect(canDuaVaoKiemKe({ trang_thai: DANG }, 0)).toBe(true);
  });

  it('hàng ngừng chỉ vào khi sổ còn tồn (kể cả âm)', () => {
    expect(canDuaVaoKiemKe({ trang_thai: NGUNG }, 0)).toBe(false);
    expect(canDuaVaoKiemKe({ trang_thai: NGUNG }, 5)).toBe(true);
    expect(canDuaVaoKiemKe({ trang_thai: NGUNG }, -2)).toBe(true);
  });
});
