/**
 * Theo dõi đổi chuyền / đổi vị trí của từng người qua nhiều phiếu — nguồn cho file Excel
 * «Chi tiết nhân viên» (dạng dòng) và «Theo dõi vị trí» (ma trận người × ngày).
 *
 * Mốc so: LẦN CÓ MẶT TRƯỚC GẦN NHẤT của chính người đó (bỏ qua ngày vắng). Lần đầu xuất hiện
 * trong khoảng xuất thì không đánh dấu. Một người làm 2 chuyền cùng ngày: mỗi dòng so riêng
 * với các chỗ làm của lần trước — trùng một chỗ là không đổi.
 */
import { khoaTen } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';
import { nhomNhanVienTheoChuyen } from './danh-sach-nv';
import type { ChamCong, FarmBaoCaoNhanCong, LoaiChuyen } from './types';

export interface ThayDoiViTri {
  ngayTruoc: string;
  tuChuyen: LoaiChuyen;
  tuViTri: string | null;
  doiChuyen: boolean;
  doiViTri: boolean;
}

export interface DongChiTietNv {
  /** Khoá người: chi nhánh + id danh mục (thiếu id thì theo tên chuẩn hoá). */
  khoa: string;
  ngay: string;
  idChiNhanh: string;
  tenChiNhanh: string;
  tt: string;
  thuTuChuyen: number;
  loaiChuyen: LoaiChuyen;
  hoTen: string;
  viTri: string | null;
  chamCong: ChamCong;
  gioCong: number;
  gioTc: number;
  ghiChu: string | null;
  thayDoi: ThayDoiViTri | null;
}

export interface HangMaTranViTri {
  khoa: string;
  idChiNhanh: string;
  tenChiNhanh: string;
  hoTen: string;
  /** ngày → các dòng của người đó ngày ấy (thường 1, có thể 2 chuyền). */
  o: Map<string, DongChiTietNv[]>;
  /** Số ngày có ít nhất một dòng bị đổi so với lần trước. */
  soLanDoi: number;
}

export interface MaTranViTri {
  ngays: string[];
  hang: HangMaTranViTri[];
  /** Chi nhánh có danh sách tên vào ngày đó — ô trống ngày này mới là «vắng». */
  coDuLieu: (idChiNhanh: string, ngay: string) => boolean;
}

export function khoaViTri(v: string | null | undefined): string {
  return khoaTen(v);
}

