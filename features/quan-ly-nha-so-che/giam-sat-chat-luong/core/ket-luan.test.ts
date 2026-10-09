import { describe, expect, it } from 'vitest';
import { ketLuanPhieu, quyDoiNguong, tinhTieuChi } from './ket-luan';
import type { TieuChi } from './types';

const tc = (p: Partial<TieuChi> & Pick<TieuChi, 'ma' | 'loai'>): TieuChi => ({
  ten: p.ma,
  don_vi: null,
  nguong_min: null,
  nguong_max: null,
  ...p,
});

describe('quyDoiNguong', () => {
  it('giữ nguyên với 10 thùng, quy đổi theo tỉ lệ N/10', () => {
    expect(quyDoiNguong(5, 10)).toBe(5);
    expect(quyDoiNguong(5, 5)).toBe(2.5);
    expect(quyDoiNguong(3, 20)).toBe(6);
    expect(quyDoiNguong(null, 5)).toBeNull();
  });
});

describe('tinhTieuChi — dem_loi', () => {
  const tray = tc({ ma: 'tray', loai: 'dem_loi', nguong_max: 5 });

  it('cộng tổng các thùng, ô trống = 0, so với ngưỡng tổng', () => {
    const r = tinhTieuChi(tray, [{ tray: 2 }, {}, { tray: 3 }], 10);
    expect(r.tong).toBe(5);
    expect(r.dat).toBe(true);
    expect(tinhTieuChi(tray, [{ tray: 4 }, { tray: 2 }], 10).dat).toBe(false);
  });

  it('quy đổi ngưỡng khi số thùng mẫu khác 10', () => {
    // 5 thùng → ngưỡng 2,5: tổng 3 là vượt.
    const r = tinhTieuChi(tray, [{ tray: 3 }], 5);
    expect(r.nguongMax).toBe(2.5);
    expect(r.dat).toBe(false);
  });

  it('không có ngưỡng → không xét', () => {
    expect(tinhTieuChi(tc({ ma: 'x', loai: 'dem_loi' }), [{ x: 9 }], 10).dat).toBeNull();
  });
});

describe('tinhTieuChi — do_luong', () => {
  const kg = tc({ ma: 'kg', loai: 'do_luong', nguong_min: 13, nguong_max: 14 });

  it('so trung bình các thùng có nhập với khoảng min–max', () => {
    const r = tinhTieuChi(kg, [{ kg: 13.2 }, { kg: 13.8 }, {}], 10);
    expect(r.trungBinh).toBe(13.5);
    expect(r.soThungCoGiaTri).toBe(2);
    expect(r.dat).toBe(true);
    expect(tinhTieuChi(kg, [{ kg: 12 }, { kg: 13 }], 10).dat).toBe(false);
  });

  it('chỉ có một đầu ngưỡng vẫn xét được', () => {
    const r = tinhTieuChi(tc({ ma: 't', loai: 'do_luong', nguong_min: 8 }), [{ t: 7 }], 10);
    expect(r.dat).toBe(false);
  });

  it('chưa thùng nào nhập → không xét', () => {
    expect(tinhTieuChi(kg, [{}], 10).dat).toBeNull();
  });
});

describe('tinhTieuChi — dat_khong', () => {
  it('ngưỡng trống = 0: có một thùng "Không" là rớt', () => {
    const tem = tc({ ma: 'tem', loai: 'dat_khong' });
    expect(tinhTieuChi(tem, [{ tem: true }, { tem: true }], 10).dat).toBe(true);
    const r = tinhTieuChi(tem, [{ tem: true }, { tem: false }], 10);
    expect(r.soKhong).toBe(1);
    expect(r.dat).toBe(false);
  });

  it('cho phép tối đa N thùng "Không"; ô trống không tính', () => {
    const nap = tc({ ma: 'nap', loai: 'dat_khong', nguong_max: 1 });
    expect(tinhTieuChi(nap, [{ nap: false }, {}, { nap: true }], 10).dat).toBe(true);
  });
});

describe('ketLuanPhieu', () => {
  const bo = [
    tc({ ma: 'tray', loai: 'dem_loi', nguong_max: 5 }),
    tc({ ma: 'rep', loai: 'dem_loi', nguong_max: 0 }),
    tc({ ma: 'tem', loai: 'dat_khong' }),
    tc({ ma: 'ghi', loai: 'dem_loi' }),
  ];

  it('chưa kiểm thùng nào → chưa kết luận', () => {
    expect(ketLuanPhieu(bo, [], 10, 1).ketLuan).toBeNull();
  });

  it('mọi tiêu chí có ngưỡng đều đạt → ĐẠT', () => {
    expect(ketLuanPhieu(bo, [{ tray: 1, tem: true, ghi: 50 }], 10, 1).ketLuan).toBe('dat');
  });

  it('ngưỡng 1: một tiêu chí rớt → KHÔNG ĐẠT', () => {
    expect(ketLuanPhieu(bo, [{ tray: 1, tem: false }], 10, 1).ketLuan).toBe('khong_dat');
  });

  it('ngưỡng 3: dưới 3 tiêu chí rớt vẫn ĐẠT, đủ 3 thì KHÔNG ĐẠT', () => {
    const haiRot = ketLuanPhieu(bo, [{ tray: 1, rep: 1, tem: false }], 10, 3);
    expect(haiRot.soKhongDat).toBe(2);
    expect(haiRot.ketLuan).toBe('dat');
    const baRot = ketLuanPhieu(bo, [{ tray: 6, rep: 1, tem: false }], 10, 3);
    expect(baRot.soKhongDat).toBe(3);
    expect(baRot.ketLuan).toBe('khong_dat');
  });

  it('tiêu chí không có ngưỡng không tính vào số rớt', () => {
    expect(ketLuanPhieu(bo, [{ ghi: 999 }], 10, 1).soKhongDat).toBe(0);
  });

  it('ngưỡng không hợp lệ (0, âm, NaN) → coi là 1', () => {
    for (const n of [0, -2, Number.NaN]) {
      expect(ketLuanPhieu(bo, [{ rep: 1 }], 10, n).ketLuan).toBe('khong_dat');
    }
  });
});
