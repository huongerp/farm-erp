import { describe, expect, it } from 'vitest';
import {
  buoiCuaChamCong,
  chamChieuCaChuyen,
  chamCongMacDinh,
  chamCongTuBuoi,
  doiBuoi,
  nguoiVuotMotCong,
  nhomCuaChuyenChuaCo,
  nvChoNgayKe,
  nvFormRowMoi,
  subTuDanhSachNv,
  type NvFormRow,
} from './danh-sach-nv';
import { syncChiTietTotalsFromSub } from './ct-sub';
import type { VarNhanVienSoChe } from './types';

const SANG_SOM = new Date(2026, 10, 1, 11, 59);
const TRUA = new Date(2026, 10, 1, 12, 0);
// Mặc định cố định = Cả ngày (dựng sau 12h) để test không phụ thuộc giờ chạy
const nv = (ho_ten: string, patch: Partial<NvFormRow> = {}): NvFormRow => ({ ...nvFormRowMoi(undefined, TRUA), ho_ten, ...patch });

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

  it('Sáng, Chiều và nửa ngày cũ đều vào nhóm CN nửa', () => {
    const sub = subTuDanhSachNv([
      nv('A', { cham_cong: 'SANG', so_gio_cong: 3.75 }),
      nv('B', { cham_cong: 'CHIEU', so_gio_cong: 3.75 }),
      nv('C', { cham_cong: 'NUA_NGAY', so_gio_cong: 4 }),
    ]);
    expect(sub.CN_NUA.slice(0, 2)).toEqual([
      { sl_cong: 2, so_gio: 3.75, ghi_chu: null },
      { sl_cong: 1, so_gio: 4, ghi_chu: null },
    ]);
    expect(syncChiTietTotalsFromSub(sub)).toMatchObject({ sl_cong_ngay: 0, sl_cong_nua: 3 });
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

describe('nguoiVuotMotCong — trùng buổi', () => {
  it('cùng buổi sáng ở hai chuyền bị báo', () => {
    const chiTiet = [{ nhan_vien: [nv('A', { cham_cong: 'SANG' })] }, { nhan_vien: [nv('a', { cham_cong: 'SANG' })] }];
    expect(nguoiVuotMotCong(chiTiet)).toEqual([
      { chiTietIdx: 0, idx: 0 },
      { chiTietIdx: 1, idx: 0 },
    ]);
  });

  it('Sáng chuyền này + Chiều chuyền kia là hợp lệ', () => {
    const chiTiet = [{ nhan_vien: [nv('A', { cham_cong: 'SANG' })] }, { nhan_vien: [nv('A', { cham_cong: 'CHIEU' })] }];
    expect(nguoiVuotMotCong(chiTiet)).toEqual([]);
  });

  it('Cả ngày + Chiều ở chuyền khác bị báo (trùng chiều)', () => {
    const chiTiet = [{ nhan_vien: [nv('A')] }, { nhan_vien: [nv('A', { cham_cong: 'CHIEU' })] }];
    expect(nguoiVuotMotCong(chiTiet)).toHaveLength(2);
  });
});

describe('buổi chấm công', () => {
  it('buoiCuaChamCong / chamCongTuBuoi', () => {
    expect(buoiCuaChamCong('CA_NGAY')).toEqual({ sang: true, chieu: true });
    expect(buoiCuaChamCong('SANG')).toEqual({ sang: true, chieu: false });
    expect(buoiCuaChamCong('CHIEU')).toEqual({ sang: false, chieu: true });
    expect(buoiCuaChamCong('NUA_NGAY')).toEqual({ sang: false, chieu: false });
    expect(chamCongTuBuoi(true, true)).toBe('CA_NGAY');
    expect(chamCongTuBuoi(true, false)).toBe('SANG');
    expect(chamCongTuBuoi(false, true)).toBe('CHIEU');
    expect(chamCongTuBuoi(false, false)).toBeNull();
  });

  it('mặc định theo giờ: 11:59 chỉ Sáng, 12:00 cả ngày', () => {
    expect(chamCongMacDinh(SANG_SOM)).toBe('SANG');
    expect(chamCongMacDinh(TRUA)).toBe('CA_NGAY');
    expect(nvFormRowMoi(undefined, SANG_SOM)).toMatchObject({ cham_cong: 'SANG', so_gio_cong: 3.75 });
    expect(nvFormRowMoi({ ho_ten: 'A', vi_tri: 'Cân' }, TRUA)).toMatchObject({ cham_cong: 'CA_NGAY', so_gio_cong: 7.5, vi_tri: 'Cân' });
  });

  it('doiBuoi: bật/tắt từng buổi, giờ mặc định đổi theo, giờ sửa tay giữ', () => {
    const sang = nv('A', { cham_cong: 'SANG', so_gio_cong: 3.75 });
    const caNgay = doiBuoi(sang, 'chieu');
    expect(caNgay).toMatchObject({ cham_cong: 'CA_NGAY', so_gio_cong: 7.5 });
    expect(doiBuoi(caNgay, 'sang')).toMatchObject({ cham_cong: 'CHIEU', so_gio_cong: 3.75 });
    expect(doiBuoi({ ...sang, so_gio_cong: 3 }, 'chieu')).toMatchObject({ cham_cong: 'CA_NGAY', so_gio_cong: 3 });
  });

  it('doiBuoi: tắt buổi cuối cùng thì giữ nguyên dòng', () => {
    const sang = nv('A', { cham_cong: 'SANG', so_gio_cong: 3.75 });
    expect(doiBuoi(sang, 'sang')).toBe(sang);
  });

  it('doiBuoi: nửa ngày cũ bấm buổi nào thành buổi đó', () => {
    const cu = nv('A', { cham_cong: 'NUA_NGAY', so_gio_cong: 4 });
    expect(doiBuoi(cu, 'chieu')).toMatchObject({ cham_cong: 'CHIEU', so_gio_cong: 3.75 });
    expect(doiBuoi(cu, 'sang')).toMatchObject({ cham_cong: 'SANG', so_gio_cong: 3.75 });
  });

  it('chamChieuCaChuyen: chỉ dòng Sáng thành Cả ngày', () => {
    const ds = [
      nv('A', { cham_cong: 'SANG', so_gio_cong: 3.75 }),
      nv('B', { cham_cong: 'CHIEU', so_gio_cong: 3.75 }),
      nv('C', { cham_cong: 'NUA_NGAY', so_gio_cong: 4 }),
      nv('D', { cham_cong: 'SANG', so_gio_cong: 3 }),
    ];
    const kq = chamChieuCaChuyen(ds);
    expect(kq[0]).toMatchObject({ cham_cong: 'CA_NGAY', so_gio_cong: 7.5 });
    expect(kq[1]).toBe(ds[1]);
    expect(kq[2]).toBe(ds[2]);
    expect(kq[3]).toMatchObject({ cham_cong: 'CA_NGAY', so_gio_cong: 3 });
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
  it('giữ người + vị trí, đặt lại chấm công mặc định theo giờ, bỏ tăng ca + ghi chú + dòng trống', () => {
    const ds = [nv('A', { vi_tri: 'Cân', so_gio_tc: 2, ghi_chu: 'x', cham_cong: 'CA_NGAY', so_gio_cong: 6 }), nv('')];
    expect(nvChoNgayKe(ds, SANG_SOM)).toEqual([nv('A', { vi_tri: 'Cân', cham_cong: 'SANG', so_gio_cong: 3.75 })]);
    expect(nvChoNgayKe(ds, TRUA)).toEqual([nv('A', { vi_tri: 'Cân', cham_cong: 'CA_NGAY', so_gio_cong: 7.5 })]);
  });
});
