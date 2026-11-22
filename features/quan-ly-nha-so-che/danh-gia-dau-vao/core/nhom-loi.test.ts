import { describe, expect, it } from 'vitest';
import { tachLoi, tongHopNhomLoi, type DgdvLoiNgayRow } from './nhom-loi';
import type { VarDgdvLyDo, VarDgdvNhomLoi } from './types';

const nhom = (id: string, ten: string, thu_tu: number): VarDgdvNhomLoi => ({
  id,
  ten,
  ma_mau: '#000000',
  thu_tu,
  dang_dung: true,
  tg_tao: '',
  tg_cap_nhat: '',
});
const lyDo = (ten: string, loai: 'danh_gia' | 'loi', id_nhom_loi: string | null): VarDgdvLyDo => ({
  id: ten + loai,
  ten,
  loai,
  thu_tu: 0,
  la_loi: loai === 'danh_gia',
  id_nhom_loi,
  tg_tao: '',
  tg_cap_nhat: '',
});
const row = (loai: 'danh_gia' | 'huy', ten: string, so_buong: number, id_lo = '1'): DgdvLoiNgayRow => ({
  ngay: '2026-11-02',
  id_chi_nhanh: '1',
  id_lo,
  loai,
  ten,
  so_buong,
});

const DS_NHOM = [nhom('th', 'Thu hoạch', 1), nhom('csv', 'Chăm sóc vườn', 2), nhom('csb', 'Chăm sóc buồng', 3)];
const DS_LY_DO = [
  lyDo('Quá size', 'danh_gia', 'th'),
  lyDo('Rệp sáp', 'danh_gia', 'csv'),
  lyDo('Trầy khô', 'danh_gia', 'csb'),
  lyDo('Nấm xanh', 'danh_gia', null),
  lyDo('Rệp sáp nặng', 'loi', 'csv'),
];

describe('tachLoi', () => {
  it('tách theo dấu phẩy / chấm phẩy / cộng, bỏ số đi kèm, gọn khoảng trắng', () => {
    expect(tachLoi('Trầy khô 4,Nấm xanh 6')).toEqual(['Trầy khô', 'Nấm xanh']);
    expect(tachLoi('Rớt cap 3; Trầy tươi 1 + trầy khô2')).toEqual(['Rớt cap', 'Trầy tươi', 'trầy khô']);
    expect(tachLoi('Khác (Nhọn đầu, Không BB), Dame')).toEqual(['Khác (Nhọn đầu, Không BB)', 'Dame']);
    expect(tachLoi('  Rệp   sáp  ')).toEqual(['Rệp sáp']);
  });

  it('chuỗi rỗng / null → mảng rỗng', () => {
    expect(tachLoi(null)).toEqual([]);
    expect(tachLoi(' , ')).toEqual([]);
  });
});

