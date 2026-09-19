import { describe, it, expect } from 'vitest';
import { phanTichSuKien } from './su-kien.ts';
import type { DongOutbox } from './types.ts';

function dong(p: Partial<DongOutbox>): DongOutbox {
  return {
    id: 1,
    module_id: 'kho-van/phieu-kho',
    bang: 'fp_mh_phieu_kho',
    ban_ghi_id: 10,
    thao_tac: 'UPDATE',
    trang_thai_cu: null,
    trang_thai_moi: null,
    actor_id: 99,
    payload: {},
    payload_cu: null,
    ...p,
  };
}

describe('phiếu có luồng duyệt', () => {
  it('phiếu mới ở Chờ duyệt thì báo cho nhóm duyệt', () => {
    const kq = phanTichSuKien(dong({ thao_tac: 'INSERT', trang_thai_moi: 'Chờ duyệt' }));
    expect(kq).toHaveLength(1);
    expect(kq[0]!.loai).toBe('phieu.cho_duyet');
    expect(kq[0]!.vai).toEqual(['nhom_duyet']);
  });

  it('phiếu mới ở trạng thái khác Chờ duyệt thì không báo', () => {
    expect(phanTichSuKien(dong({ thao_tac: 'INSERT', trang_thai_moi: 'Đã duyệt' }))).toEqual([]);
  });

  it('duyệt phiếu thì báo cho người tạo, mức thường', () => {
    const kq = phanTichSuKien(dong({ trang_thai_cu: 'Chờ duyệt', trang_thai_moi: 'Đã duyệt' }));
    expect(kq[0]!.loai).toBe('phieu.da_duyet');
    expect(kq[0]!.vai).toEqual(['nguoi_tao']);
    expect(kq[0]!.muc).toBe('thuong');
  });

  it('không duyệt thì báo mức cao và mang theo lý do', () => {
    const kq = phanTichSuKien(
      dong({ trang_thai_cu: 'Chờ duyệt', trang_thai_moi: 'Không duyệt', payload: { ghi_chu: 'Thiếu chứng từ' } })
    );
    expect(kq[0]!.loai).toBe('phieu.khong_duyet');
    expect(kq[0]!.muc).toBe('cao');
    expect(kq[0]!.duLieu['lyDo']).toBe('Thiếu chứng từ');
  });

  it('chuyển sang Đợi duyệt thì báo cả người tạo lẫn nhóm duyệt tầng sau', () => {
    const kq = phanTichSuKien(dong({ trang_thai_cu: 'Chờ duyệt', trang_thai_moi: 'Đợi duyệt' }));
    expect(kq[0]!.vai).toEqual(['nguoi_tao', 'nhom_duyet']);
  });

  it('trạng thái không đổi thì không sinh sự kiện đổi trạng thái', () => {
    const kq = phanTichSuKien(dong({ trang_thai_cu: 'Chờ duyệt', trang_thai_moi: 'Chờ duyệt' }));
    expect(kq).toEqual([]);
  });

  it('sửa nội dung phiếu đang ở Đã duyệt thì báo mức cao cho người duyệt và người tạo', () => {
    const kq = phanTichSuKien(dong({ trang_thai_cu: 'Đã duyệt', trang_thai_moi: 'Đã duyệt' }));
    expect(kq[0]!.loai).toBe('phieu.sua_sau_duyet');
    expect(kq[0]!.muc).toBe('cao');
    expect(kq[0]!.vai).toEqual(['nguoi_tao', 'nguoi_duyet']);
  });

  it('áp dụng cho cả ba bảng phiếu duyệt còn lại', () => {
    for (const bang of [
      'fp_mh_phieu_de_xuat_vat_tu',
      'fp_farm_de_xuat_mua_hang',
      'fp_farm_phieu_kho_phan_thuoc',
    ]) {
      const kq = phanTichSuKien(dong({ bang, trang_thai_cu: 'Chờ duyệt', trang_thai_moi: 'Đã duyệt' }));
      expect(kq[0]!.loai).toBe('phieu.da_duyet');
    }
  });
});

