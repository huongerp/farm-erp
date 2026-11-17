import { describe, expect, it } from 'vitest';
import { nangSuatNhom, thuongNguoiTheoNhom, tinhNangSuatChuyen, tyLeDatNs } from './nang-suat-nhom';
import type { NvFormRow } from './danh-sach-nv';

const MUC = 10_714;

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

describe('thuongNguoiTheoNhom', () => {
  it('≥ 100% → đủ mức; nửa ngày ½; nghỉ 0', () => {
    expect(thuongNguoiTheoNhom(101.6, 'CA_NGAY', MUC)).toBe(10_714);
    expect(thuongNguoiTheoNhom(101.6, 'SANG', MUC)).toBe(5_357);
    expect(thuongNguoiTheoNhom(101.6, 'NGHI', MUC)).toBe(0);
  });

  it('85–100% → tỷ lệ × mức × công, làm tròn một lần; dưới 85% hoặc null = 0', () => {
    expect(thuongNguoiTheoNhom(90, 'CA_NGAY', MUC)).toBe(9_643);
    expect(thuongNguoiTheoNhom(90, 'CHIEU', MUC)).toBe(4_821);
    expect(thuongNguoiTheoNhom(85, 'CA_NGAY', MUC)).toBe(9_107);
    expect(thuongNguoiTheoNhom(84.9, 'CA_NGAY', MUC)).toBe(0);
    expect(thuongNguoiTheoNhom(null, 'CA_NGAY', MUC)).toBe(0);
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

  it('chuyền tỉa: NS theo giờ công (không TC), thưởng từng người theo công, bỏ nhóm null', () => {
    const kq = tinhNangSuatChuyen({ loai_chuyen: 'TIA_DANH_GIA', nhanVien, soThungNhom: { '1': 60 } }, 3, MUC);
    expect(kq.map((g) => g.soNhom)).toEqual([1, 2]);

    const [n1, n2] = kq;
    expect(n1.soThung).toBe(60);
    expect(n1.gioCong).toBe(18.75);
    expect(n1.ns).toBeCloseTo(3.2, 6);
    expect(n1.thuongCaNgay).toBe(10_714);
    expect(n1.nguoi.map((p) => [p.ho_ten, p.thuong])).toEqual([
      ['An', 10_714],
      ['Bình', 10_714],
      ['Chi', 5_357],
      ['Dung', 0],
    ]);
    expect(n1.tongThuong).toBe(26_785);

    // Nhóm 2 chưa nhập số thùng → không có NS, không thưởng
    expect(n2).toMatchObject({ soThung: null, ns: null, tyLe: null, thuongCaNgay: 0, tongThuong: 0 });
  });

  it('chuyền khác tỉa: có NS và tỷ lệ nhưng thưởng = 0', () => {
    const [n1] = tinhNangSuatChuyen({ loai_chuyen: 'CAN_TEM_DONG_THUNG', nhanVien, soThungNhom: { '1': 60 } }, 3, MUC);
    expect(n1.ns).toBeCloseTo(3.2, 6);
    expect(n1.tyLe).toBeCloseTo(106.667, 2);
    expect(n1.thuongCaNgay).toBe(0);
    expect(n1.tongThuong).toBe(0);
    expect(n1.nguoi.every((p) => p.thuong === 0)).toBe(true);
  });
});
