import { describe, it, expect } from 'vitest';
import {
  gomTonKhoPTTheoKy,
  laHangDuoiDinhMuc,
  themHangChuaPhatSinh,
  type GomTonKyOptions,
  type HangHoaDinhMucLite,
} from './ton-kho-theo-ky';
import type { TonKhoPTKyCell } from '../core/types';

const o = (id_kho: string, id_hang_hoa: string, p: Partial<TonKhoPTKyCell>): TonKhoPTKyCell => {
  const c = { ton_dau: 0, nhap: 0, xuat: 0, chuyen_den: 0, chuyen_di: 0, ...p };
  return { id_kho, id_hang_hoa, ...c, ton_cuoi: c.ton_dau + c.nhap - c.xuat + c.chuyen_den - c.chuyen_di };
};

const hang = (id: string, dinh_muc: number | null, danh_muc_id: string | null = null): HangHoaDinhMucLite => ({
  id,
  ma_hang_hoa: `H${id}`,
  ten_hang_hoa: `Hàng ${id}`,
  danh_muc_id,
  dvt: 'Bao',
  dinh_muc,
});

const opts = (hangs: HangHoaDinhMucLite[], extra: Partial<GomTonKyOptions> = {}): GomTonKyOptions => ({
  hangMap: Object.fromEntries(hangs.map((h) => [h.id, h])),
  khoMap: { 1: { id: '1', ma_kho: 'K1', ten_kho: 'Kho A' }, 2: { id: '2', ma_kho: 'K2', ten_kho: 'Kho B' } },
  ...extra,
});

const canDoi = (r: { ton_dau: number; nhap: number; xuat: number; chuyen: number; ton_cuoi: number }) =>
  r.ton_dau + r.nhap - r.xuat + r.chuyen === r.ton_cuoi;

describe('gomTonKhoPTTheoKy', () => {
  // Kho 1: đầu 20, nhập 5, xuất 3, chuyển đi 10 sang kho 2. Kho 2: đầu 1, nhận 10, xuất 2.
  const cells = [
    o('1', '10', { ton_dau: 20, nhap: 5, xuat: 3, chuyen_di: 10 }),
    o('2', '10', { ton_dau: 1, chuyen_den: 10, xuat: 2 }),
  ];

  it('xem mọi kho: chuyển nội bộ triệt tiêu, không làm phồng Nhập/Xuất, dòng cân', () => {
    const [r] = gomTonKhoPTTheoKy(cells, opts([hang('10', null)]));
    expect(r).toMatchObject({ ton_dau: 21, nhap: 5, xuat: 5, chuyen: 0, ton_cuoi: 21, so_kho_co_ton: 2 });
    expect(r.by_kho).toEqual({ 1: 12, 2: 9 });
    expect(canDoi(r)).toBe(true);
  });

  it('lọc một kho: hàng chuyển đến hiện ở cột Chuyển, dòng vẫn cân', () => {
    const [r] = gomTonKhoPTTheoKy(cells, opts([hang('10', null)], { khoIds: ['2'] }));
    expect(r).toMatchObject({ ton_dau: 1, nhap: 0, xuat: 2, chuyen: 10, ton_cuoi: 9 });
    expect(r.kho.map((k) => k.ten_kho)).toEqual(['Kho B']);
    expect(canDoi(r)).toBe(true);
  });

  it('lọc danh mục theo danh_muc_id của hàng', () => {
    const out = gomTonKhoPTTheoKy(
      [o('1', '10', { nhap: 1 }), o('1', '11', { nhap: 2 })],
      opts([hang('10', null, 'dm1'), hang('11', null, 'dm2')], { categoryIds: ['dm2'] })
    );
    expect(out.map((r) => r.id_hang_hoa)).toEqual(['11']);
  });

  it('ô toàn 0: giữ khi hàng có định mức (để báo đỏ), bỏ khi không có định mức', () => {
    const out = gomTonKhoPTTheoKy([o('1', '10', {}), o('1', '11', {})], opts([hang('10', 3), hang('11', null)]));
    expect(out.map((r) => r.id_hang_hoa)).toEqual(['10']);
    expect(laHangDuoiDinhMuc(out[0])).toBe(true);
  });
});

describe('themHangChuaPhatSinh', () => {
  it('chỉ thêm hàng có định mức > 0 và chưa có ô ở kho nào', () => {
    const agg = gomTonKhoPTTheoKy([o('1', '10', { nhap: 5 })], opts([hang('10', 3)]));
    const out = themHangChuaPhatSinh(agg, [hang('10', 3), hang('11', 4), hang('12', null), hang('13', 0)], new Set(['10']));
    expect(out.map((x) => x.id_hang_hoa)).toEqual(['10', '11']);
    expect(out[1]).toMatchObject({ ton_cuoi: 0, by_kho: {}, kho: [], dinh_muc: 4 });
  });
});

describe('laHangDuoiDinhMuc', () => {
  it('xét tồn cuối kỳ từng kho: dưới định mức hoặc âm → đỏ; đủ → không', () => {
    const h = [hang('10', 3), hang('11', 3), hang('12', null)];
    const out = gomTonKhoPTTheoKy(
      [
        o('1', '10', { nhap: 5 }),
        o('2', '10', { nhap: 3 }),
        o('1', '11', { nhap: 5 }),
        o('2', '11', { ton_dau: 4, xuat: 2 }),
        o('1', '12', { xuat: 1 }),
      ],
      opts(h)
    );
    const theoId = Object.fromEntries(out.map((r) => [r.id_hang_hoa, laHangDuoiDinhMuc(r)]));
    expect(theoId).toEqual({ 10: false, 11: true, 12: true });
  });

  it('hàng có định mức chưa từng nhập kho nào → đỏ', () => {
    const [chuaNhap] = themHangChuaPhatSinh([], [hang('11', 4)], new Set());
    expect(laHangDuoiDinhMuc(chuaNhap)).toBe(true);
  });
});