describe('công việc', () => {
  const cv = (p: Partial<DongOutbox>) => dong({ bang: 'fp_hc_cong_viec', ...p });

  it('tạo công việc có người chịu trách nhiệm thì báo mức cao', () => {
    const kq = phanTichSuKien(cv({ thao_tac: 'INSERT', payload: { trach_nhiem: 7 } }));
    expect(kq[0]!.loai).toBe('cong_viec.duoc_giao');
    expect(kq[0]!.muc).toBe('cao');
  });

  it('đổi người chịu trách nhiệm thì báo cho người mới', () => {
    const kq = phanTichSuKien(
      cv({ payload_cu: { trach_nhiem: 3 }, payload: { trach_nhiem: 8 } })
    );
    expect(kq.map((s) => s.loai)).toContain('cong_viec.duoc_giao');
  });

  it('giữ nguyên người chịu trách nhiệm thì không báo lại', () => {
    const kq = phanTichSuKien(
      cv({ payload_cu: { trach_nhiem: 3, mo_ta: 'a' }, payload: { trach_nhiem: 3, mo_ta: 'b' } })
    );
    expect(kq.map((s) => s.loai)).not.toContain('cong_viec.duoc_giao');
  });

  it('chỉ báo cho người VỪA được thêm vào hỗ trợ', () => {
    const kq = phanTichSuKien(
      cv({ payload_cu: { nguoi_ho_tro: [1, 2] }, payload: { nguoi_ho_tro: [1, 2, 5] } })
    );
    const sk = kq.find((s) => s.loai === 'cong_viec.them_ho_tro');
    expect(sk!.duLieu['hoTroMoi']).toEqual([5]);
  });

  it('bớt người hỗ trợ thì không sinh thông báo thêm hỗ trợ', () => {
    const kq = phanTichSuKien(
      cv({ payload_cu: { nguoi_ho_tro: [1, 2, 5] }, payload: { nguoi_ho_tro: [1] } })
    );
    expect(kq.map((s) => s.loai)).not.toContain('cong_viec.them_ho_tro');
  });

  it('trao đổi dài thêm thì báo cho cả nhóm kèm trích nội dung', () => {
    const kq = phanTichSuKien(
      cv({
        payload_cu: { trao_doi: [{ noi_dung: 'cũ' }] },
        payload: { trao_doi: [{ noi_dung: 'cũ' }, { noi_dung: 'mới' }] },
      })
    );
    const sk = kq.find((s) => s.loai === 'cong_viec.trao_doi_moi');
    expect(sk!.vai).toEqual(['nguoi_giao', 'trach_nhiem', 'ho_tro']);
    expect(sk!.duLieu['noiDungTraoDoi']).toBe('mới');
  });

  it('chuyển sang chờ báo cáo thì báo mức cao cho người giao', () => {
    const kq = phanTichSuKien(
      cv({ trang_thai_cu: 'dang_thuc_hien', trang_thai_moi: 'cho_bao_cao' })
    );
    const sk = kq.find((s) => s.loai === 'cong_viec.cho_bao_cao');
    expect(sk!.muc).toBe('cao');
    expect(sk!.vai).toEqual(['nguoi_giao']);
  });

  it('huỷ công việc thì báo cho người làm và người hỗ trợ', () => {
    const kq = phanTichSuKien(cv({ trang_thai_cu: 'dang_thuc_hien', trang_thai_moi: 'huy' }));
    const sk = kq.find((s) => s.loai === 'cong_viec.huy');
    expect(sk!.vai).toEqual(['trach_nhiem', 'ho_tro']);
  });

  it('một lần sửa đổi nhiều thứ thì sinh nhiều sự kiện', () => {
    const kq = phanTichSuKien(
      cv({
        payload_cu: { trach_nhiem: 1, nguoi_ho_tro: [], trao_doi: [] },
        payload: { trach_nhiem: 2, nguoi_ho_tro: [9], trao_doi: [{ noi_dung: 'x' }] },
      })
    );
    expect(kq.map((s) => s.loai).sort()).toEqual(
      ['cong_viec.duoc_giao', 'cong_viec.them_ho_tro', 'cong_viec.trao_doi_moi'].sort()
    );
  });
});

describe('phiếu hành chính — một cấp duyệt', () => {
  const hc = (p: Partial<DongOutbox>) => dong({ bang: 'fp_hr_phieu_hanh_chinh', ...p });

  it('phiếu mới thì báo mức cao cho người duyệt', () => {
    const kq = phanTichSuKien(hc({ thao_tac: 'INSERT', trang_thai_moi: 'Chờ duyệt' }));
    expect(kq[0]!.loai).toBe('hanh_chinh.cho_duyet');
    expect(kq[0]!.muc).toBe('cao');
  });

  it('duyệt và từ chối đều báo cho người tạo', () => {
    expect(
      phanTichSuKien(hc({ trang_thai_cu: 'Chờ duyệt', trang_thai_moi: 'Đã duyệt' }))[0]!.vai
    ).toEqual(['nguoi_tao']);
    expect(
      phanTichSuKien(hc({ trang_thai_cu: 'Chờ duyệt', trang_thai_moi: 'Từ chối' }))[0]!.vai
    ).toEqual(['nguoi_tao']);
  });

  it('huỷ phiếu thì báo cho người duyệt, mức thường', () => {
    const kq = phanTichSuKien(hc({ trang_thai_cu: 'Chờ duyệt', trang_thai_moi: 'Đã hủy' }));
    expect(kq[0]!.loai).toBe('hanh_chinh.da_huy');
    expect(kq[0]!.muc).toBe('thuong');
  });
});

