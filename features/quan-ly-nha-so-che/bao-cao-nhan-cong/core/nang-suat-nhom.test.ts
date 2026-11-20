import { describe, expect, it } from 'vitest';
import { nangSuatNhom, tinhNangSuatChuyen, tyLeDatNs } from './nang-suat-nhom';
import type { NvFormRow } from './danh-sach-nv';

type Row = Pick<NvFormRow, 'ho_ten' | 'cham_cong' | 'so_gio_cong' | 'so_gio_tc'> & { so_nhom: number | null };
const nv = (ho_ten: string, so_nhom: number | null, patch: Partial<Row> = {}): Row => ({
  ho_ten,
  so_nhom,
  cham_cong: 'CA_NGAY',
  so_gio_cong: 7.5,
  so_gio_tc: 0,
  ...patch,
});

describe('nangSuatNhom / tyLeDatNs', () => {
  it('thùng ÷ giờ-người; tỷ lệ đạt = NS ÷ mục tiêu × 100', () => {
    const ns = nangSuatNhom(160, 52.5);
    expect(ns).toBeCloseTo(3.0476, 3);
    expect(tyLeDatNs(ns, 3)).toBeCloseTo(101.587, 2);
  });

  it('thiếu số thùng hoặc giờ = 0 → null', () => {
    expect(nangSuatNhom(null, 52.5)).toBeNull();
    expect(nangSuatNhom(100, 0)).toBeNull();
    expect(tyLeDatNs(null, 3)).toBeNull();
  });
});

describe('tinhNangSuatChuyen', () => {
  const nhanVien = [
    nv('An', 1, { so_gio_tc: 2 }), // giờ TC KHÔNG vào mẫu số
    nv('Bình', 1),
    nv('Chi', 1, { cham_cong: 'SANG', so_gio_cong: 3.75 }),
    nv('Dung', 1, { cham_cong: 'NGHI', so_gio_cong: 0 }),
    nv('Én', 2),
    nv('Phương', null),
  ];

  it('NS theo giờ công (không TC), bỏ nhóm null; nhóm chưa nhập số thùng không có NS', () => {
    const kq = tinhNangSuatChuyen({ loai_chuyen: 'TIA_DANH_GIA', nhanVien, soThungNhom: { '1': 60 } }, 3);
    expect(kq.map((g) => g.soNhom)).toEqual([1, 2]);

    const [n1, n2] = kq;
    expect(n1.soThung).toBe(60);
    expect(n1.gioCong).toBe(18.75);
    expect(n1.ns).toBeCloseTo(3.2, 6);
    expect(n1.tyLe).toBeCloseTo(106.667, 2);
    expect(n2).toMatchObject({ soThung: null, ns: null, tyLe: null });
  });
});
