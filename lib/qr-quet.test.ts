import { describe, expect, it } from 'vitest';
import { taoBoLocQuetTrung } from './qr-quet';

describe('bộ lọc quét trùng', () => {
  it('giữ camera trên một tem chỉ tính 1 thùng — kể cả khi máy quét khựng giữa chừng', () => {
    const loc = taoBoLocQuetTrung();
    let dem = 0;
    const thay = (t: number) => loc.thay('TP-TQ401', t) && dem++;
    for (let t = 0; t <= 3000; t += 125) thay(t);
    expect(dem).toBe(1);
    // Khựng 1,5 giây không đọc khung nào, tem vẫn trong khung → không tính thêm
    thay(4500);
    expect(dem).toBe(1);
  });

  it('rời tem đủ lâu (khung trống) rồi quét thùng kế cùng mã → tính thùng mới', () => {
    const loc = taoBoLocQuetTrung(500);
    let dem = 0;
    if (loc.thay('TP-TQ401', 0)) dem++;
    loc.trong(200);
    loc.trong(400);
    if (loc.thay('TP-TQ401', 500)) dem++; // mới trống 300ms: rung tay, vẫn thùng cũ
    expect(dem).toBe(1);
    for (let t = 600; t <= 1300; t += 125) loc.trong(t);
    if (loc.thay('TP-TQ401', 1400)) dem++;
    expect(dem).toBe(2);
  });

  it('mã khác luôn tính; đặt lại thì lần kế tiếp được tính', () => {
    const loc = taoBoLocQuetTrung();
    expect(loc.thay('TP-TQ401', 0)).toBe(true);
    expect(loc.thay('TP-TQ402', 100)).toBe(true);
    expect(loc.thay('TP-TQ401', 200)).toBe(true);
    expect(loc.thay('TP-TQ401', 300)).toBe(false);
    loc.datLai();
    expect(loc.thay('TP-TQ401', 400)).toBe(true);
  });
});
