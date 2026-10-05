/** Danh mục tiêu chí: sinh mã khoá và ảnh chụp bộ tiêu chí đưa vào phiếu. */
import type { TieuChi, TieuChiDanhMuc } from './types';

/** "Trầy tươi nặng" → `tray_tuoi_nang`; trùng mã đã có thì thêm `_2`, `_3`… */
export function taoMaTieuChi(ten: string, maDaCo: Iterable<string>): string {
  const goc =
    ten
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'tieu_chi';
  const daCo = new Set(maDaCo);
  if (!daCo.has(goc)) return goc;
  let i = 2;
  while (daCo.has(`${goc}_${i}`)) i += 1;
  return `${goc}_${i}`;
}

/** Bộ tiêu chí đang dùng, đúng thứ tự — chụp vào phiếu (cột `tieu_chi`). */
export function anhChupTieuChi(danhMuc: TieuChiDanhMuc[]): TieuChi[] {
  return danhMuc
    .filter((d) => d.dang_dung)
    .sort((a, b) => a.thu_tu - b.thu_tu || Number(a.id) - Number(b.id))
    .map(({ ma, ten, loai, don_vi, nguong_min, nguong_max }) => ({ ma, ten, loai, don_vi, nguong_min, nguong_max }));
}

export type TruongTieuChi = 'ten' | 'loai' | 'don_vi' | 'nguong_min' | 'nguong_max';
const TRUONG_SO_SANH: TruongTieuChi[] = ['ten', 'loai', 'don_vi', 'nguong_min', 'nguong_max'];

export interface SoSanhBoTieuChi {
  /** Có trong bộ mới, chưa có trên phiếu. */
  them: TieuChi[];
  /** Có trên phiếu, bộ mới không còn (ngừng dùng / đã xoá) — kết quả đã nhập không còn được tính. */
  bo: TieuChi[];
  /** Cùng mã nhưng khác tên / kiểu / đơn vị / ngưỡng. */
  doi: { cu: TieuChi; moi: TieuChi; truong: TruongTieuChi[] }[];
  /** Số tiêu chí giữ nguyên hoàn toàn. */
  giuNguyen: number;
  coThayDoi: boolean;
}

/**
 * So bộ tiêu chí đang chụp trên phiếu (`cu`) với bộ đang cài đặt (`moi`), khớp theo `ma`
 * (khoá trong ket_qua của từng thùng). Thứ tự: theo bộ mới, tiêu chí bị bỏ theo thứ tự cũ.
 */
export function soSanhBoTieuChi(cu: TieuChi[], moi: TieuChi[]): SoSanhBoTieuChi {
  const theoMaCu = new Map(cu.map((x) => [x.ma, x]));
  const maMoi = new Set(moi.map((x) => x.ma));
  const them: TieuChi[] = [];
  const doi: SoSanhBoTieuChi['doi'] = [];
  let giuNguyen = 0;
  for (const m of moi) {
    const c = theoMaCu.get(m.ma);
    if (!c) {
      them.push(m);
      continue;
    }
    const truong = TRUONG_SO_SANH.filter((k) => (c[k] ?? null) !== (m[k] ?? null));
    if (truong.length) doi.push({ cu: c, moi: m, truong });
    else giuNguyen += 1;
  }
  const bo = cu.filter((c) => !maMoi.has(c.ma));
  // Thứ tự khác nhau cũng là thay đổi (bảng in / bảng kết quả xếp theo bộ tiêu chí).
  const doiThuTu = cu.filter((c) => maMoi.has(c.ma)).map((c) => c.ma).join() !== moi.filter((m) => theoMaCu.has(m.ma)).map((m) => m.ma).join();
  return { them, bo, doi, giuNguyen, coThayDoi: them.length > 0 || bo.length > 0 || doi.length > 0 || doiThuTu };
}
