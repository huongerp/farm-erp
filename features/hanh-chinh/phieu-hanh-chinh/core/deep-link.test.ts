import { describe, it, expect } from 'vitest';
import { chonTabChoPhieu } from './deep-link';

describe('chonTabChoPhieu', () => {
  it('phiếu của mình thì mở', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '41', currentUserId: '41', viewAll: false })).toEqual({
      tab: 'list',
    });
  });

  it('phiếu của mình vẫn mở khi có quyền quản lý', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '41', currentUserId: '41', viewAll: true })).toEqual({
      tab: 'list',
    });
  });

  it('phiếu người khác + có quyền quản lý thì mở', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '41', currentUserId: '18', viewAll: true })).toEqual({
      tab: 'list',
    });
  });

  it('phiếu người khác mà không có quyền thì không mở', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '41', currentUserId: '18', viewAll: false })).toEqual({
      tab: null,
      lyDo: 'khong_co_quyen',
    });
  });

  it('phiên chưa nạp xong (chưa có id người dùng) thì không nhận nhầm là phiếu của mình', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '', currentUserId: '', viewAll: false })).toEqual({
      tab: null,
      lyDo: 'khong_co_quyen',
    });
  });

  it('phiếu thiếu người tạo (cột null) thì không nhận nhầm là phiếu của mình', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '', currentUserId: '18', viewAll: false })).toEqual({
      tab: null,
      lyDo: 'khong_co_quyen',
    });
  });
});
