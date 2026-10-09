import { describe, expect, it } from 'vitest';
import { kichThuocNen } from './nen-anh';

describe('kichThuocNen', () => {
  it('ảnh ngang: thu cạnh rộng về canhMax, giữ tỉ lệ', () => {
    expect(kichThuocNen(4000, 3000, 1600)).toEqual({ rong: 1600, cao: 1200 });
  });

  it('ảnh dọc: thu cạnh cao về canhMax', () => {
    expect(kichThuocNen(3024, 4032, 1600)).toEqual({ rong: 1200, cao: 1600 });
  });

  it('ảnh đã nhỏ hơn hoặc bằng canhMax → giữ nguyên', () => {
    expect(kichThuocNen(1200, 900, 1600)).toEqual({ rong: 1200, cao: 900 });
    expect(kichThuocNen(1600, 1600, 1600)).toEqual({ rong: 1600, cao: 1600 });
  });

  it('ảnh rất dẹt không về 0 px', () => {
    expect(kichThuocNen(10000, 2, 1600)).toEqual({ rong: 1600, cao: 1 });
  });
});
