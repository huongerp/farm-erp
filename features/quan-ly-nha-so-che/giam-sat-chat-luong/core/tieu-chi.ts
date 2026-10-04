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
