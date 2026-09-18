import { describe, it, expect } from 'vitest';
import { suaTrang, danhDauDaDoc, boKhoiDanhSach, giamDemTheoModule } from './cap-nhat-cache';
import type { ThongBao, TrangThongBao } from './types';

function tb(id: string, daDoc = false, moduleId = 'kho-van/phieu-kho'): ThongBao {
  return {
    id,
    moduleId,
    loaiSuKien: 'phieu.cho_duyet',
    muc: 'thuong',
    tieuDe: 'Phiếu ' + id,
    noiDung: null,
    link: null,
    daDoc,
    soLan: 1,
    tgTao: '2026-09-18T10:00:00Z',
  };
}

const trang = (items: ThongBao[], tong = items.length): TrangThongBao => ({ items, tong });

describe('suaTrang', () => {
  it('không chứa id thì trả nguyên trang, không báo bản ghi trước', () => {
    const t = trang([tb('1'), tb('2')]);
    const kq = suaTrang(t, '99', danhDauDaDoc);
    expect(kq.trang).toBe(t);
    expect(kq.truoc).toBeUndefined();
  });

  it('đánh dấu đã đọc đúng một dòng, giữ nguyên các dòng khác', () => {
    const kq = suaTrang(trang([tb('1'), tb('2')]), '1', danhDauDaDoc);
    expect(kq.trang.items.map((x) => [x.id, x.daDoc])).toEqual([['1', true], ['2', false]]);
    expect(kq.truoc?.daDoc).toBe(false);
  });

  it('đánh dấu đã đọc KHÔNG làm giảm tổng — dòng vẫn nằm trong danh sách', () => {
    const kq = suaTrang(trang([tb('1'), tb('2')], 25), '1', danhDauDaDoc);
    expect(kq.trang.tong).toBe(25);
  });

  it('xoá thì bỏ dòng khỏi danh sách và giảm tổng đúng một', () => {
    const kq = suaTrang(trang([tb('1'), tb('2')], 25), '1', boKhoiDanhSach);
    expect(kq.trang.items.map((x) => x.id)).toEqual(['2']);
    expect(kq.trang.tong).toBe(24);
  });

  it('tổng không bao giờ xuống dưới 0', () => {
    const kq = suaTrang(trang([tb('1')], 0), '1', boKhoiDanhSach);
    expect(kq.trang.tong).toBe(0);
  });

  it('trả lại bản ghi TRƯỚC khi sửa, để biết có cần giảm bộ đếm hay không', () => {
    const daDoc = suaTrang(trang([tb('1', true)]), '1', danhDauDaDoc);
    expect(daDoc.truoc?.daDoc).toBe(true);

    const chuaDoc = suaTrang(trang([tb('2', false)]), '2', danhDauDaDoc);
    expect(chuaDoc.truoc?.daDoc).toBe(false);
  });
});

describe('giamDemTheoModule', () => {
  it('giảm một đơn vị', () => {
    expect(giamDemTheoModule({ a: 3, b: 1 }, 'a')).toEqual({ a: 2, b: 1 });
  });

  it('về 0 thì bỏ hẳn khoá để chip/dropdown không hiện module rỗng', () => {
    expect(giamDemTheoModule({ a: 1, b: 2 }, 'a')).toEqual({ b: 2 });
  });

  it('module không có trong bộ đếm thì không tạo số âm', () => {
    expect(giamDemTheoModule({ b: 2 }, 'a')).toEqual({ b: 2 });
  });

  it('không sửa đối tượng gốc', () => {
    const goc = { a: 2 };
    giamDemTheoModule(goc, 'a');
    expect(goc).toEqual({ a: 2 });
  });
});
