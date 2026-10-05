import { describe, it, expect } from 'vitest';
import {
  aggregateTonKhoPTByProduct,
  laHangDuoiDinhMuc,
  themHangChuaPhatSinh,
  type HangHoaDinhMucLite,
} from './aggregate-ton-kho-pt-by-product';
import type { TonKhoPTDisplayRow } from '../core/types';

const dong = (id_kho: string, id_hang_hoa: string, so_luong: number, dinh_muc: number | null): TonKhoPTDisplayRow => ({
  id_kho,
  id_hang_hoa,
  so_luong,
  ma_kho: `K${id_kho}`,
  ten_kho: `Kho ${id_kho}`,
  ma_hang: `H${id_hang_hoa}`,
  ten_hang: `Hàng ${id_hang_hoa}`,
  don_vi_tinh: 'Bao',
  dinh_muc,
});

const hang = (id: string, dinh_muc: number | null): HangHoaDinhMucLite => ({
  id,
  ma_hang_hoa: `H${id}`,
  ten_hang_hoa: `Hàng ${id}`,
  danh_muc_id: null,
  dvt: 'Bao',
  dinh_muc,
});

describe('themHangChuaPhatSinh', () => {
  it('chỉ thêm hàng có định mức > 0 và chưa có dòng tồn ở kho nào', () => {
    const agg = aggregateTonKhoPTByProduct([dong('1', '10', 5, 3)]);
    const out = themHangChuaPhatSinh(agg, [hang('10', 3), hang('11', 4), hang('12', null), hang('13', 0)], new Set(['10']));
    expect(out.map((x) => x.id_hang_hoa)).toEqual(['10', '11']);
    expect(out[1]).toMatchObject({ tong_so_luong: 0, by_kho: {}, rows: [], dinh_muc: 4 });
  });
});

describe('laHangDuoiDinhMuc', () => {
  it('kho dưới định mức hoặc âm → đỏ; đủ định mức → không', () => {
    const [ok, thieu, am] = [
      aggregateTonKhoPTByProduct([dong('1', '10', 5, 3), dong('2', '10', 3, 3)]),
      aggregateTonKhoPTByProduct([dong('1', '11', 5, 3), dong('2', '11', 0, 3)]),
      aggregateTonKhoPTByProduct([dong('1', '12', -1, null)]),
    ].map((a) => a[0]);
    expect(laHangDuoiDinhMuc(ok)).toBe(false);
    expect(laHangDuoiDinhMuc(thieu)).toBe(true);
    expect(laHangDuoiDinhMuc(am)).toBe(true);
  });

  it('hàng có định mức chưa từng nhập kho nào → đỏ', () => {
    const [chuaNhap] = themHangChuaPhatSinh([], [hang('11', 4)], new Set());
    expect(laHangDuoiDinhMuc(chuaNhap)).toBe(true);
  });
});
