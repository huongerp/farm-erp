import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import type { ChiTietPhieuKhoFlat, PhieuKho } from '../core/types';
import {
  getExportColumnsChiTietPhieuKho,
  getExportColumnsPhieuKhoList,
  mapChiTietPhieuKhoFlatRow,
  mapPhieuKhoListRow,
} from './export-phieu-kho-danh-sach';
import { COT_GIA_CHI_TIET, COT_GIA_DANH_SACH, locCotGia } from './loc-cot-gia';

const t = ((k: string) => k) as unknown as TFunction;
const keys = (cols: { key: string }[]) => cols.map((c) => c.key);

describe('xuất phiếu kho — ẩn giá nhập', () => {
  it('danh sách phiếu: không còn cột/khoá tong_tien khi không xem được giá', () => {
    expect(keys(getExportColumnsPhieuKhoList(t, false))).not.toContain('tong_tien');
    expect(keys(getExportColumnsPhieuKhoList(t, true))).toContain('tong_tien');
    const p = { id: '1', tong_tien: 500 } as PhieuKho;
    expect('tong_tien' in mapPhieuKhoListRow(p, false)).toBe(false);
    expect(mapPhieuKhoListRow(p, true).tong_tien).toBe(500);
  });

  it('chi tiết: không còn don_gia/thanh_tien khi không xem được giá, cột khác giữ nguyên', () => {
    const khongGia = keys(getExportColumnsChiTietPhieuKho(t, false));
    expect(khongGia).not.toContain('don_gia');
    expect(khongGia).not.toContain('thanh_tien');
    expect(khongGia).toContain('so_luong');
    expect(keys(getExportColumnsChiTietPhieuKho(t, true))).toEqual(expect.arrayContaining(['don_gia', 'thanh_tien']));
  });

  it('locCotGia: bỏ cột giá của bảng khi không xem được giá', () => {
    const cols = [{ id: 'so_phieu' }, { id: 'tong_tien' }, { id: 'don_gia' }, { id: 'thanh_tien' }];
    expect(locCotGia(cols, COT_GIA_DANH_SACH, false).map((c) => c.id)).toEqual(['so_phieu', 'don_gia', 'thanh_tien']);
    expect(locCotGia(cols, COT_GIA_CHI_TIET, false).map((c) => c.id)).toEqual(['so_phieu', 'tong_tien']);
    expect(locCotGia(cols, COT_GIA_CHI_TIET, true)).toBe(cols);
  });

  it('chi tiết: dòng map bỏ giá nhưng giữ số lượng', () => {
    const row = { id: '1', so_luong: 3, don_gia: 10, thanh_tien: 30 } as ChiTietPhieuKhoFlat;
    const out = mapChiTietPhieuKhoFlatRow(row, false);
    expect('don_gia' in out).toBe(false);
    expect('thanh_tien' in out).toBe(false);
    expect(out.so_luong).toBe(3);
    expect(mapChiTietPhieuKhoFlatRow(row, true).thanh_tien).toBe(30);
  });
});
