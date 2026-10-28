/**
 * Import Excel «Chi tiết đánh giá»: 1 dòng file = 1 dòng đánh giá (hoặc đứt dây). Thuần — test trực tiếp.
 * Parse + kiểm từng dòng ở đây; phần tạo phiếu / lô / cột dây và ghi số chạy trong RPC `rpc_dgdv_import`
 * (migration 056, một transaction). Dòng lỗi bị loại và báo đúng số dòng Excel (`IMPORT_ROW_KEY`).
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY, type ImportErrorRow } from '../../../../lib/import-types';
import { matchKey, normalizeText, parseImportDate, parseImportInt } from '../../../../lib/import-common';
import { gonTen, khoaTen } from '../core/chuan-hoa-ten';
import { soTuanIsoTrongNam, tuanIsoCuaNgay } from '../core/tuan';
import type { TuanIso } from '../core/types';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`danhGiaDauVao.import.${k}`, o ?? {});

/** Thứ tự cột file mẫu. `chi_nhanh` chỉ có khi import ở danh sách (trong phiếu đã biết chi nhánh). */
export const COT_IMPORT_DGDV = [
  'ngay',
  'chi_nhanh',
  'lo',
  'to_truong',
  'mau_1',
  'mau_2',
  'xe_doi',
  'tuan_thu_hoach',
  'so_luong',
  'danh_gia',
  'so_luong_loi',
  'ly_do_loi',
] as const;
export type CotImportDgdv = (typeof COT_IMPORT_DGDV)[number];

/** Giá trị ô «Màu dây 1» để khai một dòng đứt dây. */
export const GIA_TRI_DUT_DAY = 'Đứt dây';

export interface RefChiNhanh {
  id: string;
  ma: string;
  ten: string;
}
export interface RefMau {
  id: string;
  ten: string;
  ma_mau: string;
}

/** Import trong một phiếu: mọi dòng phải thuộc tuần + chi nhánh này. */
export interface PhieuCoDinh extends TuanIso {
  id_chi_nhanh: string;
}

/** Một dòng gửi RPC (khớp tham số `p_rows` của `rpc_dgdv_import`). */
export interface DongImportRpc {
  row: number;
  ngay: string;
  id_chi_nhanh: number;
  ten_lo: string;
  to_truong: string | null;
  /** null = đứt dây */
  id_mau_1: number | null;
  id_mau_2: number | null;
  xe_doi: boolean;
  th_nam: number;
  th_tuan: number;
  so_luong: number;
  danh_gia: string | null;
  so_luong_loi: number;
  ly_do_loi: string | null;
}

const CO = new Set(['x', 'có', 'co', '1', 'true', 'yes', 'y', 'v', '✓']);

/**
 * Tuần thu hoạch chỉ ghi số tuần → năm ISO lấy theo ngày đánh giá, lệch quá nửa năm thì sang năm kề
 * (vd. ngày 03/01/2027 tuần 1, dây thu hoạch «tuần 52» → 52/2026).
 */
export function tuanThuHoachTheoNgay(tuan: number, ngay: string): TuanIso {
  const t = tuanIsoCuaNgay(ngay);
  if (tuan - t.tuan > 26) return { nam: t.nam - 1, tuan };
  if (t.tuan - tuan > 26) return { nam: t.nam + 1, tuan };
  return { nam: t.nam, tuan };
}

