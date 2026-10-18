import { describe, expect, it } from 'vitest';
import { chonDiemNgatTrang } from './ngat-trang-pdf';

/** Dãy dòng bảng liên tiếp, mỗi dòng cao `h`, bắt đầu từ `tu`. */
const dong = (tu: number, so: number, h: number) =>
  Array.from({ length: so }, (_, i) => ({ top: tu + i * h, bottom: tu + (i + 1) * h }));

describe('chonDiemNgatTrang', () => {
  it('vừa một trang → một trang', () => {
    expect(chonDiemNgatTrang(900, 1000, dong(0, 9, 100))).toEqual([0, 900]);
  });

  it('sai số ≤ 1px không sinh trang trắng', () => {
    expect(chonDiemNgatTrang(1000.8, 1000, [])).toEqual([0, 1000.8]);
  });

  it('không cắt ngang dòng: lùi về mép trên dòng bị giới hạn trang cắt qua', () => {
    // Dòng cao 30 từ 0 → giới hạn 1000 rơi giữa dòng [990, 1020).
    expect(chonDiemNgatTrang(2000, 1000, dong(0, 67, 30))).toEqual([0, 990, 1980, 2000]);
  });

  it('giới hạn trùng mép dòng thì cắt đúng giới hạn', () => {
    expect(chonDiemNgatTrang(1500, 1000, dong(0, 15, 100))).toEqual([0, 1000, 1500]);
  });

  it('khối ô ký không bị tách: cả khối sang trang sau', () => {
    const khoi = [...dong(0, 8, 100), { top: 850, bottom: 1100 }];
    expect(chonDiemNgatTrang(1100, 1000, khoi)).toEqual([0, 850, 1100]);
  });

  it('khối cao hơn một trang bị bỏ qua, cắt tại giới hạn', () => {
    expect(chonDiemNgatTrang(2500, 1000, [{ top: 0, bottom: 2500 }])).toEqual([0, 1000, 2000, 2500]);
  });

  it('không lùi quá xa (trang còn dưới 40%) — chấp nhận cắt tại giới hạn', () => {
    // Khối [300, 1200) cao 900 < trang nhưng mép trên 300 ≤ sàn 400.
    expect(chonDiemNgatTrang(1500, 1000, [{ top: 300, bottom: 1200 }])).toEqual([0, 1000, 1500]);
  });

  it('khối lồng nhau: chọn mép không nằm trong khối nào', () => {
    // Dòng [950, 1050) nằm trong khối tổng + ký [900, 1150).
    const khoi = [...dong(0, 9, 100), { top: 900, bottom: 1150 }, { top: 950, bottom: 1050 }];
    expect(chonDiemNgatTrang(1150, 1000, khoi)).toEqual([0, 900, 1150]);
  });
});
