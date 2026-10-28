import { describe, expect, it } from 'vitest';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { DgdvPhieuDayDu, FarmDgdvCot } from '../core/types';
import { COT_IMPORT_DGDV, GIA_TRI_DUT_DAY, parseDongImport } from './import-dong';
import { dungDongXuatChiTiet, dungSheetXuatChiTiet, tenFileXuatChiTiet } from './export-chi-tiet';

const mau = [
  { id: '1', ten: 'Đen', ma_mau: '#000000' },
  { id: '6', ten: 'Xanh lá', ma_mau: '#43A047' },
  { id: '7', ten: 'Đỏ', ma_mau: '#E53935' },
];
const ref = {
  chiNhanh: (id: string) => (id === '1' ? 'FP1' : `#${id}`),
  mauTheoId: new Map(mau.map((m) => [m.id, m])),
};

const cot = (id: string, p: Partial<FarmDgdvCot>): FarmDgdvCot => ({
  id,
  id_phieu: 'p',
  stt: 1,
  th_nam: 2026,
  th_tuan: 44,
  chich_bap_tu: null,
  chich_bap_den: null,
  thu_hoach_tu: null,
  thu_hoach_den: null,
  id_mau_1: '6',
  id_mau_2: null,
  xe_doi: false,
  ...p,
});

const phieu = (p: Partial<DgdvPhieuDayDu>): DgdvPhieuDayDu => ({
  id: '1',
  ngay: '2026-10-26',
  chuyen: 1,
  nam: 2026,
  tuan: 44,
  id_chi_nhanh: '1',
  ten_chi_nhanh: 'Farm FP1',
  ghi_chu: null,
  trang_thai: 'mo',
  id_nguoi_tao: null,
  tg_tao: '',
  tg_cap_nhat: '',
  cot: [],
  lo: [],
  ...p,
});

const dong = (id: string, idLo: string, idCot: string, ngay: string, stt: number, so: number, extra: object = {}) => ({
  id,
  id_phieu_lo: idLo,
  id_cot: idCot,
  ngay,
  stt_dong: stt,
  so_luong: so,
  danh_gia: null,
  so_luong_loi: 0,
  ly_do_loi: null,
  ...extra,
});

// Chuyến 2 cùng ngày đứng sau chuyến 1; phiếu 04/01/2027 (tuần 2/2027) có dây thu hoạch tuần 52/2026.
const dsPhieu: DgdvPhieuDayDu[] = [
  phieu({
    id: '20',
    chuyen: 2,
    cot: [cot('c3', {})],
    lo: [{ id: 'l3', id_phieu: '20', id_lo: '9', ten_lo: 'B1', to_truong: null, ghi_chu: null, stt: 1, lo_ngay: [], dong: [dong('d5', 'l3', 'c3', '2026-10-26', 1, 25)] }],
  }),
  phieu({
    id: '10',
    cot: [cot('c1', { stt: 1, id_mau_2: '1' }), cot('c2', { stt: 2, id_mau_1: '7', xe_doi: true, th_tuan: 43 })],
    lo: [
      {
        id: 'l1',
        id_phieu: '10',
        id_lo: '5',
        ten_lo: 'A3-3',
        to_truong: 'A.Hâu',
        ghi_chu: null,
        stt: 1,
        lo_ngay: [{ id: 'n1', id_phieu_lo: 'l1', ngay: '2026-10-26', dut_day: 9 }],
        dong: [
          dong('d2', 'l1', 'c1', '2026-10-26', 2, 15, { danh_gia: 'Chín xanh', so_luong_loi: 2, ly_do_loi: 'Chín bệnh' }),
          dong('d1', 'l1', 'c1', '2026-10-26', 1, 10, { danh_gia: 'Thiếu lá' }),
          dong('d3', 'l1', 'c2', '2026-10-26', 1, 30),
        ],
      },
    ],
  }),
  phieu({
    id: '30',
    ngay: '2027-01-04',
    nam: 2027,
    tuan: 2,
    cot: [cot('c4', { th_nam: 2026, th_tuan: 52 })],
    lo: [{ id: 'l4', id_phieu: '30', id_lo: '5', ten_lo: 'A3-3', to_truong: 'A.Hâu', ghi_chu: null, stt: 1, lo_ngay: [], dong: [dong('d6', 'l4', 'c4', '2027-01-04', 1, 12)] }],
  }),
];