export function parseDongImport(
  rows: Record<string, unknown>[],
  refs: { chiNhanh: RefChiNhanh[]; mau: RefMau[] },
  coDinh?: PhieuCoDinh | null
): { dong: DongImportRpc[]; loi: ImportErrorRow[] } {
  const cnTheoKhoa = new Map<string, RefChiNhanh>();
  for (const c of refs.chiNhanh) {
    cnTheoKhoa.set(matchKey(c.ma), c);
    cnTheoKhoa.set(matchKey(c.ten), c);
  }
  const mauTheoKhoa = new Map<string, RefMau>();
  for (const m of refs.mau) {
    mauTheoKhoa.set(khoaTen(m.ten), m);
    mauTheoKhoa.set(khoaTen(m.ma_mau), m);
  }
  const khoaDutDay = khoaTen(GIA_TRI_DUT_DAY);

  const dong: DongImportRpc[] = [];
  const loi: ImportErrorRow[] = [];

  rows.forEach((r, i) => {
    const row = typeof r[IMPORT_ROW_KEY] === 'number' ? (r[IMPORT_ROW_KEY] as number) : i + 2;
    const msgs: string[] = [];

    const ngay = parseImportDate(r.ngay);
    if (!ngay) msgs.push(tr('loiNgay'));

    let idCn: string | null = null;
    if (coDinh) {
      idCn = coDinh.id_chi_nhanh;
      if (ngay) {
        const t = tuanIsoCuaNgay(ngay);
        if (t.nam !== coDinh.nam || t.tuan !== coDinh.tuan) msgs.push(tr('loiNgoaiTuan', { tuan: coDinh.tuan, nam: coDinh.nam }));
      }
    } else {
      const cn = cnTheoKhoa.get(matchKey(r.chi_nhanh));
      if (!normalizeText(r.chi_nhanh)) msgs.push(tr('loiChiNhanhTrong'));
      else if (!cn) msgs.push(tr('loiChiNhanh', { v: normalizeText(r.chi_nhanh) }));
      else idCn = cn.id;
    }

    const tenLo = gonTen(normalizeText(r.lo));
    if (!tenLo) msgs.push(tr('loiLo'));

    const mau1Raw = normalizeText(r.mau_1);
    const dutDay = khoaTen(mau1Raw) === khoaDutDay;
    let idMau1: number | null = null;
    let idMau2: number | null = null;
    if (!mau1Raw) msgs.push(tr('loiMau1'));
    else if (!dutDay) {
      const m1 = mauTheoKhoa.get(khoaTen(mau1Raw));
      if (!m1) msgs.push(tr('loiMau', { v: mau1Raw }));
      else idMau1 = Number(m1.id);
      const mau2Raw = normalizeText(r.mau_2);
      if (mau2Raw) {
        const m2 = mauTheoKhoa.get(khoaTen(mau2Raw));
        if (!m2) msgs.push(tr('loiMau', { v: mau2Raw }));
        else if (m1 && m2.id === m1.id) msgs.push(tr('loiMauTrung'));
        else idMau2 = Number(m2.id);
      }
    }

    const sl = parseImportInt(r.so_luong);
    if (!sl.ok || sl.value == null || sl.value <= 0) msgs.push(tr('loiSoLuong'));
    const slLoi = dutDay ? ({ ok: true, value: 0 } as const) : parseImportInt(r.so_luong_loi);
    if (!slLoi.ok) msgs.push(tr('loiSlLoi'));
    else if (sl.ok && sl.value != null && (slLoi.value ?? 0) > sl.value) msgs.push(tr('loiSlLoiLonHon'));

    let th: TuanIso | null = ngay ? tuanIsoCuaNgay(ngay) : null;
    if (!dutDay && normalizeText(r.tuan_thu_hoach)) {
      const so = parseImportInt(String(r.tuan_thu_hoach).replace(/^tu[aầ]n\s*/i, ''));
      if (!so.ok || so.value == null || so.value < 1 || so.value > 53) msgs.push(tr('loiTuanThuHoach'));
      else if (ngay) {
        th = tuanThuHoachTheoNgay(so.value, ngay);
        if (th.tuan > soTuanIsoTrongNam(th.nam)) msgs.push(tr('loiTuanThuHoach'));
      }
    }

    if (msgs.length > 0 || !ngay || !idCn || !tenLo || !th || !sl.ok || sl.value == null) {
      loi.push({ row, msg: msgs.join('; '), values: r });
      return;
    }
    dong.push({
      row,
      ngay,
      id_chi_nhanh: Number(idCn),
      ten_lo: tenLo,
      to_truong: gonTen(normalizeText(r.to_truong)),
      id_mau_1: dutDay ? null : idMau1,
      id_mau_2: dutDay ? null : idMau2,
      xe_doi: !dutDay && CO.has(matchKey(r.xe_doi)),
      th_nam: th.nam,
      th_tuan: th.tuan,
      so_luong: sl.value,
      danh_gia: dutDay ? null : gonTen(normalizeText(r.danh_gia)),
      so_luong_loi: dutDay ? 0 : (slLoi.ok ? (slLoi.value ?? 0) : 0),
      ly_do_loi: dutDay ? null : gonTen(normalizeText(r.ly_do_loi)),
    });
  });

  return { dong, loi };
}
