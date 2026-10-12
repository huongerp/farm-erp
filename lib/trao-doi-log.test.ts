import { describe, expect, it } from 'vitest';
import { chotTraoDoi, dongMoiTraoDoi, laThoiDiemIso, soanSanTraoDoi, tachTraoDoi, traoDoiKhiLuuLai } from './trao-doi-log';

describe('tachTraoDoi', () => {
  it('log rỗng → không có mục', () => {
    expect(tachTraoDoi(null)).toEqual([]);
    expect(tachTraoDoi('  \n\n ')).toEqual([]);
  });

  it('tin nhiều dòng thuộc trọn về mục có thời điểm phía trên', () => {
    const log = [
      '[2026-09-17T07:30:00.000Z] Chuyển tiến độ sang: Đã đặt hàng. Ghi chú: —',
      '[12/10/2026 14:30] Chị Hà: mua loại 70%,',
      'không lấy loại 50%',
      '',
    ].join('\n');
    expect(tachTraoDoi(log)).toEqual([
      { thoiDiem: '2026-09-17T07:30:00.000Z', noiDung: 'Chuyển tiến độ sang: Đã đặt hàng. Ghi chú: —' },
      { thoiDiem: '12/10/2026 14:30', noiDung: 'Chị Hà: mua loại 70%,\nkhông lấy loại 50%' },
    ]);
  });

  it('phần đầu không có thời điểm gom thành một mục; ngoặc vuông không phải ngày là nội dung', () => {
    expect(tachTraoDoi('Ghi chú tay\n[quan trọng] xem lại\n[1/2/2026] ok')).toEqual([
      { thoiDiem: null, noiDung: 'Ghi chú tay\n[quan trọng] xem lại' },
      { thoiDiem: '1/2/2026', noiDung: 'ok' },
    ]);
  });

  it('giữ mục chỉ có thời điểm (dòng tự thêm chưa gõ nội dung)', () => {
    expect(tachTraoDoi('[12/10/2026 14:30]')).toEqual([{ thoiDiem: '12/10/2026 14:30', noiDung: '' }]);
  });
});

describe('laThoiDiemIso', () => {
  it('phân biệt ISO với dd/mm/yyyy', () => {
    expect(laThoiDiemIso('2026-09-17T07:30:00.000Z')).toBe(true);
    expect(laThoiDiemIso('12/10/2026 14:30')).toBe(false);
  });
});

describe('soạn sẵn / chốt nội dung popup', () => {
  const dong = dongMoiTraoDoi('12/10/2026 14:30', 'Chị Hà');

  it('dòng mới có tên; thiếu tên chỉ còn thời điểm', () => {
    expect(dong).toBe('[12/10/2026 14:30] Chị Hà: ');
    expect(dongMoiTraoDoi('12/10/2026 14:30', '  ')).toBe('[12/10/2026 14:30] ');
  });

  it('điền sẵn = log cũ (bỏ khoảng trắng cuối) + dòng mới', () => {
    expect(soanSanTraoDoi('[1/10/2026 08:00] A: ok\n\n', dong)).toBe(`[1/10/2026 08:00] A: ok\n${dong}`);
    expect(soanSanTraoDoi(null, dong)).toBe(dong);
  });

  it('không gõ gì sau dòng tự thêm → giữ nguyên log cũ', () => {
    expect(chotTraoDoi(soanSanTraoDoi('[1/10/2026 08:00] A: ok', dong), dong)).toBe('[1/10/2026 08:00] A: ok');
  });

  it('gõ nhiều dòng → lưu cả', () => {
    expect(chotTraoDoi(`${dong}mua 70%\nkhông lấy 50%\n`, dong)).toBe(`${dong}mua 70%\nkhông lấy 50%`);
  });

  it('xoá hết → null', () => {
    expect(chotTraoDoi(soanSanTraoDoi(null, dong), dong)).toBeNull();
    expect(chotTraoDoi('   ', dong)).toBeNull();
  });
});

describe('traoDoiKhiLuuLai', () => {
  const dangLuu = new Map<string, string | null>([
    ['7', '[12/10/2026 14:30] Chị Hà: tin mới của cấp cao'],
    ['8', null],
  ]);

  it('dòng đã có: lấy bản trong DB, bỏ qua bản cũ trong form', () => {
    expect(traoDoiKhiLuuLai({ id_chi_tiet: '7', trao_doi: 'bản cũ lúc mở form' }, dangLuu)).toBe(
      '[12/10/2026 14:30] Chị Hà: tin mới của cấp cao'
    );
    expect(traoDoiKhiLuuLai({ id_chi_tiet: '8', trao_doi: 'cố ghi từ form' }, dangLuu)).toBeNull();
  });

  it('dòng mới / id không còn trong DB: dùng giá trị gửi lên', () => {
    expect(traoDoiKhiLuuLai({ trao_doi: '  ' }, dangLuu)).toBeNull();
    expect(traoDoiKhiLuuLai({ id_chi_tiet: '99', trao_doi: 'x' }, dangLuu)).toBe('x');
  });

  it('nối mục chuyển tiến độ vào cuối bản trong DB', () => {
    expect(traoDoiKhiLuuLai({ id_chi_tiet: '7', trao_doi_them: '[2026-10-12T08:00:00Z] Chuyển tiến độ' }, dangLuu)).toBe(
      '[12/10/2026 14:30] Chị Hà: tin mới của cấp cao\n[2026-10-12T08:00:00Z] Chuyển tiến độ'
    );
    expect(traoDoiKhiLuuLai({ id_chi_tiet: '8', trao_doi_them: 'a' }, dangLuu)).toBe('a');
  });
});
