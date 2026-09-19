import { describe, it, expect } from 'vitest';
import {
  canDuyetMoThuChiQuy,
  canKhoaThuChiQuy,
  canMutateThuChiQuy,
  canTuChoiMoThuChiQuy,
  canXinMoThuChiQuy,
  isThuChiQuyLocked,
  trangThaiQuyToI18nKey,
} from './trang-thai';
import type { PhieuQuyTrangThai } from './trang-thai';

const NGUOI_TAO = '7';
const NGUOI_KHAC = '9';

function phieu(trang_thai: PhieuQuyTrangThai['trang_thai'], id_nguoi_tao: string | null = NGUOI_TAO): PhieuQuyTrangThai {
  return { trang_thai, id_nguoi_tao };
}

describe('isThuChiQuyLocked', () => {
  it('chỉ "mo" mới là mở; "cho_mo" vẫn đang khoá', () => {
    expect(isThuChiQuyLocked(phieu('mo'))).toBe(false);
    expect(isThuChiQuyLocked(phieu('khoa'))).toBe(true);
    expect(isThuChiQuyLocked(phieu('cho_mo'))).toBe(true);
  });
});

describe('canMutateThuChiQuy', () => {
  it('phiếu đang mở: theo đúng quyền module', () => {
    expect(canMutateThuChiQuy(phieu('mo'), true, false)).toBe(true);
    expect(canMutateThuChiQuy(phieu('mo'), false, false)).toBe(false);
  });

  it('không có quyền module thì cấp cao cũng không sửa được', () => {
    expect(canMutateThuChiQuy(phieu('mo'), false, true)).toBe(false);
  });

  it('phiếu đã khoá: người thường hết sửa/xoá dù là người tạo', () => {
    expect(canMutateThuChiQuy(phieu('khoa'), true, false)).toBe(false);
    expect(canMutateThuChiQuy(phieu('cho_mo'), true, false)).toBe(false);
  });

  it('phiếu đã khoá: cấp cao vẫn thao tác được', () => {
    expect(canMutateThuChiQuy(phieu('khoa'), true, true)).toBe(true);
    expect(canMutateThuChiQuy(phieu('cho_mo'), true, true)).toBe(true);
  });
});

describe('canKhoaThuChiQuy', () => {
  it('người tạo tự khoá phiếu của mình', () => {
    expect(canKhoaThuChiQuy(phieu('mo'), false, NGUOI_TAO)).toBe(true);
  });

  it('người khác không khoá hộ được', () => {
    expect(canKhoaThuChiQuy(phieu('mo'), false, NGUOI_KHAC)).toBe(false);
  });

  it('cấp cao khoá được mọi phiếu đang mở', () => {
    expect(canKhoaThuChiQuy(phieu('mo', NGUOI_KHAC), true, NGUOI_TAO)).toBe(true);
  });

  it('phiếu đã khoá / đang chờ mở thì không khoá lại', () => {
    expect(canKhoaThuChiQuy(phieu('khoa'), true, NGUOI_TAO)).toBe(false);
    expect(canKhoaThuChiQuy(phieu('cho_mo'), true, NGUOI_TAO)).toBe(false);
  });

  it('thiếu userId hoặc id_nguoi_tao thì fail-closed', () => {
    expect(canKhoaThuChiQuy(phieu('mo'), false, null)).toBe(false);
    expect(canKhoaThuChiQuy(phieu('mo', null), false, NGUOI_TAO)).toBe(false);
  });

  it('so sánh id dạng số và chuỗi vẫn khớp', () => {
    expect(canKhoaThuChiQuy({ trang_thai: 'mo', id_nguoi_tao: '7' }, false, '7')).toBe(true);
  });
});

describe('canXinMoThuChiQuy', () => {
  it('người tạo xin mở phiếu đã khoá', () => {
    expect(canXinMoThuChiQuy(phieu('khoa'), false, NGUOI_TAO)).toBe(true);
  });

  it('cấp cao không đi qua đường xin — họ mở thẳng', () => {
    expect(canXinMoThuChiQuy(phieu('khoa'), true, NGUOI_TAO)).toBe(false);
  });

  it('đã xin rồi thì không xin lại, phiếu đang mở cũng không', () => {
    expect(canXinMoThuChiQuy(phieu('cho_mo'), false, NGUOI_TAO)).toBe(false);
    expect(canXinMoThuChiQuy(phieu('mo'), false, NGUOI_TAO)).toBe(false);
  });

  it('người khác không xin hộ', () => {
    expect(canXinMoThuChiQuy(phieu('khoa'), false, NGUOI_KHAC)).toBe(false);
  });
});

describe('canDuyetMoThuChiQuy / canTuChoiMoThuChiQuy', () => {
  it('cấp cao mở được cả phiếu chờ mở lẫn phiếu khoá thẳng', () => {
    expect(canDuyetMoThuChiQuy(phieu('cho_mo'), true)).toBe(true);
    expect(canDuyetMoThuChiQuy(phieu('khoa'), true)).toBe(true);
  });

  it('người thường không mở được', () => {
    expect(canDuyetMoThuChiQuy(phieu('cho_mo'), false)).toBe(false);
  });

  it('phiếu đang mở thì không có gì để mở', () => {
    expect(canDuyetMoThuChiQuy(phieu('mo'), true)).toBe(false);
  });

  it('từ chối chỉ áp cho phiếu đang có yêu cầu', () => {
    expect(canTuChoiMoThuChiQuy(phieu('cho_mo'), true)).toBe(true);
    expect(canTuChoiMoThuChiQuy(phieu('khoa'), true)).toBe(false);
    expect(canTuChoiMoThuChiQuy(phieu('cho_mo'), false)).toBe(false);
  });
});

describe('trangThaiQuyToI18nKey', () => {
  it('map đủ ba trạng thái, giá trị lạ lui về "mo"', () => {
    expect(trangThaiQuyToI18nKey('mo')).toBe('thuChiQuy.trangThai.mo');
    expect(trangThaiQuyToI18nKey('khoa')).toBe('thuChiQuy.trangThai.khoa');
    expect(trangThaiQuyToI18nKey('cho_mo')).toBe('thuChiQuy.trangThai.choMo');
    expect(trangThaiQuyToI18nKey('xyz')).toBe('thuChiQuy.trangThai.mo');
  });
});
