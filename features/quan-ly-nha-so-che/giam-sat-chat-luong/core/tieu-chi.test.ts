import { describe, expect, it } from 'vitest';
import { anhChupTieuChi, taoMaTieuChi } from './tieu-chi';
import type { TieuChiDanhMuc } from './types';

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
