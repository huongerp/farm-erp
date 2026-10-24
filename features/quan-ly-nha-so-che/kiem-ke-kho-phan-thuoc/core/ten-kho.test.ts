import { describe, expect, it } from 'vitest';
import { tomTatTenKho } from './ten-kho';

const kho = [
  { id: '1', ten_kho: 'Kho A' },
  { id: '2', ten_kho: 'Kho B' },
  { id: '3', ten_kho: 'Kho C' },
];

describe('tomTatTenKho', () => {
  it('ít kho thì liệt kê hết', () => {
    expect(tomTatTenKho(['1', '2'], kho)).toEqual({ ten: ['Kho A', 'Kho B'], conLai: 0 });
  });
  it('nhiều hơn mức tối đa thì gộp phần còn lại', () => {
    expect(tomTatTenKho(['1', '2', '3'], kho)).toEqual({ ten: ['Kho A', 'Kho B'], conLai: 1 });
  });
  it('id lạ bị bỏ qua, không hiện id thô; null/rỗng ra rỗng', () => {
    expect(tomTatTenKho(['9', '3'], kho)).toEqual({ ten: ['Kho C'], conLai: 0 });
    expect(tomTatTenKho(null, kho)).toEqual({ ten: [], conLai: 0 });
  });
});
