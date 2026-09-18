import { describe, expect, it } from 'vitest';

import { foldVi, matchesSearch } from './search-text';

describe('foldVi', () => {
  it('bỏ dấu và hạ chữ thường', () => {
    expect(foldVi('Nguyễn Văn An')).toBe('nguyen van an');
  });

  it('xử riêng đ/Đ vì không phải dấu tổ hợp', () => {
    expect(foldVi('Đội Đóng thùng')).toBe('Doi dong thung'.toLowerCase());
  });

  it('chuỗi rỗng / null trả về rỗng', () => {
    expect(foldVi(null)).toBe('');
    expect(foldVi(undefined)).toBe('');
  });
});

describe('matchesSearch', () => {
  it('gõ không dấu vẫn khớp dữ liệu có dấu', () => {
    expect(matchesSearch(['Nguyễn Văn An'], 'nguyen van an')).toBe(true);
  });

  it('các từ có thể nằm ở những trường khác nhau', () => {
    expect(matchesSearch(['Nguyễn Văn An', 'Phòng Kinh doanh'], 'an kinh doanh')).toBe(true);
  });

  it('thiếu một từ là không khớp', () => {
    expect(matchesSearch(['Nguyễn Văn An'], 'an ke toan')).toBe(false);
  });

  it('từ khoá rỗng khớp tất cả', () => {
    expect(matchesSearch(['bất kỳ'], '   ')).toBe(true);
  });
});
