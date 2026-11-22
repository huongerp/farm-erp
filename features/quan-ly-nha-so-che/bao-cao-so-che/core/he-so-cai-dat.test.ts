import { describe, it, expect } from 'vitest';
import { heSoTheoCaiDat, type HeSoCaiDatRow } from './he-so-cai-dat';

const caiDat: HeSoCaiDatRow[] = [
  { id_chi_nhanh: '1', ten_pham_cap: 'Nải', he_so_quy_doi: 1 },
  { id_chi_nhanh: '1', ten_pham_cap: 'CP', he_so_quy_doi: '1.1' },
  { id_chi_nhanh: 2, ten_pham_cap: 'CP', he_so_quy_doi: 1.2 },
  { id_chi_nhanh: '2', ten_pham_cap: 'Nội địa 6kg', he_so_quy_doi: 0.5 },
];

describe('heSoTheoCaiDat', () => {
  it('khớp theo farm + tên phẩm cấp, bỏ qua hoa/thường và khoảng trắng đầu cuối', () => {
    expect(heSoTheoCaiDat(caiDat, '1', 'Nải')).toBe(1);
    expect(heSoTheoCaiDat(caiDat, '1', '  cp ')).toBe(1.1);
    expect(heSoTheoCaiDat(caiDat, '2', 'NỘI ĐỊA 6KG')).toBe(0.5);
  });

  it('id chi nhánh dạng số hay chuỗi đều khớp', () => {
    expect(heSoTheoCaiDat(caiDat, 2, 'CP')).toBe(1.2);
    expect(heSoTheoCaiDat(caiDat, '2', 'CP')).toBe(1.2);
  });

  it('cùng phẩm cấp nhưng khác farm thì lấy đúng hệ số của farm đó', () => {
    expect(heSoTheoCaiDat(caiDat, '1', 'CP')).toBe(1.1);
    expect(heSoTheoCaiDat(caiDat, '2', 'CP')).toBe(1.2);
  });

  it('chưa cài / thiếu farm / tên trống → null', () => {
    expect(heSoTheoCaiDat(caiDat, '1', 'CL')).toBeNull();
    expect(heSoTheoCaiDat(caiDat, '3', 'Nải')).toBeNull();
    expect(heSoTheoCaiDat(caiDat, null, 'Nải')).toBeNull();
    expect(heSoTheoCaiDat(caiDat, '1', '')).toBeNull();
    expect(heSoTheoCaiDat([], '1', 'Nải')).toBeNull();
  });
});
