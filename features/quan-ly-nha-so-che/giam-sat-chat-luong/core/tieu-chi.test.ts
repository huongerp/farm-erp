import { describe, expect, it } from 'vitest';
import { anhChupTieuChi, soSanhBoTieuChi, taoMaTieuChi } from './tieu-chi';
import type { TieuChi, TieuChiDanhMuc } from './types';

describe('taoMaTieuChi', () => {
  it('bỏ dấu tiếng Việt, đ → d, ký tự lạ → _', () => {
    expect(taoMaTieuChi('Trầy tươi nặng', [])).toBe('tray_tuoi_nang');
    expect(taoMaTieuChi('Đốm / Thối  đầu', [])).toBe('dom_thoi_dau');
  });

  it('trùng mã đã có → thêm hậu tố', () => {
    expect(taoMaTieuChi('Rệp sáp', ['rep_sap'])).toBe('rep_sap_2');
    expect(taoMaTieuChi('Rệp sáp', ['rep_sap', 'rep_sap_2'])).toBe('rep_sap_3');
  });

  it('tên toàn ký tự lạ vẫn ra mã', () => {
    expect(taoMaTieuChi('???', [])).toBe('tieu_chi');
  });
});

describe('anhChupTieuChi', () => {
  const dm = (id: string, thu_tu: number, dang_dung = true): TieuChiDanhMuc => ({
    id,
    ma: `m${id}`,
    ten: `T${id}`,
    loai: 'dem_loi',
    don_vi: null,
    nguong_min: null,
    nguong_max: 3,
    thu_tu,
    dang_dung,
  });

  it('bỏ tiêu chí ngừng dùng, xếp theo thứ tự, bỏ cột danh mục', () => {
    const r = anhChupTieuChi([dm('1', 2), dm('2', 1), dm('3', 0, false)]);
    expect(r.map((x) => x.ma)).toEqual(['m2', 'm1']);
    expect(r[0]).not.toHaveProperty('id');
  });
});

describe('soSanhBoTieuChi', () => {
  const tc = (ma: string, p: Partial<TieuChi> = {}): TieuChi => ({
    ma,
    ten: ma,
    loai: 'dem_loi',
    don_vi: 'trái',
    nguong_min: null,
    nguong_max: 5,
    ...p,
  });

  it('bộ giống hệt → không thay đổi', () => {
    const r = soSanhBoTieuChi([tc('a'), tc('b')], [tc('a'), tc('b')]);
    expect(r.coThayDoi).toBe(false);
    expect(r.giuNguyen).toBe(2);
  });

  it('nhận ra tiêu chí thêm, bỏ và đổi ngưỡng', () => {
    const r = soSanhBoTieuChi([tc('a'), tc('b'), tc('c')], [tc('a', { nguong_max: 3 }), tc('c'), tc('d')]);
    expect(r.them.map((x) => x.ma)).toEqual(['d']);
    expect(r.bo.map((x) => x.ma)).toEqual(['b']);
    expect(r.doi).toHaveLength(1);
    expect(r.doi[0].truong).toEqual(['nguong_max']);
    expect(r.giuNguyen).toBe(1);
    expect(r.coThayDoi).toBe(true);
  });

  it('ngưỡng null ↔ có số là thay đổi; đổi tên cũng tính', () => {
    const r = soSanhBoTieuChi([tc('a', { nguong_max: null })], [tc('a', { ten: 'A mới', nguong_max: 2 })]);
    expect(r.doi[0].truong).toEqual(['ten', 'nguong_max']);
  });

  it('chỉ đổi thứ tự cũng là thay đổi', () => {
    const r = soSanhBoTieuChi([tc('a'), tc('b')], [tc('b'), tc('a')]);
    expect(r.doi).toHaveLength(0);
    expect(r.coThayDoi).toBe(true);
  });
});