describe('tongHopNhomLoi', () => {
  it('khớp tên không phân biệt hoa thường, tách cột đánh giá / huỷ, tính % trên tổng thu', () => {
    const kq = tongHopNhomLoi(
      [row('danh_gia', 'quá  SIZE', 10), row('danh_gia', 'Rệp sáp', 5), row('huy', 'Rệp sáp nặng', 2)],
      DS_LY_DO,
      DS_NHOM,
      100
    );
    const th = kq.dsNhom.find((n) => n.id === 'th')!;
    const csv = kq.dsNhom.find((n) => n.id === 'csv')!;
    expect(th.soDanhGia).toBe(10);
    expect(th.soHuy).toBe(0);
    expect(th.tiLeTrenThu).toBe(10);
    expect(csv.soDanhGia).toBe(5);
    expect(csv.soHuy).toBe(2);
    expect(csv.so).toBe(7);
    // % trong tổng lỗi: 7 / (10 + 7) × 100
    expect(csv.tiLeTrongTongLoi).toBeCloseTo((7 / 17) * 100);
    expect(kq.dsNhom.map((n) => n.id)).toEqual(['th', 'csv', 'csb']);
  });

  it('dòng ghép nhiều lỗi: số buồng tính đủ vào từng nhóm; lỗi chưa gán / không có trong danh mục → Chưa phân loại', () => {
    const kq = tongHopNhomLoi(
      [row('danh_gia', 'Trầy khô 4,Rệp sáp 6', 8), row('danh_gia', 'Nấm xanh', 3), row('danh_gia', 'Chuột phá', 1)],
      DS_LY_DO,
      DS_NHOM,
      50
    );
    expect(kq.dsNhom.find((n) => n.id === 'csb')!.soDanhGia).toBe(8);
    expect(kq.dsNhom.find((n) => n.id === 'csv')!.soDanhGia).toBe(8);
    expect(kq.chuaPhanLoai.soDanhGia).toBe(4);
    expect(kq.chuaPhanLoai.chiTiet.map((c) => c.ten).sort()).toEqual(['Chuột phá', 'Nấm xanh']);
  });

  it('tên chuẩn trong danh mục có dấu phẩy («Côn trùng, sâu bọ») là MỘT lỗi, không bị tách đôi', () => {
    const ds = [...DS_LY_DO, lyDo('Côn trùng, sâu bọ', 'danh_gia', 'csv'), lyDo('Thối trái, thối đầu trái', 'danh_gia', 'csb')];
    const kq = tongHopNhomLoi(
      [row('danh_gia', 'côn trùng,sâu bọ', 6), row('danh_gia', 'Quá size 2, Côn trùng, sâu bọ 1', 3), row('danh_gia', 'Thối trái, thối đầu trái', 2)],
      ds,
      DS_NHOM,
      100
    );
    expect(kq.dsNhom.find((n) => n.id === 'csv')!.soDanhGia).toBe(9);
    expect(kq.dsNhom.find((n) => n.id === 'th')!.soDanhGia).toBe(3);
    expect(kq.dsNhom.find((n) => n.id === 'csb')!.soDanhGia).toBe(2);
    expect(kq.chuaPhanLoai.so).toBe(0);
  });

  it('tên ghép CHƯA gán nhóm trong danh mục thì vẫn tách; khớp không phân biệt dấu và khoảng trắng quanh «-»', () => {
    const ds = [...DS_LY_DO, lyDo('Trầy khô 4,Rệp sáp 6', 'danh_gia', null), lyDo('4-5 nải', 'danh_gia', 'csv'), lyDo('Trầy tươi', 'danh_gia', 'th')];
    const kq = tongHopNhomLoi(
      [row('danh_gia', 'Trầy khô 4,Rệp sáp 6', 5), row('danh_gia', '4 - 5 nải', 2), row('danh_gia', 'trầy tuoi', 1)],
      ds,
      DS_NHOM,
      100
    );
    expect(kq.dsNhom.find((n) => n.id === 'csb')!.soDanhGia).toBe(5);
    expect(kq.dsNhom.find((n) => n.id === 'csv')!.soDanhGia).toBe(7);
    expect(kq.dsNhom.find((n) => n.id === 'th')!.soDanhGia).toBe(1);
    expect(kq.chuaPhanLoai.so).toBe(0);
  });

  it('lý do huỷ khớp danh mục loai khác khi cùng loai không có (Rệp sáp ở ô huỷ → nhóm của Rệp sáp đánh giá)', () => {
    const kq = tongHopNhomLoi([row('huy', 'Rệp sáp', 4)], DS_LY_DO, DS_NHOM, 10);
    expect(kq.dsNhom.find((n) => n.id === 'csv')!.soHuy).toBe(4);
  });

  it('tổng thu 0 → tỷ lệ null, không chia cho 0', () => {
    const kq = tongHopNhomLoi([], DS_LY_DO, DS_NHOM, 0);
    expect(kq.dsNhom.every((n) => n.tiLeTrenThu === null && n.tiLeTrongTongLoi === null)).toBe(true);
  });
});