describe('đơn đặt hàng', () => {
  const dh = (cu: string, moi: string) =>
    phanTichSuKien(dong({ bang: 'fp_mh_don_dat_hang', trang_thai_cu: cu, trang_thai_moi: moi }));

  it('báo đúng 5 mốc đáng quan tâm', () => {
    expect(dh('Nháp', 'Chờ duyệt')[0]!.loai).toBe('don_hang.cho_duyet');
    expect(dh('Đã gửi', 'Đã xác nhận')[0]!.loai).toBe('don_hang.da_xac_nhan');
    expect(dh('Đã xác nhận', 'Đang giao')[0]!.loai).toBe('don_hang.dang_giao');
    expect(dh('Đang giao', 'Đã nhận đủ')[0]!.loai).toBe('don_hang.da_nhan_du');
    expect(dh('Chờ duyệt', 'Hủy')[0]!.loai).toBe('don_hang.huy');
  });

  it('bỏ qua các mốc không ai phải hành động', () => {
    expect(dh('Chờ duyệt', 'Đã gửi')).toEqual([]);
    expect(dh('Đã nhận đủ', 'Đã đóng')).toEqual([]);
  });

  it('huỷ đơn là mức cao', () => {
    expect(dh('Đang giao', 'Hủy')[0]!.muc).toBe('cao');
  });
});

describe('sổ quỹ — khoá / xin mở khoá', () => {
  const quy = (cu: string | null, moi: string, payload: Record<string, unknown> = {}) =>
    phanTichSuKien(
      dong({
        bang: 'fp_tc_quy_thu_chi',
        module_id: 'tai-chinh/thu-chi-quy',
        trang_thai_cu: cu,
        trang_thai_moi: moi,
        payload,
      })
    );

  it('khoá phiếu là việc thường ngày, không báo cho ai', () => {
    expect(quy('mo', 'khoa')).toEqual([]);
  });

  it('xin mở khoá thì báo nhóm duyệt, mức cao, kèm lý do', () => {
    const kq = quy('khoa', 'cho_mo', { ly_do_yeu_cau_mo: 'Nhập nhầm số tiền' });
    expect(kq).toHaveLength(1);
    expect(kq[0]!.loai).toBe('quy.xin_mo_khoa');
    expect(kq[0]!.vai).toEqual(['nhom_duyet']);
    expect(kq[0]!.muc).toBe('cao');
    expect(kq[0]!.duLieu['lyDo']).toBe('Nhập nhầm số tiền');
  });

  it('duyệt mở (cho_mo → mo) báo cho đúng người đã xin, không phải người tạo', () => {
    const kq = quy('cho_mo', 'mo');
    expect(kq[0]!.loai).toBe('quy.duyet_mo_khoa');
    expect(kq[0]!.vai).toEqual(['nguoi_yeu_cau_mo']);
  });

  it('cấp cao mở thẳng phiếu khoá thì báo cho người tạo phiếu', () => {
    expect(quy('khoa', 'mo')[0]!.vai).toEqual(['nguoi_tao']);
  });

  it('từ chối (cho_mo → khoa) báo lại cho người xin', () => {
    const kq = quy('cho_mo', 'khoa');
    expect(kq[0]!.loai).toBe('quy.tu_choi_mo_khoa');
    expect(kq[0]!.vai).toEqual(['nguoi_yeu_cau_mo']);
  });

  it('trạng thái không đổi thì im lặng (import Excel, sửa nội dung)', () => {
    expect(quy('khoa', 'khoa')).toEqual([]);
    expect(phanTichSuKien(dong({ bang: 'fp_tc_quy_thu_chi', trang_thai_moi: null }))).toEqual([]);
  });
});

describe('bảng chưa đấu thông báo', () => {
  it('không sinh sự kiện nào', () => {
    expect(phanTichSuKien(dong({ bang: 'fp_hr_bang_luong', trang_thai_moi: 'x' }))).toEqual([]);
  });
});
