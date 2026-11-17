import { describe, expect, it } from 'vitest';
import { docSoNhom, tongHopTheoNhom } from './tong-hop-nhom';
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

describe('tongHopTheoNhom', () => {
  it('gom theo số nhóm tăng dần, «chưa chia nhóm» (null) xếp cuối, giữ thứ tự người trong nhóm', () => {
    const kq = tongHopTheoNhom([nv('An', 2), nv('Bình', null), nv('Chi', 1), nv('Dung', 2)]);
    expect(kq.map((g) => g.soNhom)).toEqual([1, 2, null]);
    expect(kq[1].nhanVien.map((r) => r.ho_ten)).toEqual(['An', 'Dung']);
  });

  it('cộng công quy đổi, giờ công, giờ TC; người nghỉ có trong nhóm nhưng không tính đi làm', () => {
    const [g] = tongHopTheoNhom([
      nv('An', 1),
      nv('Bình', 1, { cham_cong: 'SANG', so_gio_cong: 3.75, so_gio_tc: 1.5 }),
      nv('Chi', 1, { cham_cong: 'NGHI', so_gio_cong: 0 }),
    ]);
    expect(g).toMatchObject({ soNhom: 1, soNguoi: 3, soNguoiDiLam: 2, cong: 1.5, gioCong: 11.25, gioTc: 1.5 });
  });

  it('bỏ dòng chưa có tên; danh sách rỗng → mảng rỗng', () => {
    expect(tongHopTheoNhom([nv('  ', 1)])).toEqual([]);
    expect(tongHopTheoNhom([])).toEqual([]);
  });
});

describe('docSoNhom', () => {
  it('trống → null; số 1–9 (cả dạng chuỗi, «Nhóm 2») → số', () => {
    expect(docSoNhom('')).toBeNull();
    expect(docSoNhom(null)).toBeNull();
    expect(docSoNhom(undefined)).toBeNull();
    expect(docSoNhom(1)).toBe(1);
    expect(docSoNhom(' 9 ')).toBe(9);
    expect(docSoNhom('Nhóm 2')).toBe(2);
  });

  it('ngoài 1–9 hoặc không phải số nguyên → undefined (không hợp lệ)', () => {
    expect(docSoNhom(0)).toBeUndefined();
    expect(docSoNhom(10)).toBeUndefined();
    expect(docSoNhom(1.5)).toBeUndefined();
    expect(docSoNhom('abc')).toBeUndefined();
  });
});
