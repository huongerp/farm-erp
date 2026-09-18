import { describe, expect, it } from 'vitest';

import { createListSearchMatcher } from './list-search-matcher';

interface Row {
  ma_nhan_vien: string;
  ho_ten: string;
  trang_thai: string;
  ngay_vao_lam: string;
  luong: number;
  ghi_chu: string | null;
  mat_khau_hash: string;
  anh_dai_dien: { url: string } | null;
}

const COLUMNS = [
  { id: 'ma_nhan_vien' },
  { id: 'ho_ten' },
  { id: 'trang_thai' },
  { id: 'ngay_vao_lam' },
  { id: 'luong' },
  { id: 'ghi_chu' },
  { id: 'mat_khau_hash' },
  { id: 'anh_dai_dien' },
  { id: 'actions' },
];

const row: Row = {
  ma_nhan_vien: 'NV42',
  ho_ten: 'Nguyễn Văn An',
  trang_thai: 'dang_lam',
  ngay_vao_lam: '2024-03-15',
  luong: 1250000,
  ghi_chu: 'Đội đóng thùng',
  mat_khau_hash: 'bcrypt$secret',
  anh_dai_dien: { url: 'https://x/y.png' },
};

const LABELS: Record<string, string> = { dang_lam: 'Đang làm việc' };
const match = createListSearchMatcher<Row>({
  columns: COLUMNS,
  getCellText: (colId, item) =>
    colId === 'trang_thai' ? (LABELS[item.trang_thai] ?? '') : '',
});

describe('createListSearchMatcher', () => {
  it('từ khoá rỗng khớp mọi dòng', () => {
    expect(match(row, '')).toBe(true);
    expect(match(row, '   ')).toBe(true);
  });

  it('tìm được cột không nằm trong danh sách liệt kê tay trước đây (ghi chú)', () => {
    expect(match(row, 'đóng thùng')).toBe(true);
  });

  it('gõ không dấu vẫn khớp', () => {
    expect(match(row, 'nguyen van an')).toBe(true);
    expect(match(row, 'doi dong thung')).toBe(true);
  });

  it('nhiều từ khoá có thể nằm ở các cột khác nhau', () => {
    expect(match(row, 'nv42 an')).toBe(true);
  });

  it('khớp số cả dạng thô lẫn dạng có phân tách nghìn', () => {
    expect(match(row, '1250000')).toBe(true);
    expect(match(row, '1.250.000')).toBe(true);
  });

  it('khớp ngày cả ISO lẫn dạng đang hiển thị', () => {
    expect(match(row, '2024-03-15')).toBe(true);
    expect(match(row, '15/03/2024')).toBe(true);
  });

  it('khớp nhãn hiển thị của enum, không chỉ giá trị thô', () => {
    expect(match(row, 'Đang làm việc')).toBe(true);
    expect(match(row, 'dang_lam')).toBe(true);
  });

  it('KHÔNG tìm trong cột nhạy cảm', () => {
    expect(match(row, 'bcrypt')).toBe(false);
  });

  it('bỏ qua giá trị object (ảnh, tệp)', () => {
    expect(match(row, 'y.png')).toBe(false);
  });

  it('thiếu một từ là không khớp', () => {
    expect(match(row, 'an ke toan')).toBe(false);
  });
});

describe('nhãn trạng thái tương đương', () => {
  interface Branch { ten_chi_nhanh: string; trang_thai: string }
  const matchBranch = createListSearchMatcher<Branch>({
    columns: [{ id: 'ten_chi_nhanh' }, { id: 'trang_thai' }],
  });
  const branch: Branch = { ten_chi_nhanh: 'Farm fp1', trang_thai: 'Đang dùng' };

  it('gõ chữ đang hiện trên badge ("hoạt động") vẫn ra bản ghi lưu "Đang dùng"', () => {
    expect(matchBranch(branch, 'hoat dong')).toBe(true);
    expect(matchBranch(branch, 'Hoạt động')).toBe(true);
  });

  it('vẫn khớp đúng giá trị lưu trong DB', () => {
    expect(matchBranch(branch, 'dang dung')).toBe(true);
  });

  it('bản ghi ngừng: khớp "ngừng", không khớp "đang hoạt động"', () => {
    const ngung = { ...branch, trang_thai: 'Ngừng' };
    expect(matchBranch(ngung, 'ngung')).toBe(true);
    expect(matchBranch(ngung, 'dang hoat dong')).toBe(false);
    expect(matchBranch(ngung, 'dang dung')).toBe(false);
  });
});
