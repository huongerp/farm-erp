import { describe, expect, it } from 'vitest';
import {
  chiaLo,
  chuanHoaTenTab,
  cotChu,
  dinhDangSoSheet,
  GIOI_HAN,
  kiemTraYeuCauXuat,
  soKhopHeader,
  vungA1,
} from './bang-tinh.ts';

describe('cotChu / vungA1', () => {
  it('đổi số cột sang chữ', () => {
    expect([1, 26, 27, 52, 53, 702, 703].map(cotChu)).toEqual(['A', 'Z', 'AA', 'AZ', 'BA', 'ZZ', 'AAA']);
  });

  it('bọc nháy tên tab và nhân đôi nháy đơn', () => {
    expect(vungA1("Báo cáo 'Q1'", 'A1:B2')).toBe("'Báo cáo ''Q1'''!A1:B2");
    expect(vungA1('Data')).toBe("'Data'");
  });
});

describe('chuanHoaTenTab / chiaLo', () => {
  it('bỏ ký tự điều khiển, chặn rỗng và quá dài', () => {
    expect(chuanHoaTenTab('  Tab\n1 ')).toBe('Tab1');
    expect(chuanHoaTenTab('   ')).toBeNull();
    expect(chuanHoaTenTab('x'.repeat(101))).toBeNull();
  });

  it('chia lô đúng kích thước, lô cuối lẻ', () => {
    expect(chiaLo([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chiaLo([], 2)).toEqual([]);
  });
});

describe('kiemTraYeuCauXuat', () => {
  const hopLe = {
    dich: { loai: 'moi', tenFile: 'Báo cáo', tenTab: 'Data' },
    cheDo: 'ghi_de',
    header: ['ID', 'Ngày'],
    rows: [[1, 46299], ['a', '']],
    mauSo: [null, 'date', 'rác'],
  };

  it('chấp nhận yêu cầu hợp lệ và lọc mẫu số lạ', () => {
    const kq = kiemTraYeuCauXuat(hopLe);
    expect('ok' in kq && kq.ok.mauSo).toEqual([null, 'date']);
  });

  it('từ chối ô object / NaN / Infinity', () => {
    for (const o of [{}, NaN, Infinity, null]) {
      const kq = kiemTraYeuCauXuat({ ...hopLe, rows: [[1, o]] });
      expect('loi' in kq).toBe(true);
    }
  });

  it('từ chối dòng lệch số cột', () => {
    expect('loi' in kiemTraYeuCauXuat({ ...hopLe, rows: [[1]] })).toBe(true);
  });

  it('từ chối vượt giới hạn dòng', () => {
    const rows = Array.from({ length: GIOI_HAN.soDong + 1 }, () => [1, 2]);
    const kq = kiemTraYeuCauXuat({ ...hopLe, rows });
    expect('loi' in kq && kq.loi).toMatch(/Tối đa/);
  });

  it('file có sẵn phải có spreadsheetId đúng dạng', () => {
    const sai = kiemTraYeuCauXuat({ ...hopLe, dich: { loai: 'co_san', spreadsheetId: '../x', tenTab: 'A' } });
    expect('loi' in sai).toBe(true);
    const dung = kiemTraYeuCauXuat({
      ...hopLe,
      dich: { loai: 'co_san', spreadsheetId: '1AbCdEfGhIjKlMnOpQrStUvWxYz_-0123456789', tenTab: 'A' },
    });
    expect('ok' in dung).toBe(true);
  });

  it('thiếu đích / chế độ ghi', () => {
    expect('loi' in kiemTraYeuCauXuat({ ...hopLe, dich: undefined })).toBe(true);
    expect('loi' in kiemTraYeuCauXuat({ ...hopLe, cheDo: 'xoa' })).toBe(true);
  });
});

describe('soKhopHeader', () => {
  it('tab trống → null', () => {
    expect(soKhopHeader([], ['A'])).toBeNull();
    expect(soKhopHeader(['', ''], ['A'])).toBeNull();
  });

  it('khớp hoàn toàn → null (bỏ qua ô trống cuối)', () => {
    expect(soKhopHeader(['A', 'B', ''], ['A', 'B'])).toBeNull();
  });

  it('báo cột thiếu / thừa', () => {
    expect(soKhopHeader(['A', 'C'], ['A', 'B'])).toEqual({ thieu: ['B'], thua: ['C'], doiThuTu: false });
  });

  it('báo đổi thứ tự khi cùng tập cột', () => {
    expect(soKhopHeader(['B', 'A'], ['A', 'B'])).toEqual({ thieu: [], thua: [], doiThuTu: true });
  });
});

describe('dinhDangSoSheet', () => {
  it('ngày có mẫu, số thường để Google tự hiển thị', () => {
    expect(dinhDangSoSheet('date')).toEqual({ type: 'DATE', pattern: 'dd/mm/yyyy' });
    expect(dinhDangSoSheet('number')).toBeNull();
  });
});
