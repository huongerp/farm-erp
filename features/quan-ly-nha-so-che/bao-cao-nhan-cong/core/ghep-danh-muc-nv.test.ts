import { describe, expect, it } from 'vitest';
import { ghepDanhMucNv, type NvChinhRef } from './ghep-danh-muc-nv';
import type { VarNhanVienSoChe } from './types';

const nvc = (id: string, ho_ten: string, trang_thai: string | null = 'Đang làm việc'): NvChinhRef => ({ id, ho_ten, trang_thai });

const tl = (id: string, id_nv: string | null, patch: Partial<VarNhanVienSoChe> = {}): VarNhanVienSoChe => ({
  id,
  id_nv,
  id_chi_nhanh: '11',
  ho_ten: 'tên cũ',
  vi_tri: null,
  so_nhom: null,
  loai_chuyen: null,
  dang_dung: true,
  thu_tu: 0,
  ...patch,
});

describe('ghepDanhMucNv — danh sách chọn tên lấy từ Danh sách nhân viên + thiết lập sơ chế', () => {
  it('người chưa có dòng thiết lập: id null, tên + đang dùng theo bảng chính, mặc định trống', () => {
    expect(ghepDanhMucNv('11', [nvc('5', 'Hà Thị Yến')], [])).toEqual([
      {
        id: null,
        id_nv: '5',
        id_chi_nhanh: '11',
        ho_ten: 'Hà Thị Yến',
        vi_tri: null,
        so_nhom: null,
        loai_chuyen: null,
        dang_dung: true,
        thu_tu: 0,
      },
    ]);
  });

  it('có thiết lập: lấy vị trí / nhóm / chuyền / thứ tự từ thiết lập, TÊN lấy từ bảng chính', () => {
    const [x] = ghepDanhMucNv(
      '11',
      [nvc('5', 'Hà Thị Yến')],
      [tl('90', '5', { ho_ten: 'hà thị yến', vi_tri: 'Cân', so_nhom: 2, loai_chuyen: 'XAN_NAI', thu_tu: 3 })]
    );
    expect(x).toMatchObject({ id: '90', id_nv: '5', ho_ten: 'Hà Thị Yến', vi_tri: 'Cân', so_nhom: 2, loai_chuyen: 'XAN_NAI', thu_tu: 3 });
  });

  it('nghỉ việc ở bảng chính → dang_dung false (ẩn khỏi gợi ý nhưng phiếu cũ vẫn khớp)', () => {
    const [x] = ghepDanhMucNv('11', [nvc('5', 'A', 'Nghỉ việc')], [tl('90', '5', { dang_dung: true })]);
    expect(x?.dang_dung).toBe(false);
  });

  it('dòng thiết lập không còn khớp ai trong bảng chính của chi nhánh → giữ lại với dang_dung false, tên cũ', () => {
    const ds = ghepDanhMucNv('11', [nvc('5', 'A')], [tl('90', '5'), tl('91', null, { ho_ten: 'Người cũ' }), tl('92', '7', { ho_ten: 'Chuyển đi' })]);
    expect(ds.map((x) => [x.id, x.ho_ten, x.dang_dung])).toEqual([
      ['90', 'A', true],
      ['92', 'Chuyển đi', false],
      ['91', 'Người cũ', false],
    ]);
  });

  it('sắp theo thu_tu rồi tên tiếng Việt', () => {
    const ds = ghepDanhMucNv(
      '11',
      [nvc('1', 'Bình'), nvc('2', 'An'), nvc('3', 'Đức')],
      [tl('90', '3', { thu_tu: -1 })]
    );
    expect(ds.map((x) => x.ho_ten)).toEqual(['Đức', 'An', 'Bình']);
  });
});
