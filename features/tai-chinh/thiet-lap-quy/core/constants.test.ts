import { describe, it, expect } from 'vitest';
import { hangMucDungChoLoaiPhieu, loaiHangMucToI18nKey } from './constants';

describe('hangMucDungChoLoaiPhieu', () => {
  it('hạng mục ca_hai dùng được cho cả phiếu thu và phiếu chi', () => {
    expect(hangMucDungChoLoaiPhieu('ca_hai', 'thu')).toBe(true);
    expect(hangMucDungChoLoaiPhieu('ca_hai', 'chi')).toBe(true);
  });

  it('hạng mục thu chỉ dùng cho phiếu thu', () => {
    expect(hangMucDungChoLoaiPhieu('thu', 'thu')).toBe(true);
    expect(hangMucDungChoLoaiPhieu('thu', 'chi')).toBe(false);
  });

  it('hạng mục chi chỉ dùng cho phiếu chi', () => {
    expect(hangMucDungChoLoaiPhieu('chi', 'chi')).toBe(true);
    expect(hangMucDungChoLoaiPhieu('chi', 'thu')).toBe(false);
  });
});

describe('loaiHangMucToI18nKey', () => {
  it('trả key i18n theo namespace thietLapQuy', () => {
    expect(loaiHangMucToI18nKey('thu')).toBe('thietLapQuy.hangMuc.loai.thu');
    expect(loaiHangMucToI18nKey('ca_hai')).toBe('thietLapQuy.hangMuc.loai.ca_hai');
  });
});
