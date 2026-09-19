import { describe, it, expect } from 'vitest';
import { soSanhCotPhieu } from './thay-doi-phieu.ts';
import type { DongOutbox } from './types.ts';

function dong(payload_cu: Record<string, unknown> | null, payload: Record<string, unknown>): DongOutbox {
  return {
    id: 1,
    module_id: 'mua-hang/phieu-de-xuat-vat-tu',
    bang: 'fp_mh_phieu_de_xuat_vat_tu',
    ban_ghi_id: 10,
    thao_tac: 'UPDATE',
    trang_thai_cu: 'Đã duyệt',
    trang_thai_moi: 'Đã duyệt',
    actor_id: 99,
    payload,
    payload_cu,
  };
}

describe('soSanhCotPhieu', () => {
  it('rút cột nghiệp vụ đã đổi kèm nhãn tiếng Việt và ngày dd/MM/yyyy', () => {
    const kq = soSanhCotPhieu(
      dong(
        { ngay_can: '2026-09-17', ghi_chu: null, tg_cap_nhat: '2026-09-19T03:00:00Z' },
        { ngay_can: '2026-09-19', ghi_chu: 'Cần gấp', tg_cap_nhat: '2026-09-19T04:00:00Z' }
      )
    );

    expect(kq).toEqual([
      { cot: 'ngay_can', nhan: 'Ngày cần', cu: '17/09/2026', moi: '19/09/2026' },
      { cot: 'ghi_chu', nhan: 'Ghi chú', cu: '(trống)', moi: 'Cần gấp' },
    ]);
  });

  it('bỏ qua cột kỹ thuật — chỉ sửa mặt hàng thì bảng phiếu không có gì đổi', () => {
    const kq = soSanhCotPhieu(
      dong(
        { so_phieu: 'PDX-0796', tg_cap_nhat: '2026-09-19T03:00:00Z' },
        { so_phieu: 'PDX-0796', tg_cap_nhat: '2026-09-19T03:57:25Z' }
      )
    );
    expect(kq).toEqual([]);
  });

  it('không in giá trị của cột khoá ngoại vì id không nói lên điều gì', () => {
    const kq = soSanhCotPhieu(dong({ id_nguoi_duyet: 12 }, { id_nguoi_duyet: 34 }));
    expect(kq).toEqual([{ cot: 'id_nguoi_duyet', nhan: 'Người duyệt', cu: null, moi: null }]);
  });

  it('cặp id + tên cùng đổi thì chỉ giữ cột tên cho khỏi trùng ý', () => {
    const kq = soSanhCotPhieu(dong({ kho_id: 1, ten_kho: 'Kho A' }, { kho_id: 2, ten_kho: 'Kho B' }));
    expect(kq).toEqual([{ cot: 'ten_kho', nhan: 'Kho', cu: 'Kho A', moi: 'Kho B' }]);
  });

  it('trạng thái đổi thì bỏ qua vì đã có sự kiện duyệt riêng', () => {
    expect(soSanhCotPhieu(dong({ trang_thai: 'Chờ duyệt' }, { trang_thai: 'Đã duyệt' }))).toEqual([]);
  });

  it('cột lạ chưa có nhãn thì lui về tên cột đã làm đẹp', () => {
    const kq = soSanhCotPhieu(dong({ ngay_giao_dk: '2026-09-01' }, { ngay_giao_dk: '2026-09-05' }));
    expect(kq[0]).toEqual({ cot: 'ngay_giao_dk', nhan: 'Ngay giao dk', cu: '01/09/2026', moi: '05/09/2026' });
  });

  it('cột dài bị cắt bớt để câu thông báo không tràn', () => {
    const dai = 'x'.repeat(80);
    const kq = soSanhCotPhieu(dong({ mo_ta: 'ngắn' }, { mo_ta: dai }));
    expect(kq[0]!.moi).toHaveLength(40);
    expect(kq[0]!.moi!.endsWith('…')).toBe(true);
  });

  it('INSERT không có payload_cu thì không so gì', () => {
    expect(soSanhCotPhieu(dong(null, { ngay_can: '2026-09-19' }))).toEqual([]);
  });

  it('cột có giá trị đọc được xếp trước cột khoá ngoại', () => {
    const kq = soSanhCotPhieu(
      dong({ id_nguoi_duyet: 1, ghi_chu: 'a' }, { id_nguoi_duyet: 2, ghi_chu: 'b' })
    );
    expect(kq.map((t) => t.cot)).toEqual(['ghi_chu', 'id_nguoi_duyet']);
  });
});