describe('dungDongXuatChiTiet', () => {
  const rows = dungDongXuatChiTiet(dsPhieu, ref);

  it('thứ tự phiếu ngày → chuyến; trong phiếu lô → dây → dòng, đứt dây cuối lô; ô đúng định dạng import', () => {
    expect(rows).toEqual([
      ['26/10/2026', 1, 'FP1', 'A3-3', 'A.Hâu', 'Xanh lá', 'Đen', '', 44, 10, 'Thiếu lá', '', ''],
      ['26/10/2026', 1, 'FP1', 'A3-3', 'A.Hâu', 'Xanh lá', 'Đen', '', 44, 15, 'Chín xanh', 2, 'Chín bệnh'],
      ['26/10/2026', 1, 'FP1', 'A3-3', 'A.Hâu', 'Đỏ', '', 'x', 43, 30, '', '', ''],
      ['26/10/2026', 1, 'FP1', 'A3-3', 'A.Hâu', GIA_TRI_DUT_DAY, '', '', '', 9, '', '', ''],
      ['26/10/2026', 2, 'FP1', 'B1', '', 'Xanh lá', '', '', 44, 25, '', '', ''],
      ['04/01/2027', 1, 'FP1', 'A3-3', 'A.Hâu', 'Xanh lá', '', '', 52, 12, '', '', ''],
    ]);
  });

  it('round-trip: import-dong đọc lại ra đúng dữ liệu của phiếu', () => {
    const banGhi = rows.map((r, i) => ({
      ...Object.fromEntries(COT_IMPORT_DGDV.map((k, j) => [k, r[j]])),
      [IMPORT_ROW_KEY]: i + 2,
    }));
    const { dong: kq, loi } = parseDongImport(banGhi, { chiNhanh: [{ id: '1', ma: 'FP1', ten: 'Farm FP1' }], mau });
    expect(loi).toEqual([]);
    const chung = { id_chi_nhanh: 1, to_truong: 'A.Hâu', ten_lo: 'A3-3', id_mau_2: null, xe_doi: false, danh_gia: null, so_luong_loi: 0, ly_do_loi: null };
    expect(kq).toEqual([
      { ...chung, row: 2, ngay: '2026-10-26', chuyen: 1, id_mau_1: 6, id_mau_2: 1, th_nam: 2026, th_tuan: 44, so_luong: 10, danh_gia: 'Thiếu lá' },
      { ...chung, row: 3, ngay: '2026-10-26', chuyen: 1, id_mau_1: 6, id_mau_2: 1, th_nam: 2026, th_tuan: 44, so_luong: 15, danh_gia: 'Chín xanh', so_luong_loi: 2, ly_do_loi: 'Chín bệnh' },
      { ...chung, row: 4, ngay: '2026-10-26', chuyen: 1, id_mau_1: 7, xe_doi: true, th_nam: 2026, th_tuan: 43, so_luong: 30 },
      // đứt dây: tuần thu hoạch không dùng — parser gán tuần của ngày
      { ...chung, row: 5, ngay: '2026-10-26', chuyen: 1, id_mau_1: null, th_nam: 2026, th_tuan: 44, so_luong: 9 },
      { ...chung, row: 6, ngay: '2026-10-26', chuyen: 2, ten_lo: 'B1', to_truong: null, id_mau_1: 6, th_nam: 2026, th_tuan: 44, so_luong: 25 },
      { ...chung, row: 7, ngay: '2027-01-04', chuyen: 1, id_mau_1: 6, th_nam: 2026, th_tuan: 52, so_luong: 12 },
    ]);
  });
});

describe('dungSheetXuatChiTiet / tenFileXuatChiTiet', () => {
  it('sheet đầu = tiêu đề import + dữ liệu, kèm Hướng dẫn và sheet tra cứu', () => {
    const columns = COT_IMPORT_DGDV.map((key) => ({ key, label: key }));
    const sheets = dungSheetXuatChiTiet({
      columns,
      referenceSheets: [{ name: 'Màu dây', headers: ['Tên'], data: [['Đen']] }],
      labels: {
        inputSheet: 'Nhập liệu',
        guideSheet: 'Hướng dẫn',
        exampleSheet: 'Ví dụ mẫu',
        guideColumn: 'Cột',
        guideRequired: 'Bắt buộc',
        guideRule: 'Quy tắc',
        guideExample: 'Ví dụ',
        yes: 'Có',
        no: 'Không',
        notes: [],
      },
      dong: [['26/10/2026', 1]],
    });
    expect(sheets.map((s) => s.name)).toEqual(['Nhập liệu', 'Hướng dẫn', 'Màu dây']);
    expect(sheets[0].rows).toEqual([[...COT_IMPORT_DGDV], ['26/10/2026', 1]]);
    expect(tenFileXuatChiTiet(dsPhieu)).toBe('danh-gia-dau-vao-chi-tiet-2026-10-26_2027-01-04');
    expect(tenFileXuatChiTiet([dsPhieu[0]])).toBe('danh-gia-dau-vao-chi-tiet-2026-10-26');
  });
});
