import { describe, expect, it } from 'vitest';
import { dungLuoiKhoangNgay, taoMapMau } from '../core/bang-tinh';
import type { DgdvPhieuDayDu } from '../core/types';
import { taoAoaLuoi, type DgdvNhanXuat } from './xuat-luoi-aoa';

const NGAY = '2026-10-21';
const nhan: DgdvNhanXuat = {
  tieuDe: (cn) => `BANG ${cn}`,
  dongThongTin: (l) => `KSC ${l.ksc} · Tổng thu ${l.tongThu}`,
  lo: 'Lô',
  slBuong: 'SL',
  ghiChu: 'GC',
  soLuong: 'SL dây',
  danhGia: 'ĐG',
  slLoi: 'Lỗi',
  lyDoLoi: 'Lý do',
  tuan: (t) => `Tuần ${t.tuan}`,
  chuaCoTuan: '?',
  tongCong: 'Tổng',
  chuaCoToTruong: '—',
  dutDay: (n) => `đứt dây ${n}`,
};

const phieu: DgdvPhieuDayDu = {
  id: 'p1',
  nam: 2026,
  tuan: 43,
  id_chi_nhanh: '1',
  ten_chi_nhanh: 'FP5',
  ghi_chu: null,
  trang_thai: 'mo',
  id_nguoi_tao: null,
  tg_tao: '',
  tg_cap_nhat: '',
  cot: [
    { id: 'c1', id_phieu: 'p1', stt: 1, chich_bap_tu: null, chich_bap_den: null, thu_hoach_tu: '2026-10-19', thu_hoach_den: null, id_mau_1: 'm1', id_mau_2: null, xe_doi: false },
  ],
  lo: [
    {
      id: 'l1', id_phieu: 'p1', id_lo: 'x', to_truong: 'Anh A', ghi_chu: 'gc', stt: 1, ten_lo: 'Lô 1',
      lo_ngay: [{ id: 'n1', id_phieu_lo: 'l1', ngay: NGAY, dut_day: 2 }],
      dong: [
        { id: 'd1', id_phieu_lo: 'l1', id_cot: 'c1', ngay: NGAY, stt_dong: 1, so_luong: 10, danh_gia: 'Thiếu lá', so_luong_loi: 1, ly_do_loi: 'Chín bệnh' },
        { id: 'd2', id_phieu_lo: 'l1', id_cot: 'c1', ngay: NGAY, stt_dong: 2, so_luong: 5, danh_gia: null, so_luong_loi: 0, ly_do_loi: null },
      ],
    },
  ],
};

describe('xuất Excel Bảng đánh giá', () => {
  const mau = taoMapMau([{ id: 'm1', ten: 'Đỏ', ma_mau: '#E53935', thu_tu: 1, dang_dung: true, tg_tao: '', tg_cap_nhat: '' }]);
  const khoi = dungLuoiKhoangNgay([phieu], NGAY, '2026-10-22', mau, { nhanXeDoi: 'xé đôi' });

  it('một khối cho ngày có phiếu, ngày trống vẫn có khối nếu thuộc tuần phiếu', () => {
    const { aoa, soCot } = taoAoaLuoi(khoi, nhan);
    expect(soCot).toBe(7);
    expect(aoa[0][0]).toBe('BANG FP5');
    expect(aoa[1][0]).toBe('KSC 1 · Tổng thu 17');
    expect(aoa[2]).toEqual(['Lô', 'SL', 'Tuần 43', '', '', '', 'GC']);
    expect(aoa[3][2]).toBe('Đỏ');
    expect(aoa[4].slice(2, 6)).toEqual(['SL dây', 'ĐG', 'Lỗi', 'Lý do']);
    // tổ trưởng → lô (2 dòng) → tổng
    expect(aoa[5].slice(0, 3)).toEqual(['Anh A', 17, 15]);
    expect(aoa[6]).toEqual(['Lô 1 (đứt dây 2)', 17, 10, 'Thiếu lá', 1, 'Chín bệnh', 'gc']);
    expect(aoa[7]).toEqual(['', '', 5, '', '', '', '']);
    expect(aoa[8].slice(0, 3)).toEqual(['Tổng', 17, 15]);
    // khối ngày 22/10 sau một dòng trống
    expect(aoa[9]).toEqual([]);
    expect(aoa[10][0]).toBe('BANG FP5');
  });

  it('gộp ô: tiêu đề, cột cố định 3 dòng tiêu đề, ô lô nhiều dòng', () => {
    const { merges } = taoAoaLuoi(khoi.slice(0, 1), nhan);
    expect(merges).toContainEqual({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
    expect(merges).toContainEqual({ s: { r: 2, c: 0 }, e: { r: 4, c: 0 } });
    expect(merges).toContainEqual({ s: { r: 2, c: 2 }, e: { r: 2, c: 5 } });
    expect(merges).toContainEqual({ s: { r: 6, c: 0 }, e: { r: 7, c: 0 } });
    expect(merges).toContainEqual({ s: { r: 6, c: 6 }, e: { r: 7, c: 6 } });
  });
});
