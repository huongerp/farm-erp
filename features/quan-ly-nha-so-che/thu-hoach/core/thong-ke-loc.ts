/**
 * Bộ lọc + chế độ xem của tab Thống kê thu hoạch. Dùng chung cho màn hình và trang in
 * (`/quan-ly-nha-so-che/thu-hoach/in-thong-ke?…`) để hai nơi ra cùng một số liệu.
 */
import type { DongNgay } from './ngay-thu-hoach';
import {
  CHE_DO_THONG_KE,
  TINH_TRANG_DAT_KH,
  tinhTrangDatKh,
  type CheDoThongKe,
  type FarmDayAgg,
} from './stats-pivot';

export interface ThongKeLoc {
  cheDo: CheDoThongKe;
  /** YYYY-MM-DD hoặc '' — so với ngày lịch thật của từng ô. */
  tuNgay: string;
  denNgay: string;
  nam: string[];
  tuan: string[];
  farm: string[];
  /** Tình trạng đạt KH của farm, tính trên tổng cả kỳ đã lọc. */
  tinhTrang: string[];
}

export const LOC_TRONG: ThongKeLoc = {
  cheDo: 'thu',
  tuNgay: '',
  denNgay: '',
  nam: [],
  tuan: [],
  farm: [],
  tinhTrang: [],
};

export function locDongNgay(dong: DongNgay[], loc: ThongKeLoc): DongNgay[] {
  const nam = new Set(loc.nam);
  const tuan = new Set(loc.tuan);
  const farm = new Set(loc.farm);
  const ketQua = dong.filter((d) => {
    if (loc.tuNgay && d.ngay < loc.tuNgay) return false;
    if (loc.denNgay && d.ngay > loc.denNgay) return false;
    if (nam.size && !nam.has(String(d.nam))) return false;
    if (tuan.size && !tuan.has(String(d.tuan))) return false;
    if (farm.size && !farm.has(d.farmKey)) return false;
    return true;
  });
  if (!loc.tinhTrang.length) return ketQua;

  const tongFarm = new Map<string, FarmDayAgg>();
  for (const d of ketQua) {
    const o = tongFarm.get(d.farmKey) ?? { keHoach: 0, thucTe: 0 };
    o.keHoach += d.keHoach;
    o.thucTe += d.thucTe;
    tongFarm.set(d.farmKey, o);
  }
  const canGiu = new Set(loc.tinhTrang);
  const farmGiu = new Set(
    [...tongFarm].filter(([, o]) => canGiu.has(tinhTrangDatKh(o) ?? '')).map(([fk]) => fk)
  );
  return ketQua.filter((d) => farmGiu.has(d.farmKey));
}

const NGAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function docDanhSach(sp: URLSearchParams, key: string): string[] {
  return (sp.get(key) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ghi bộ lọc thành query string (bỏ giá trị rỗng). */
export function ghiThamSo(loc: ThongKeLoc): string {
  const sp = new URLSearchParams();
  sp.set('cd', loc.cheDo);
  if (loc.tuNgay) sp.set('tu', loc.tuNgay);
  if (loc.denNgay) sp.set('den', loc.denNgay);
  if (loc.nam.length) sp.set('nam', loc.nam.join(','));
  if (loc.tuan.length) sp.set('tuan', loc.tuan.join(','));
  if (loc.farm.length) sp.set('cn', loc.farm.join(','));
  if (loc.tinhTrang.length) sp.set('tt', loc.tinhTrang.join(','));
  return sp.toString();
}

/** Đọc bộ lọc từ URL; giá trị sai định dạng bị bỏ qua. */
export function docThamSo(sp: URLSearchParams): ThongKeLoc {
  const cd = sp.get('cd');
  const tu = sp.get('tu') ?? '';
  const den = sp.get('den') ?? '';
  const soNguyen = (s: string) => /^\d+$/.test(s);
  return {
    cheDo: CHE_DO_THONG_KE.includes(cd as CheDoThongKe) ? (cd as CheDoThongKe) : 'thu',
    tuNgay: NGAY_RE.test(tu) ? tu : '',
    denNgay: NGAY_RE.test(den) ? den : '',
    nam: docDanhSach(sp, 'nam').filter(soNguyen),
    tuan: docDanhSach(sp, 'tuan').filter(soNguyen),
    farm: docDanhSach(sp, 'cn'),
    tinhTrang: docDanhSach(sp, 'tt').filter((s) => (TINH_TRANG_DAT_KH as readonly string[]).includes(s)),
  };
}

/** Số bộ lọc đang bật (chế độ xem không tính). */
export function demBoLoc(loc: ThongKeLoc): number {
  return (
    (loc.tuNgay || loc.denNgay ? 1 : 0) +
    loc.nam.length +
    loc.tuan.length +
    loc.farm.length +
    loc.tinhTrang.length
  );
}
