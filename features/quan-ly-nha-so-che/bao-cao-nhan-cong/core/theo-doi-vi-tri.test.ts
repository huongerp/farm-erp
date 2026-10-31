import { describe, expect, it } from 'vitest';
import { dungDongChiTietNv, dungMaTranViTri } from './theo-doi-vi-tri';
import type { FarmBaoCaoNhanCong, FarmBaoCaoNhanCongNv, LoaiChuyen } from './types';

type Nguoi = { ten: string; viTri?: string | null; id?: string | null };
let seq = 0;

const nv = ({ ten, viTri = null, id }: Nguoi, thu_tu: number): FarmBaoCaoNhanCongNv => ({
  id: String(++seq),
  id_bcnc_ct: '',
  id_nhan_vien: id === undefined ? `nv-${ten}` : id,
  ho_ten: ten,
  vi_tri: viTri,
  cham_cong: 'CA_NGAY',
  so_gio_cong: 7.5,
  so_gio_tc: 0,
  ghi_chu: null,
  thu_tu,
});

const phieu = (
  ngay: string,
  chuyen: Partial<Record<LoaiChuyen, Nguoi[]>>,
  idChiNhanh = '1'
): FarmBaoCaoNhanCong =>
  ({
    id: String(++seq),
    ngay,
    id_chi_nhanh: idChiNhanh,
    ten_chi_nhanh: `CN${idChiNhanh}`,
    chi_tiet: Object.entries(chuyen).map(([loai, ds]) => ({
      id: String(++seq),
      id_bao_cao: '',
      loai_chuyen: loai as LoaiChuyen,
      sl_cong_ngay: 0,
      sl_cong_nua: 0,
      sl_tang_ca: 0,
      so_gio_tc: 0,
      ghi_chu: null,
      thu_tu: 0,
      nhan_vien: (ds ?? []).map(nv),
    })),
  }) as unknown as FarmBaoCaoNhanCong;

const cuaNguoi = (ds: ReturnType<typeof dungDongChiTietNv>, ten: string) => ds.filter((d) => d.hoTen === ten);