export function khoaNguoi(idChiNhanh: string, idNhanVien: string | null, hoTen: string): string {
  return `${idChiNhanh}|${idNhanVien ?? `ten:${khoaTen(hoTen)}`}`;
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function soVoiLanTruoc(
  dong: Pick<DongChiTietNv, 'loaiChuyen' | 'viTri'>,
  lanTruoc: { ngay: string; dong: DongChiTietNv[] } | undefined
): ThayDoiViTri | null {
  if (!lanTruoc || lanTruoc.dong.length === 0) return null;
  const cungChuyen = lanTruoc.dong.filter((d) => d.loaiChuyen === dong.loaiChuyen);
  if (cungChuyen.some((d) => khoaViTri(d.viTri) === khoaViTri(dong.viTri))) return null;
  const goc = cungChuyen[0] ?? lanTruoc.dong[0];
  return {
    ngayTruoc: lanTruoc.ngay,
    tuChuyen: goc.loaiChuyen,
    tuViTri: goc.viTri,
    doiChuyen: cungChuyen.length === 0,
    doiViTri: khoaViTri(goc.viTri) !== khoaViTri(dong.viTri),
  };
}

/** Mọi tên trong các phiếu, dạng phẳng: ngày ↑ → chi nhánh → thứ tự chuyền → thứ tự tên; kèm cờ đổi. */
export function dungDongChiTietNv(dsPhieu: readonly FarmBaoCaoNhanCong[]): DongChiTietNv[] {
  const phieu = [...dsPhieu].sort(
    (a, b) =>
      a.ngay.localeCompare(b.ngay) ||
      (a.ten_chi_nhanh ?? '').localeCompare(b.ten_chi_nhanh ?? '', 'vi', { numeric: true }) ||
      Number(a.id) - Number(b.id)
  );

  const ketQua: DongChiTietNv[] = [];
  /** Lần có mặt gần nhất đã CHỐT (ngày trước ngày đang xét) của từng người. */
  const lanTruoc = new Map<string, { ngay: string; dong: DongChiTietNv[] }>();
  /** Dòng của ngày đang xét — chỉ đẩy vào `lanTruoc` khi sang ngày khác, để 2 chuyền cùng ngày không so với nhau. */
  let ngayDangXet = '';
  let homNay = new Map<string, DongChiTietNv[]>();
  const chotNgay = () => {
    for (const [k, dong] of homNay) lanTruoc.set(k, { ngay: ngayDangXet, dong });
    homNay = new Map();
  };

  for (const p of phieu) {
    const ngay = p.ngay.slice(0, 10);
    if (ngay !== ngayDangXet) {
      chotNgay();
      ngayDangXet = ngay;
    }
    const idChiNhanh = p.id_chi_nhanh ?? '';
    for (const { ct, tt, thuTuChuyen, nhanVien } of nhomNhanVienTheoChuyen(p)) {
      for (const nv of nhanVien) {
        const khoa = khoaNguoi(idChiNhanh, nv.id_nhan_vien, nv.ho_ten);
        const coSo = {
          loaiChuyen: ct.loai_chuyen,
          viTri: nv.vi_tri?.trim() || null,
        };
        const dong: DongChiTietNv = {
          khoa,
          ngay,
          idChiNhanh,
          tenChiNhanh: p.ten_chi_nhanh ?? '',
          tt,
          thuTuChuyen,
          ...coSo,
          hoTen: nv.ho_ten.trim(),
          chamCong: nv.cham_cong,
          gioCong: num(nv.so_gio_cong),
          gioTc: num(nv.so_gio_tc),
          ghiChu: nv.ghi_chu?.trim() || null,
          thayDoi: soVoiLanTruoc(coSo, lanTruoc.get(khoa)),
        };
        ketQua.push(dong);
        homNay.set(khoa, [...(homNay.get(khoa) ?? []), dong]);
      }
    }
  }
  return ketQua;
}

/** Ma trận người × ngày; trong mỗi chi nhánh người hay bị đổi nhất lên đầu. */
export function dungMaTranViTri(dong: readonly DongChiTietNv[]): MaTranViTri {
  const ngays = [...new Set(dong.map((d) => d.ngay))].sort();
  const coTen = new Set(dong.map((d) => `${d.idChiNhanh}|${d.ngay}`));
  const theoKhoa = new Map<string, HangMaTranViTri>();
  /** Chuyền lần đầu gặp — người cùng số lần đổi xếp theo chuyền như trên phiếu. */
  const thuTuDau = new Map<string, number>();

  for (const d of dong) {
    let h = theoKhoa.get(d.khoa);
    if (!h) {
      h = { khoa: d.khoa, idChiNhanh: d.idChiNhanh, tenChiNhanh: d.tenChiNhanh, hoTen: d.hoTen, o: new Map(), soLanDoi: 0 };
      theoKhoa.set(d.khoa, h);
      thuTuDau.set(d.khoa, d.thuTuChuyen);
    }
    h.hoTen = d.hoTen; // giữ cách viết mới nhất
    h.o.set(d.ngay, [...(h.o.get(d.ngay) ?? []), d]);
  }

  const hang = [...theoKhoa.values()];
  for (const h of hang) h.soLanDoi = [...h.o.values()].filter((ds) => ds.some((d) => d.thayDoi)).length;
  hang.sort(
    (a, b) =>
      a.tenChiNhanh.localeCompare(b.tenChiNhanh, 'vi', { numeric: true }) ||
      b.soLanDoi - a.soLanDoi ||
      (thuTuDau.get(a.khoa) ?? 0) - (thuTuDau.get(b.khoa) ?? 0) ||
      a.hoTen.localeCompare(b.hoTen, 'vi')
  );

  return {
    ngays,
    hang,
    coDuLieu: (idChiNhanh, ngay) => coTen.has(`${idChiNhanh}|${ngay}`),
  };
}
