import { describe, it, expect } from 'vitest';
import { nenGop, khoaGopToString, CUA_SO_GOP_MS } from './dedupe.ts';

const BAY_GIO = new Date('2026-09-18T10:00:00Z');

describe('nenGop', () => {
  it('chưa có dòng nào khớp thì tạo mới', () => {
    expect(nenGop(null, BAY_GIO)).toBe(false);
  });

  it('dòng cũ vừa cập nhật trong cửa sổ thì gộp', () => {
    expect(nenGop(new Date(BAY_GIO.getTime() - 30_000), BAY_GIO)).toBe(true);
  });

  it('quá cửa sổ thì tạo dòng mới', () => {
    expect(nenGop(new Date(BAY_GIO.getTime() - CUA_SO_GOP_MS - 1), BAY_GIO)).toBe(false);
  });

  it('đúng biên cửa sổ thì tạo dòng mới', () => {
    expect(nenGop(new Date(BAY_GIO.getTime() - CUA_SO_GOP_MS), BAY_GIO)).toBe(false);
  });

  it('sửa liên tiếp mỗi 30 giây vẫn gom vào một dòng vì mốc so là lần cập nhật gần nhất', () => {
    let moc = new Date(BAY_GIO.getTime());
    for (let i = 0; i < 5; i += 1) {
      const sau = new Date(moc.getTime() + 30_000);
      expect(nenGop(moc, sau)).toBe(true);
      moc = sau;
    }
  });

  it('đồng hồ lệch về quá khứ thì không gộp nhầm', () => {
    expect(nenGop(new Date(BAY_GIO.getTime() + 5_000), BAY_GIO)).toBe(false);
  });
});

describe('khoaGopToString', () => {
  it('phân biệt theo người nhận, bản ghi và loại sự kiện', () => {
    const goc = { nguoiNhanId: 1, bang: 'fp_mh_phieu_kho', banGhiId: 10, loaiSuKien: 'phieu.da_duyet' };
    expect(khoaGopToString(goc)).toBe('1|fp_mh_phieu_kho|10|phieu.da_duyet');
    expect(khoaGopToString({ ...goc, nguoiNhanId: 2 })).not.toBe(khoaGopToString(goc));
    expect(khoaGopToString({ ...goc, loaiSuKien: 'phieu.khong_duyet' })).not.toBe(khoaGopToString(goc));
  });
});