describe('dungDongChiTietNv', () => {
  it('đổi chuyền so với ngày trước: ghi chuyền + vị trí cũ, lần đầu không đánh dấu', () => {
    const ds = dungDongChiTietNv([
      // truyền lộn thứ tự ngày — hàm tự sắp
      phieu('2026-10-29', { CAN_TEM_DONG_THUNG: [{ ten: 'Lan', viTri: 'Cân' }] }),
      phieu('2026-10-28', { TIA_DANH_GIA: [{ ten: 'Lan', viTri: 'Tỉa' }] }),
    ]);
    const [d1, d2] = cuaNguoi(ds, 'Lan');
    expect(d1.ngay).toBe('2026-10-28');
    expect(d1.thayDoi).toBeNull();
    expect(d2.thayDoi).toEqual({
      ngayTruoc: '2026-10-28',
      tuChuyen: 'TIA_DANH_GIA',
      tuViTri: 'Tỉa',
      doiChuyen: true,
      doiViTri: true,
    });
  });

  it('cùng chuyền khác vị trí → chỉ đổi vị trí', () => {
    const ds = dungDongChiTietNv([
      phieu('2026-10-28', { CAN_TEM_DONG_THUNG: [{ ten: 'Huệ', viTri: 'CP' }] }),
      phieu('2026-10-29', { CAN_TEM_DONG_THUNG: [{ ten: 'Huệ', viTri: 'Đóng thùng' }] }),
    ]);
    expect(cuaNguoi(ds, 'Huệ')[1].thayDoi).toMatchObject({ doiChuyen: false, doiViTri: true, tuViTri: 'CP' });
  });

  it('nghỉ một ngày rồi quay lại đúng chỗ cũ → không đổi; khác hoa / thừa khoảng trắng cũng không', () => {
    const ds = dungDongChiTietNv([
      phieu('2026-10-27', { TIA_DANH_GIA: [{ ten: 'Cúc', viTri: 'Nhóm trưởng tỉa' }] }),
      phieu('2026-10-28', { TIA_DANH_GIA: [{ ten: 'Mai', viTri: 'Tỉa' }] }),
      phieu('2026-10-29', { TIA_DANH_GIA: [{ ten: 'Cúc', viTri: '  nhóm   trưởng TỈA ' }] }),
    ]);
    expect(cuaNguoi(ds, 'Cúc').map((d) => d.thayDoi)).toEqual([null, null]);
  });

  it('cùng tên ở hai chi nhánh là hai người; thiếu id danh mục thì khớp theo tên', () => {
    const ds = dungDongChiTietNv([
      phieu('2026-10-28', { XAN_NAI: [{ ten: 'Đào', viTri: 'Xắn nải', id: null }] }, '1'),
      phieu('2026-10-29', { TIA_DANH_GIA: [{ ten: 'Đào', viTri: 'Tỉa', id: null }] }, '2'),
      phieu('2026-10-30', { TIA_DANH_GIA: [{ ten: 'đào ', viTri: 'Tỉa', id: null }] }, '1'),
    ]);
    const [cn1a, cn2, cn1b] = ds;
    expect(cn1a.thayDoi).toBeNull();
    expect(cn2.thayDoi).toBeNull(); // chi nhánh 2: lần đầu
    expect(cn1b.thayDoi).toMatchObject({ ngayTruoc: '2026-10-28', tuChuyen: 'XAN_NAI', doiChuyen: true });
  });

  it('hai chuyền cùng ngày không so với nhau; hôm sau trùng một chỗ là không đổi', () => {
    const ds = dungDongChiTietNv([
      phieu('2026-10-28', {
        XAN_NAI: [{ ten: 'Hồng', viTri: 'Xắn nải' }],
        TIA_DANH_GIA: [{ ten: 'Hồng', viTri: 'Tỉa' }],
      }),
      phieu('2026-10-29', { TIA_DANH_GIA: [{ ten: 'Hồng', viTri: 'Tỉa' }] }),
    ]);
    expect(cuaNguoi(ds, 'Hồng').map((d) => d.thayDoi)).toEqual([null, null, null]);
  });

  it('phiếu không có tên → không có dòng', () => {
    expect(dungDongChiTietNv([phieu('2026-10-28', { XAN_NAI: [] })])).toEqual([]);
  });
});

describe('dungMaTranViTri', () => {
  it('đếm số ngày bị đổi, người đổi nhiều lên đầu; ô trống chỉ là vắng khi chi nhánh có danh sách ngày đó', () => {
    const ds = dungDongChiTietNv([
      phieu('2026-10-28', {
        XAN_NAI: [{ ten: 'An', viTri: 'Xắn' }],
        TIA_DANH_GIA: [{ ten: 'Bình', viTri: 'Tỉa' }],
      }),
      phieu('2026-10-29', { TIA_DANH_GIA: [{ ten: 'Bình', viTri: 'Tỉa' }, { ten: 'An', viTri: 'Tỉa' }] }),
      phieu('2026-10-30', { XAN_NAI: [{ ten: 'An', viTri: 'Xắn' }] }),
    ]);
    const mt = dungMaTranViTri(ds);
    expect(mt.ngays).toEqual(['2026-10-28', '2026-10-29', '2026-10-30']);
    expect(mt.hang.map((h) => [h.hoTen, h.soLanDoi])).toEqual([
      ['An', 2],
      ['Bình', 0],
    ]);
    const binh = mt.hang[1];
    expect(binh.o.has('2026-10-30')).toBe(false);
    expect(mt.coDuLieu('1', '2026-10-30')).toBe(true);
    expect(mt.coDuLieu('2', '2026-10-30')).toBe(false);
  });
});
