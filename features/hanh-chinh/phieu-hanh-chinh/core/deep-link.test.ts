import { describe, it, expect } from 'vitest';
import { chonTabChoPhieu } from './deep-link';

describe('chonTabChoPhieu', () => {
  it('phiếu của mình thì mở tab Của tôi', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '41', currentUserId: '41', viewAll: false })).toEqual({
      tab: 'my',
    });
  });

  it('phiếu của mình vẫn mở tab Của tôi dù có quyền quản lý', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '41', currentUserId: '41', viewAll: true })).toEqual({
      tab: 'my',
    });
  });

  it('phiếu người khác + có quyền quản lý thì mở tab Tôi quản lý', () => {
    expect(chonTabChoPhieu({ nguoiTaoId: '41', currentUserId: '18', viewAll: true })).toEqual({
      tab: 'managed',
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
