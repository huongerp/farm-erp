import { describe, it, expect } from 'vitest';
import { chuanHoaDongOutbox } from './chuan-hoa.ts';
import { dinhTuyen } from './routing.ts';
import { MO_TA_BANG } from './mo-ta-bang.ts';
import type { SuKienDaPhanTich } from './types.ts';

/** Đúng hình dạng node-postgres trả về: bigint là chuỗi, jsonb là object. */
const DONG_THO: Record<string, unknown> = {
  id: '12',
  module_id: 'kho-van/phieu-kho',
  bang: 'fp_mh_phieu_kho',
  ban_ghi_id: '10341',
  thao_tac: 'UPDATE',
  trang_thai_cu: 'Chờ duyệt',
  trang_thai_moi: 'Đã duyệt',
  actor_id: '7',
  payload: { so_phieu: 'XK-6690', nguoi_tao_id: '3' },
  payload_cu: null,
};

describe('chuanHoaDongOutbox', () => {
  it('đổi bigint dạng chuỗi thành số', () => {
    const d = chuanHoaDongOutbox(DONG_THO);
    expect(d.id).toBe(12);
    expect(d.ban_ghi_id).toBe(10341);
    expect(d.actor_id).toBe(7);
  });

  it('actor_id NULL giữ nguyên null, không thành 0', () => {
    expect(chuanHoaDongOutbox({ ...DONG_THO, actor_id: null }).actor_id).toBeNull();
    expect(chuanHoaDongOutbox({ ...DONG_THO, actor_id: undefined }).actor_id).toBeNull();
  });

  it('thao_tac lạ thì coi là UPDATE', () => {
    expect(chuanHoaDongOutbox({ ...DONG_THO, thao_tac: 'DELETE' }).thao_tac).toBe('UPDATE');
    expect(chuanHoaDongOutbox({ ...DONG_THO, thao_tac: 'INSERT' }).thao_tac).toBe('INSERT');
  });

  it('payload thiếu thì thành object rỗng, không undefined', () => {
    const d = chuanHoaDongOutbox({ ...DONG_THO, payload: undefined });
    expect(d.payload).toEqual({});
  });
});

describe('sau khi chuẩn hoá, luật loại người thao tác mới hoạt động', () => {
  const suKien: SuKienDaPhanTich = {
    loai: 'phieu.cho_duyet',
    muc: 'thuong',
    vai: ['nhom_duyet'],
    duLieu: {},
  };
  const nhomDuyet = [
    { nhanVienId: 5, capBac: 3 },
    { nhanVienId: 7, capBac: 3 },
  ];

  it('người thao tác bị loại khỏi danh sách nhận', () => {
    const dong = chuanHoaDongOutbox(DONG_THO); // actor_id = '7' → 7
    const kq = dinhTuyen(dong, suKien, MO_TA_BANG['fp_mh_phieu_kho']!, nhomDuyet);
    expect(kq.map((x) => x.id)).toEqual([5]);
  });

  it('nếu KHÔNG chuẩn hoá thì actor lọt lưới — đây chính là lỗi đã gặp trên thật', () => {
    const dongChuaChuanHoa = { ...DONG_THO, actor_id: '7' } as unknown as Parameters<typeof dinhTuyen>[0];
    const kq = dinhTuyen(dongChuaChuanHoa, suKien, MO_TA_BANG['fp_mh_phieu_kho']!, nhomDuyet);
    expect(kq.map((x) => x.id).sort()).toEqual([5, 7]);
  });
});
