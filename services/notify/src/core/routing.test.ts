import { describe, it, expect } from 'vitest';
import { dinhTuyen, giaiVaiTheoPayload, type NguoiDuyet } from './routing.ts';
import { MO_TA_BANG } from './mo-ta-bang.ts';
import type { DongOutbox, SuKienDaPhanTich } from './types.ts';

const MO_TA_PHIEU_KHO = MO_TA_BANG['fp_mh_phieu_kho']!;
const MO_TA_CONG_VIEC = MO_TA_BANG['fp_hc_cong_viec']!;
const MO_TA_DE_XUAT = MO_TA_BANG['fp_mh_phieu_de_xuat_vat_tu']!;

function dong(p: Partial<DongOutbox> = {}): DongOutbox {
  return {
    id: 1,
    module_id: 'kho-van/phieu-kho',
    bang: 'fp_mh_phieu_kho',
    ban_ghi_id: 10,
    thao_tac: 'UPDATE',
    trang_thai_cu: 'Chờ duyệt',
    trang_thai_moi: 'Đã duyệt',
    actor_id: null,
    payload: {},
    payload_cu: null,
    ...p,
  };
}

function suKien(p: Partial<SuKienDaPhanTich> = {}): SuKienDaPhanTich {
  return { loai: 'phieu.da_duyet', muc: 'thuong', vai: ['nguoi_tao'], duLieu: {}, ...p };
}

const duyet = (id: number, capBac = 3): NguoiDuyet => ({ nhanVienId: id, capBac });

describe('giaiVaiTheoPayload — mỗi bảng gọi cột người tạo một kiểu', () => {
  it('phiếu kho dùng nguoi_tao_id', () => {
    const d = dong({ payload: { nguoi_tao_id: 5 } });
    expect(giaiVaiTheoPayload('nguoi_tao', MO_TA_PHIEU_KHO, d, suKien())).toEqual([5]);
  });

  it('phiếu đề xuất vật tư dùng id_nguoi_de_xuat', () => {
    const d = dong({ payload: { id_nguoi_de_xuat: 12 } });
    expect(giaiVaiTheoPayload('nguoi_tao', MO_TA_DE_XUAT, d, suKien())).toEqual([12]);
  });

  it('đơn đặt hàng dùng id_nguoi_dat', () => {
    const d = dong({ payload: { id_nguoi_dat: 4 } });
    expect(giaiVaiTheoPayload('nguoi_tao', MO_TA_BANG['fp_mh_don_dat_hang']!, d, suKien())).toEqual([4]);
  });

  it('id lưu dạng chuỗi vẫn đọc được — kiểu id_nguoi_duyet không đồng nhất giữa các module', () => {
    const d = dong({ payload: { id_nguoi_duyet: '77' } });
    expect(giaiVaiTheoPayload('nguoi_duyet', MO_TA_PHIEU_KHO, d, suKien())).toEqual([77]);
  });

  it('cột rỗng hoặc thiếu thì trả mảng rỗng, không trả NaN', () => {
    expect(giaiVaiTheoPayload('nguoi_tao', MO_TA_PHIEU_KHO, dong({ payload: {} }), suKien())).toEqual([]);
    expect(
      giaiVaiTheoPayload('nguoi_tao', MO_TA_PHIEU_KHO, dong({ payload: { nguoi_tao_id: '' } }), suKien())
    ).toEqual([]);
  });

  it('người hỗ trợ đọc từ mảng, người hỗ trợ mới đọc từ dữ liệu sự kiện', () => {
    const d = dong({ bang: 'fp_hc_cong_viec', payload: { nguoi_ho_tro: [1, 2, 3] } });
    expect(giaiVaiTheoPayload('ho_tro', MO_TA_CONG_VIEC, d, suKien())).toEqual([1, 2, 3]);
    expect(
      giaiVaiTheoPayload('ho_tro_moi', MO_TA_CONG_VIEC, d, suKien({ duLieu: { hoTroMoi: [3] } }))
    ).toEqual([3]);
  });
});

