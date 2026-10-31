import { describe, expect, it } from 'vitest';
import { nguoiVuotMotCong, nhomCuaChuyenChuaCo, nvChoNgayKe, nvFormRowMoi, subTuDanhSachNv, type NvFormRow } from './danh-sach-nv';
import { syncChiTietTotalsFromSub } from './ct-sub';
import type { VarNhanVienSoChe } from './types';

const nv = (ho_ten: string, patch: Partial<NvFormRow> = {}): NvFormRow => ({ ...nvFormRowMoi(), ho_ten, ...patch });

describe('subTuDanhSachNv', () => {
  it('gom người cùng số giờ vào một dòng, tách cả ngày / nửa ngày / tăng ca', () => {
    const sub = subTuDanhSachNv([
      nv('Lan'),
      nv('Huệ'),
      nv('Cúc', { so_gio_cong: 6 }),
      nv('Mai', { cham_cong: 'NUA_NGAY', so_gio_cong: 4, so_gio_tc: 1.5 }),
      nv('Đào', { so_gio_tc: 1.5 }),
    ]);
    expect(sub.CN_NGAY.slice(0, 2)).toEqual([
      { sl_cong: 3, so_gio: 7.5, ghi_chu: null },
      { sl_cong: 1, so_gio: 6, ghi_chu: null },
    ]);
    expect(sub.CN_NUA[0]).toEqual({ sl_cong: 1, so_gio: 4, ghi_chu: null });
    expect(sub.TANG_CA[0]).toEqual({ sl_cong: 2, so_gio: 1.5, ghi_chu: null });
    // 3 mảng cùng độ dài như editor sub yêu cầu
    expect(sub.CN_NUA).toHaveLength(2);
    expect(sub.TANG_CA).toHaveLength(2);
    expect(syncChiTietTotalsFromSub(sub)).toMatchObject({ sl_cong_ngay: 4, sl_cong_nua: 1, sl_tang_ca: 2 });
  });

  it('bỏ dòng chưa gõ tên; danh sách rỗng vẫn trả 1 dòng trống', () => {
    const sub = subTuDanhSachNv([nv('  '), nv('')]);
    expect(syncChiTietTotalsFromSub(sub)).toMatchObject({ sl_cong_ngay: 0, sl_cong_nua: 0, sl_tang_ca: 0 });
    expect(sub.CN_NGAY).toHaveLength(1);
  });
});

describe('nguoiVuotMotCong', () => {
  it('cả ngày ở hai chuyền là vượt; hai nửa ngày là hợp lệ; so tên không phân biệt hoa thường', () => {
    const chiTiet = [
      { nhan_vien: [nv('Võ Thị Cưng'), nv('Lan', { cham_cong: 'NUA_NGAY' })] },
      { nhan_vien: [nv('võ  thị cưng'), nv('lan', { cham_cong: 'NUA_NGAY' })] },
    ];
    expect(nguoiVuotMotCong(chiTiet)).toEqual([
      { chiTietIdx: 0, idx: 0 },
      { chiTietIdx: 1, idx: 0 },
    ]);
  });

  it('cả ngày + nửa ngày là vượt', () => {
    expect(nguoiVuotMotCong([{ nhan_vien: [nv('A'), nv('a', { cham_cong: 'NUA_NGAY' })] }])).toHaveLength(2);
  });
});

describe('nhomCuaChuyenChuaCo', () => {
  const dm = (ho_ten: string, patch: Partial<VarNhanVienSoChe> = {}): VarNhanVienSoChe => ({
    id: ho_ten,
    id_chi_nhanh: '1',
    ho_ten,
    vi_tri: null,
    loai_chuyen: 'XAN_NAI',
    dang_dung: true,
    thu_tu: 0,
    ...patch,
  });

  it('chỉ lấy người đang dùng của chuyền, chưa có ở bất kỳ chuyền nào trong phiếu', () => {
    const ds = nhomCuaChuyenChuaCo(
      [dm('Bình'), dm('An'), dm('Nghỉ', { dang_dung: false }), dm('Kho', { loai_chuyen: 'KHO_HUT_CHAN_KHONG' }), dm('Đã có')],
      'XAN_NAI',
      [{ nhan_vien: [] }, { nhan_vien: [nv('đã có')] }]
    );
    expect(ds.map((x) => x.ho_ten)).toEqual(['An', 'Bình']);
  });
});

describe('nvChoNgayKe', () => {
  it('giữ người và cả/nửa ngày, bỏ tăng ca + ghi chú + dòng trống', () => {
    expect(nvChoNgayKe([nv('A', { so_gio_tc: 2, ghi_chu: 'x', cham_cong: 'NUA_NGAY', so_gio_cong: 4 }), nv('')])).toEqual([
      nv('A', { cham_cong: 'NUA_NGAY', so_gio_cong: 4 }),
    ]);
  });
});
