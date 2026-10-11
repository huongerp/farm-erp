import { describe, it, expect } from 'vitest';
import {
  canDuyetThuChiQuy,
  canKhongDuyetThuChiQuy,
  canMutateThuChiQuy,
  canTraVeChoDuyetThuChiQuy,
  isThuChiQuyLocked,
  phanLoaiBulkThuChiQuy,
  tinhVaoTonQuy,
  trangThaiQuyToI18nKey,
} from './trang-thai';
import type { PhieuQuyTrangThai } from './trang-thai';

function phieu(trang_thai: PhieuQuyTrangThai['trang_thai']): PhieuQuyTrangThai {
  return { trang_thai, id_nguoi_tao: '7' };
}

describe('isThuChiQuyLocked / tinhVaoTonQuy', () => {
  it('chỉ phiếu chờ duyệt còn mở cho người thường', () => {
    expect(isThuChiQuyLocked(phieu('cho_duyet'))).toBe(false);
    expect(isThuChiQuyLocked(phieu('da_duyet'))).toBe(true);
    expect(isThuChiQuyLocked(phieu('khong_duyet'))).toBe(true);
  });

  it('chỉ phiếu không duyệt bị loại khỏi tồn quỹ', () => {
    expect(tinhVaoTonQuy(phieu('cho_duyet'))).toBe(true);
    expect(tinhVaoTonQuy(phieu('da_duyet'))).toBe(true);
    expect(tinhVaoTonQuy(phieu('khong_duyet'))).toBe(false);
  });
});

describe('canMutateThuChiQuy', () => {
  it('phiếu chờ duyệt: theo đúng quyền module', () => {
    expect(canMutateThuChiQuy(phieu('cho_duyet'), true, false)).toBe(true);
    expect(canMutateThuChiQuy(phieu('cho_duyet'), false, false)).toBe(false);
  });

  it('không có quyền module thì cấp cao cũng không sửa được', () => {
    expect(canMutateThuChiQuy(phieu('cho_duyet'), false, true)).toBe(false);
  });

  it('phiếu đã xét: người thường hết sửa/xoá, cấp cao vẫn được', () => {
    for (const tt of ['da_duyet', 'khong_duyet'] as const) {
      expect(canMutateThuChiQuy(phieu(tt), true, false)).toBe(false);
      expect(canMutateThuChiQuy(phieu(tt), true, true)).toBe(true);
    }
  });
});

describe('duyệt / không duyệt / đưa về chờ duyệt', () => {
  it('người thường không chuyển được trạng thái nào', () => {
    for (const tt of ['cho_duyet', 'da_duyet', 'khong_duyet'] as const) {
      expect(canDuyetThuChiQuy(phieu(tt), false)).toBe(false);
      expect(canKhongDuyetThuChiQuy(phieu(tt), false)).toBe(false);
      expect(canTraVeChoDuyetThuChiQuy(phieu(tt), false)).toBe(false);
    }
  });

  it('cấp cao: duyệt từ chờ duyệt hoặc đổi ý từ không duyệt', () => {
    expect(canDuyetThuChiQuy(phieu('cho_duyet'), true)).toBe(true);
    expect(canDuyetThuChiQuy(phieu('khong_duyet'), true)).toBe(true);
    expect(canDuyetThuChiQuy(phieu('da_duyet'), true)).toBe(false);
  });

  it('cấp cao: không duyệt từ chờ duyệt hoặc đổi ý từ đã duyệt', () => {
    expect(canKhongDuyetThuChiQuy(phieu('cho_duyet'), true)).toBe(true);
    expect(canKhongDuyetThuChiQuy(phieu('da_duyet'), true)).toBe(true);
    expect(canKhongDuyetThuChiQuy(phieu('khong_duyet'), true)).toBe(false);
  });

  it('cấp cao: chỉ đưa về chờ duyệt phiếu đã xét', () => {
    expect(canTraVeChoDuyetThuChiQuy(phieu('da_duyet'), true)).toBe(true);
    expect(canTraVeChoDuyetThuChiQuy(phieu('khong_duyet'), true)).toBe(true);
    expect(canTraVeChoDuyetThuChiQuy(phieu('cho_duyet'), true)).toBe(false);
  });
});

describe('trangThaiQuyToI18nKey', () => {
  it('map đủ ba trạng thái, giá trị lạ lui về chờ duyệt', () => {
    expect(trangThaiQuyToI18nKey('cho_duyet')).toBe('thuChiQuy.trangThai.choDuyet');
    expect(trangThaiQuyToI18nKey('da_duyet')).toBe('thuChiQuy.trangThai.daDuyet');
    expect(trangThaiQuyToI18nKey('khong_duyet')).toBe('thuChiQuy.trangThai.khongDuyet');
    expect(trangThaiQuyToI18nKey('xyz')).toBe('thuChiQuy.trangThai.choDuyet');
  });
});

describe('phanLoaiBulkThuChiQuy', () => {
  const rows = [
    { id: '1', trang_thai: 'cho_duyet' as const, id_nguoi_tao: '7' },
    { id: '2', trang_thai: 'da_duyet' as const, id_nguoi_tao: '7' },
    { id: '3', trang_thai: 'khong_duyet' as const, id_nguoi_tao: '7' },
  ];
  const ids = ['1', '2', '3'];
  const hopLeIds = (r: { hopLe: { id: string }[] }) => r.hopLe.map((x) => x.id);
  const capCao = { laCapCao: true };

  it('duyệt / không duyệt / đưa về: cấp cao, bỏ qua phiếu đã ở trạng thái đích', () => {
    expect(hopLeIds(phanLoaiBulkThuChiQuy(ids, rows, 'duyet', capCao))).toEqual(['1', '3']);
    expect(hopLeIds(phanLoaiBulkThuChiQuy(ids, rows, 'khong_duyet', capCao))).toEqual(['1', '2']);
    const traVe = phanLoaiBulkThuChiQuy(ids, rows, 'tra_ve', capCao);
    expect(hopLeIds(traVe)).toEqual(['2', '3']);
    expect(traVe.boQua).toBe(1);
  });

  it('người thường: không chuyển trạng thái hàng loạt được phiếu nào', () => {
    for (const hd of ['duyet', 'khong_duyet', 'tra_ve'] as const) {
      expect(phanLoaiBulkThuChiQuy(ids, rows, hd, { laCapCao: false }).hopLe).toEqual([]);
    }
  });

  it('xoá: cần quyền xoá module; phiếu đã xét chỉ cấp cao', () => {
    expect(hopLeIds(phanLoaiBulkThuChiQuy(ids, rows, 'xoa', { laCapCao: false, coQuyenXoa: true }))).toEqual(['1']);
    expect(phanLoaiBulkThuChiQuy(ids, rows, 'xoa', { laCapCao: true, coQuyenXoa: false }).hopLe).toEqual([]);
  });

  it('id không tra được (ngoài trang / đã xoá) bị bỏ qua, id trùng chỉ tính một lần', () => {
    const r = phanLoaiBulkThuChiQuy(['1', '1', '99'], rows, 'duyet', capCao);
    expect(hopLeIds(r)).toEqual(['1']);
    expect(r.boQua).toBe(1);
  });
});