describe('dinhTuyen — ba luật chống ồn', () => {
  it('không bao giờ gửi ngược cho người vừa gây ra sự kiện', () => {
    const d = dong({ actor_id: 5, payload: { nguoi_tao_id: 5 } });
    expect(dinhTuyen(d, suKien(), MO_TA_PHIEU_KHO, [])).toEqual([]);
  });

  it('người tự duyệt phiếu mình tạo chỉ nhận một lần, không nhận cả hai vai', () => {
    const d = dong({ actor_id: 9, payload: { nguoi_tao_id: 5, id_nguoi_duyet: 5 } });
    const kq = dinhTuyen(d, suKien({ vai: ['nguoi_tao', 'nguoi_duyet'] }), MO_TA_PHIEU_KHO, []);
    expect(kq).toHaveLength(1);
    expect(kq[0]!.id).toBe(5);
  });

  it('trúng nhiều vai vẫn chỉ ra một dòng', () => {
    const d = dong({
      bang: 'fp_hc_cong_viec',
      actor_id: 99,
      payload: { trach_nhiem: 4, nguoi_ho_tro: [4, 6], id_nguoi_giao: 4 },
    });
    const kq = dinhTuyen(
      d,
      suKien({ vai: ['nguoi_giao', 'trach_nhiem', 'ho_tro'] }),
      MO_TA_CONG_VIEC,
      []
    );
    expect(kq.map((x) => x.id).sort()).toEqual([4, 6]);
  });
});

describe('dinhTuyen — nhóm duyệt và cấp bậc 1', () => {
  it('gửi cho toàn bộ nhóm duyệt mà RPC trả về', () => {
    const kq = dinhTuyen(
      dong({ actor_id: 99 }),
      suKien({ loai: 'phieu.cho_duyet', vai: ['nhom_duyet'] }),
      MO_TA_PHIEU_KHO,
      [duyet(1), duyet(2)]
    );
    expect(kq.map((x) => x.id).sort()).toEqual([1, 2]);
  });

  it('cấp bậc 1 nhận ở mức im lặng khi sự kiện là mức thường', () => {
    const kq = dinhTuyen(
      dong({ actor_id: 99 }),
      suKien({ loai: 'phieu.cho_duyet', muc: 'thuong', vai: ['nhom_duyet'] }),
      MO_TA_PHIEU_KHO,
      [duyet(1, 3), duyet(2, 1)]
    );
    expect(kq.find((x) => x.id === 1)!.imLang).toBe(false);
    expect(kq.find((x) => x.id === 2)!.imLang).toBe(true);
  });

  it('sự kiện mức cao thì cấp bậc 1 vẫn được rung', () => {
    const kq = dinhTuyen(
      dong({ actor_id: 99 }),
      suKien({ loai: 'hanh_chinh.cho_duyet', muc: 'cao', vai: ['nhom_duyet'] }),
      MO_TA_PHIEU_KHO,
      [duyet(2, 1)]
    );
    expect(kq[0]!.imLang).toBe(false);
  });

  it('cấp bậc 1 đồng thời là người tạo phiếu thì không bị im lặng', () => {
    const d = dong({ actor_id: 99, payload: { nguoi_tao_id: 2 } });
    const kq = dinhTuyen(
      d,
      suKien({ muc: 'thuong', vai: ['nguoi_tao', 'nhom_duyet'] }),
      MO_TA_PHIEU_KHO,
      [duyet(2, 1)]
    );
    expect(kq.find((x) => x.id === 2)!.imLang).toBe(false);
  });

  it('người duyệt tự bấm duyệt thì bị loại khỏi danh sách nhận', () => {
    const kq = dinhTuyen(
      dong({ actor_id: 1 }),
      suKien({ loai: 'phieu.cho_duyet', vai: ['nhom_duyet'] }),
      MO_TA_PHIEU_KHO,
      [duyet(1), duyet(2)]
    );
    expect(kq.map((x) => x.id)).toEqual([2]);
  });

  it('nhóm duyệt rỗng — phiếu không ai duyệt được thì không sinh thông báo ma', () => {
    const kq = dinhTuyen(
      dong({ actor_id: 99 }),
      suKien({ loai: 'phieu.cho_duyet', vai: ['nhom_duyet'] }),
      MO_TA_PHIEU_KHO,
      []
    );
    expect(kq).toEqual([]);
  });
});

