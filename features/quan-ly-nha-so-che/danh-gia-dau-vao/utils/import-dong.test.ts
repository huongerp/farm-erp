import { describe, expect, it } from 'vitest';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import { parseDongImport, tuanThuHoachTheoNgay } from './import-dong';

const refs = {
  chiNhanh: [{ id: '1', ma: 'FP1', ten: 'Farm fp1' }],
  mau: [
    { id: '1', ten: 'Đen', ma_mau: '#000000' },
    { id: '6', ten: 'Xanh lá', ma_mau: '#43A047' },
  ],
};

describe('tuanThuHoachTheoNgay', () => {
  it('lấy năm farm theo ngày, lệch quá nửa năm thì sang năm kề', () => {
    expect(tuanThuHoachTheoNgay(42, '2026-10-19')).toEqual({ nam: 2026, tuan: 42 });
    expect(tuanThuHoachTheoNgay(52, '2027-01-06')).toEqual({ nam: 2026, tuan: 52 });
    expect(tuanThuHoachTheoNgay(1, '2026-12-23')).toEqual({ nam: 2027, tuan: 1 });
    // 28/12/2026 đã thuộc năm farm 2027 (tuần 1) — ISO thì vẫn là 53/2026
    expect(tuanThuHoachTheoNgay(1, '2026-12-28')).toEqual({ nam: 2027, tuan: 1 });
    expect(tuanThuHoachTheoNgay(52, '2026-12-28')).toEqual({ nam: 2026, tuan: 52 });
  });
});

describe('parseDongImport', () => {
  it('dòng dây hợp lệ: chi nhánh theo mã/tên, màu không phân biệt hoa thường, xé đôi «x», tuần thu hoạch', () => {
    const { dong, loi } = parseDongImport(
      [
        {
          [IMPORT_ROW_KEY]: 5,
          ngay: '19/10/2026',
          chi_nhanh: 'farm FP1',
          lo: ' A3-3 ',
          to_truong: 'A.Hâu',
          mau_1: 'xanh LÁ',
          mau_2: 'Đen',
          xe_doi: 'x',
          tuan_thu_hoach: 'Tuần 42',
          so_luong: '10',
          danh_gia: 'Thiếu lá',
          so_luong_loi: '',
          ly_do_loi: '',
        },
      ],
      refs
    );
    expect(loi).toEqual([]);
    expect(dong).toEqual([
      {
        row: 5,
        ngay: '2026-10-19',
        chuyen: 1,
        id_chi_nhanh: 1,
        ten_lo: 'A3-3',
        to_truong: 'A.Hâu',
        id_mau_1: 6,
        id_mau_2: 1,
        xe_doi: true,
        th_nam: 2026,
        th_tuan: 42,
        so_luong: 10,
        danh_gia: 'Thiếu lá',
        so_luong_loi: 0,
        ly_do_loi: null,
      },
    ]);
  });

  it('đứt dây: bỏ màu 2 / đánh giá / lỗi; tuần thu hoạch trống = tuần của ngày', () => {
    const { dong } = parseDongImport(
      [{ ngay: '2026-10-20', chi_nhanh: 'FP1', lo: 'A3-3', mau_1: 'đứt dây', mau_2: 'Đen', so_luong: 9, danh_gia: 'x', so_luong_loi: 3 }],
      refs
    );
    expect(dong[0]).toMatchObject({ id_mau_1: null, id_mau_2: null, so_luong: 9, danh_gia: null, so_luong_loi: 0, th_tuan: 43, row: 2 });
  });

  it('cột chuyến: trống = 1, số nguyên ≥ 1; 0 / số lẻ / chữ là lỗi', () => {
    const dongMau = { ngay: '2026-10-20', chi_nhanh: 'FP1', lo: 'A1', mau_1: 'Đen', so_luong: 5 };
    const { dong, loi } = parseDongImport(
      [
        { ...dongMau, chuyen: '' },
        { ...dongMau, chuyen: '3' },
        { ...dongMau, chuyen: 0 },
        { ...dongMau, chuyen: '1.5' },
        { ...dongMau, chuyen: 'hai' },
      ],
      refs
    );
    expect(dong.map((d) => [d.row, d.chuyen])).toEqual([
      [2, 1],
      [3, 3],
    ]);
    expect(loi.map((l) => l.row)).toEqual([4, 5, 6]);
  });

  it('gom lỗi theo dòng, loại dòng lỗi; import trong phiếu chặn ngày / chuyến khác phiếu', () => {
    const { dong, loi } = parseDongImport(
      [
        { ngay: '31/02/2026', chi_nhanh: 'XX', lo: '', mau_1: 'Hồng', so_luong: 0 },
        { ngay: '2026-10-19', lo: 'A1', mau_1: 'Đen', mau_2: 'đen', so_luong: 5, so_luong_loi: 7 },
        { ngay: '2026-10-20', lo: 'A1', mau_1: 'Đen', so_luong: 5 },
        { ngay: '2026-10-19', chuyen: 1, lo: 'A1', mau_1: 'Đen', so_luong: 5 },
      ],
      refs,
      { ngay: '2026-10-19', chuyen: 2, id_chi_nhanh: '1' }
    );
    expect(dong).toEqual([]);
    expect(loi.map((l) => l.row)).toEqual([2, 3, 4, 5]);
    expect(loi[0].msg.split('; ').length).toBeGreaterThanOrEqual(4);
    expect(loi[1].msg.split('; ')).toHaveLength(2);
    expect(loi[2].msg).not.toBe('');
    expect(loi[3].msg).not.toBe('');
  });

  it('import trong phiếu: chuyến trống = chuyến của phiếu', () => {
    const { dong, loi } = parseDongImport(
      [{ ngay: '19/10/2026', lo: 'A1', mau_1: 'Đen', so_luong: 5 }],
      refs,
      { ngay: '2026-10-19', chuyen: 2, id_chi_nhanh: '1' }
    );
    expect(loi).toEqual([]);
    expect(dong[0]).toMatchObject({ ngay: '2026-10-19', chuyen: 2, id_chi_nhanh: 1 });
  });
});