describe('phiếu hành chính — nhóm duyệt theo phòng ban của người tạo', () => {
  const MO_TA_HC = MO_TA_BANG['fp_hr_phieu_hanh_chinh']!;
  const hc = (p: Partial<DongOutbox> = {}) =>
    dong({ bang: 'fp_hr_phieu_hanh_chinh', module_id: MO_TA_HC.moduleId, ...p });

  it('cấu hình bật cờ tra theo phòng ban và khai đúng cột người tạo', () => {
    // Hợp đồng giữa MO_TA_BANG và worker: sai một trong hai thì worker lại gọi
    // nhánh chi nhánh cũ và quản lý phòng tiếp tục không nhận được gì.
    expect(MO_TA_HC.nhomDuyetTheoPhongBanNguoiTao).toBe(true);
    expect(MO_TA_HC.cotNguoiTao).toBe('nguoi_tao_id');
  });

  it('id người tạo rút từ payload chính là tham số worker đưa vào RPC', () => {
    // node-postgres trả bigint dạng chuỗi; vẫn phải ra số.
    const d = hc({ payload: { nguoi_tao_id: '41' } });
    expect(giaiVaiTheoPayload('nguoi_tao', MO_TA_HC, d, suKien())).toEqual([41]);
  });

  it('phiếu chờ duyệt mức cao: cả ba quản lý phòng lẫn cấp bậc 1 đều rung push', () => {
    const kq = dinhTuyen(
      hc({ actor_id: 41, payload: { nguoi_tao_id: 41 } }),
      suKien({ loai: 'hanh_chinh.cho_duyet', muc: 'cao', vai: ['nhom_duyet'] }),
      MO_TA_HC,
      [duyet(18), duyet(26), duyet(33), duyet(2, 2), duyet(1, 1)]
    );
    expect(kq.map((x) => x.id).sort((a, b) => a - b)).toEqual([1, 2, 18, 26, 33]);
    expect(kq.every((x) => !x.imLang)).toBe(true);
  });

  it('sự kiện mức thường: cấp bậc 1 chỉ vào chuông, quản lý phòng vẫn rung', () => {
    const kq = dinhTuyen(
      hc({ actor_id: 41, payload: { nguoi_tao_id: 41 } }),
      suKien({ loai: 'hanh_chinh.da_huy', muc: 'thuong', vai: ['nhom_duyet'] }),
      MO_TA_HC,
      [duyet(18), duyet(1, 1)]
    );
    expect(kq.find((x) => x.id === 1)!.imLang).toBe(true);
    expect(kq.find((x) => x.id === 18)!.imLang).toBe(false);
  });

  it('quản lý phòng tự nộp phiếu thì không tự báo cho mình', () => {
    const kq = dinhTuyen(
      hc({ actor_id: 18, payload: { nguoi_tao_id: 18 } }),
      suKien({ loai: 'hanh_chinh.cho_duyet', muc: 'cao', vai: ['nhom_duyet'] }),
      MO_TA_HC,
      [duyet(18), duyet(26), duyet(33)]
    );
    expect(kq.map((x) => x.id).sort((a, b) => a - b)).toEqual([26, 33]);
  });

  it('sửa sau duyệt: người tạo nhận, người đang sửa bị loại, mỗi người một dòng', () => {
    const kq = dinhTuyen(
      hc({ actor_id: 2, payload: { nguoi_tao_id: 41 } }),
      suKien({ loai: 'hanh_chinh.sua_sau_duyet', muc: 'cao', vai: ['nguoi_tao', 'nhom_duyet'] }),
      MO_TA_HC,
      [duyet(18), duyet(2, 2), duyet(41)]
    );
    expect(kq.map((x) => x.id).sort((a, b) => a - b)).toEqual([18, 41]);
    expect(kq.find((x) => x.id === 41)!.imLang).toBe(false);
  });

  it('phòng chưa có quản lý mà cũng chưa ai quản trị thì người tạo vẫn nhận', () => {
    const kq = dinhTuyen(
      hc({ actor_id: 7, payload: { nguoi_tao_id: 41 } }),
      suKien({ loai: 'hanh_chinh.sua_sau_duyet', muc: 'cao', vai: ['nguoi_tao', 'nhom_duyet'] }),
      MO_TA_HC,
      []
    );
    expect(kq.map((x) => x.id)).toEqual([41]);
  });
});
