/**
 * Phân nhóm nguyên nhân lỗi của Đánh giá đầu vào — thuần, không React, không gọi db.
 *
 * Mỗi lý do trong danh mục (`fp_var_dgdv_ly_do`) gắn một nhóm (`fp_var_dgdv_nhom_loi`, cột `id_nhom_loi`).
 * Ô đánh giá / lý do huỷ là chữ gõ tay, có thể ghép nhiều lỗi («Trầy khô 4,Nấm xanh 6») → `tachLoi` tách,
 * bỏ số đi kèm; khớp danh mục bằng `khoaTen` (không phân biệt hoa thường / khoảng trắng).
 * Dòng ghép nhiều lỗi: mỗi phần tính ĐỦ số buồng của dòng vào nhóm của nó (1 buồng có thể đếm ở nhiều
 * nhóm — như bảng Excel của khách), nên tổng các nhóm có thể lớn hơn số buồng lỗi thực tế.
 */
import type { VarDgdvLyDo, VarDgdvNhomLoi } from './types';
import { gonTen, khoaTen } from './chuan-hoa-ten';

/** Một dòng view `v_fp_farm_dgdv_loi_ngay`: chữ lỗi đã gom theo ngày × chi nhánh × lô. */
export interface DgdvLoiNgayRow {
  ngay: string;
  id_chi_nhanh: string;
  id_lo: string;
  /** `danh_gia` = ô «Đánh giá», `huy` = ô «Lý do huỷ» */
  loai: 'danh_gia' | 'huy';
  /** chữ gốc (có thể ghép nhiều lỗi, có số đi kèm) */
  ten: string;
  so_buong: number;
}

export interface KqChiTietLoi {
  ten: string;
  soDanhGia: number;
  soHuy: number;
}

export interface KqNhomLoi {
  /** null = nhóm ảo «Chưa phân loại» */
  id: string | null;
  ten: string;
  ma_mau: string;
  soDanhGia: number;
  soHuy: number;
  /** soDanhGia + soHuy */
  so: number;
  /** % trên tổng thu (0–100); tổng thu 0 → null */
  tiLeTrenThu: number | null;
  /** % trong tổng số buồng lỗi của mọi nhóm kể cả «Chưa phân loại»; tổng lỗi 0 → null */
  tiLeTrongTongLoi: number | null;
  chiTiet: KqChiTietLoi[];
}

export interface KqNhomLoiTong {
  /** nhóm đang dùng, xếp theo `thu_tu` */
  dsNhom: KqNhomLoi[];
  /** lỗi chưa gán nhóm / không có trong danh mục */
  chuaPhanLoai: KqNhomLoi;
}

/** Màu nhóm ảo «Chưa phân loại» (nhóm thật lấy `ma_mau` của danh mục). */
export const MAU_CHUA_PHAN_LOAI = '#9CA3AF';

/** Số / «x2» dính ở đuôi mỗi phần («trầy khô2», «Rớt cap 3», «Rệp sáp x2») — bỏ khi tách. */
const SO_DUOI_RE = /[\s\-–—:]*\(?\s*[xX×]?\s*\d+(?:[.,]\d+)?\s*\)?\s*$/;

/**
 * Tách chuỗi lỗi ghép thành từng tên lỗi: cắt `,` `;` `+`, bỏ số / «x2» ở đuôi mỗi phần, gọn khoảng
 * trắng. Rỗng → []. Trùng nhau trong cùng một ô chỉ tính một lần.
 */
export function tachLoi(text: string | null | undefined): string[] {
  const m = new Map<string, string>();
  for (const phan of (text ?? '').split(/[,;+]/)) {
    let s = phan.trim();
    // Bỏ số đuôi lặp lại («Trầy khô 4 5» hiếm, nhưng bỏ cho chắc).
    let truoc = '';
    while (s !== truoc) {
      truoc = s;
      s = s.replace(SO_DUOI_RE, '');
    }
    // Phần chỉ có số («1») sau khi bỏ → rỗng.
    const ten = gonTen(s);
    if (!ten || /^\d+$/.test(ten)) continue;
    const k = khoaTen(ten);
    if (!m.has(k)) m.set(k, ten);
  }
  return [...m.values()];
}

/** `khoaTen(ten)` → id nhóm của lý do theo từng loai; cùng tên nhiều lý do thì lấy lý do đã gán trước. */
export interface MapNhomTheoTen {
  danh_gia: Map<string, string>;
  loi: Map<string, string>;
}

/**
 * Khoá so khớp tên lý do: `khoaTen` + chuẩn hoá dấu nối («Nấm xanh,rệp sáp» = «nấm xanh, rệp sáp»).
 * Dùng cho cả danh mục lẫn chữ đã tách, để tên chuẩn có dấu phẩy («Trầy, dập tươi») khớp được.
 */
export function khoaLoi(s: string | null | undefined): string {
  return khoaTen(s).replace(/\s*[,;+]\s*/g, ', ');
}

/** Tập khoá mọi tên trong danh mục (đã gán nhóm hay chưa), đã bỏ số đuôi giống `tachLoi`. */
function taoTapTen(dsLyDo: readonly VarDgdvLyDo[]): Set<string> {
  const tap = new Set<string>();
  for (const l of dsLyDo) {
    const k = khoaLoi(tachLoi(l.ten).join(', '));
    if (k) tap.add(k);
  }
  return tap;
}

/**
 * Tách ô lỗi nhưng giữ nguyên tên ghép có trong danh mục: «Côn trùng, sâu bọ» là MỘT lý do chuẩn, không phải
 * hai lỗi. Sau `tachLoi`, gộp tham lam các phần liền nhau nếu chuỗi gộp trùng một tên danh mục (dài nhất trước).
 */
export function tachLoiTheoDanhMuc(text: string | null | undefined, tapTen: ReadonlySet<string>): string[] {
  const phan = tachLoi(text);
  const kq: string[] = [];
  let i = 0;
  ngoai: while (i < phan.length) {
    for (let j = phan.length - 1; j > i; j--) {
      const ghep = phan.slice(i, j + 1).join(', ');
      if (tapTen.has(khoaLoi(ghep))) {
        kq.push(ghep);
        i = j + 1;
        continue ngoai;
      }
    }
    kq.push(phan[i]);
    i += 1;
  }
  return kq;
}

/** Dựng bảng tra tên lý do → nhóm, tách theo `loai` để ưu tiên đúng ô. */
export function taoMapNhom(dsLyDo: readonly VarDgdvLyDo[]): MapNhomTheoTen {
  const danh_gia = new Map<string, string>();
  const loi = new Map<string, string>();
  for (const l of dsLyDo) {
    if (!l.id_nhom_loi) continue;
    const k = khoaLoi(tachLoi(l.ten).join(', '));
    if (!k) continue;
    const m = l.loai === 'loi' ? loi : danh_gia;
    if (!m.has(k)) m.set(k, l.id_nhom_loi);
  }
  return { danh_gia, loi };
}

/** Nhóm của một tên lỗi: ưu tiên cùng loai (`danh_gia`↔`danh_gia`, `huy`↔`loi`), không có thì lấy loai kia. */
function nhomCuaTen(map: MapNhomTheoTen, ten: string, loai: DgdvLoiNgayRow['loai']): string | null {
  const k = khoaLoi(ten);
  if (loai === 'huy') return map.loi.get(k) ?? map.danh_gia.get(k) ?? null;
  return map.danh_gia.get(k) ?? map.loi.get(k) ?? null;
}

interface GioDem {
  soDanhGia: number;
  soHuy: number;
  chiTiet: Map<string, KqChiTietLoi>;
}

const gioMoi = (): GioDem => ({ soDanhGia: 0, soHuy: 0, chiTiet: new Map() });

const congVao = (g: GioDem, r: DgdvLoiNgayRow, ten: string) => {
  const so = Number.isFinite(r.so_buong) ? r.so_buong : 0;
  if (so <= 0) return;
  if (r.loai === 'huy') g.soHuy += so;
  else g.soDanhGia += so;
  const k = khoaLoi(ten);
  const ct = g.chiTiet.get(k) ?? { ten, soDanhGia: 0, soHuy: 0 };
  if (r.loai === 'huy') ct.soHuy += so;
  else ct.soDanhGia += so;
  g.chiTiet.set(k, ct);
};

const ketQua = (id: string | null, ten: string, ma_mau: string, g: GioDem, tongThu: number, tongLoi: number): KqNhomLoi => {
  const so = g.soDanhGia + g.soHuy;
  return {
    id,
    ten,
    ma_mau,
    soDanhGia: g.soDanhGia,
    soHuy: g.soHuy,
    so,
    tiLeTrenThu: tongThu > 0 ? (so / tongThu) * 100 : null,
    tiLeTrongTongLoi: tongLoi > 0 ? (so / tongLoi) * 100 : null,
    chiTiet: [...g.chiTiet.values()].sort(
      (a, b) => b.soDanhGia + b.soHuy - (a.soDanhGia + a.soHuy) || a.ten.localeCompare(b.ten, 'vi')
    ),
  };
};

/**
 * Gom lỗi theo nhóm nguyên nhân. `dsNhom` chỉ nhóm `dang_dung`, xếp theo `thu_tu`; nhóm không có lỗi vẫn
 * có dòng (số 0). Lỗi chưa gán / không có trong danh mục vào `chuaPhanLoai`.
 */
export function tongHopNhomLoi(
  rows: readonly DgdvLoiNgayRow[],
  dsLyDo: readonly VarDgdvLyDo[],
  dsNhom: readonly VarDgdvNhomLoi[],
  tongThu: number
): KqNhomLoiTong {
  const map = taoMapNhom(dsLyDo);
  const tapTen = taoTapTen(dsLyDo);
  const nhomDung = dsNhom
    .filter((n) => n.dang_dung)
    .slice()
    .sort((a, b) => a.thu_tu - b.thu_tu || a.ten.localeCompare(b.ten, 'vi'));
  const gio = new Map<string, GioDem>(nhomDung.map((n) => [n.id, gioMoi()]));
  const chua = gioMoi();

  for (const r of rows) {
    for (const ten of tachLoiTheoDanhMuc(r.ten, tapTen)) {
      const id = nhomCuaTen(map, ten, r.loai);
      const g = id ? gio.get(id) : undefined;
      if (g) congVao(g, r, ten);
      else congVao(chua, r, ten);
    }
  }

  let tongLoi = chua.soDanhGia + chua.soHuy;
  for (const g of gio.values()) tongLoi += g.soDanhGia + g.soHuy;

  return {
    dsNhom: nhomDung.map((n) => ketQua(n.id, n.ten, n.ma_mau, gio.get(n.id) ?? gioMoi(), tongThu, tongLoi)),
    chuaPhanLoai: ketQua(null, '', MAU_CHUA_PHAN_LOAI, chua, tongThu, tongLoi),
  };
}

// ---- Bảng theo lô -------------------------------------------------------------------

export interface KqNhomLoiLo {
  id_lo: string;
  id_chi_nhanh: string;
  soDanhGia: number;
  soHuy: number;
  /** id nhóm → số buồng; nhóm khoá '' = chưa phân loại */
  theoNhom: Record<string, { soDanhGia: number; soHuy: number }>;
  /** tên lỗi chưa phân loại → số buồng */
  chuaPhanLoai: KqChiTietLoi[];
}

/**
 * Bảng theo lô (cột = nhóm): cùng cách tính `tongHopNhomLoi`, gom theo `id_lo`. Xếp theo chi nhánh rồi id lô.
 */
export function tongHopNhomLoiTheoLo(
  rows: readonly DgdvLoiNgayRow[],
  dsLyDo: readonly VarDgdvLyDo[]
): KqNhomLoiLo[] {
  const map = taoMapNhom(dsLyDo);
  const tapTen = taoTapTen(dsLyDo);
  const m = new Map<string, KqNhomLoiLo & { chiTietChua: Map<string, KqChiTietLoi> }>();
  for (const r of rows) {
    const k = `${r.id_chi_nhanh}|${r.id_lo}`;
    let d = m.get(k);
    if (!d) {
      d = {
        id_lo: r.id_lo,
        id_chi_nhanh: r.id_chi_nhanh,
        soDanhGia: 0,
        soHuy: 0,
        theoNhom: {},
        chuaPhanLoai: [],
        chiTietChua: new Map(),
      };
      m.set(k, d);
    }
    for (const ten of tachLoiTheoDanhMuc(r.ten, tapTen)) {
      const so = Number.isFinite(r.so_buong) ? r.so_buong : 0;
      if (so <= 0) continue;
      const id = nhomCuaTen(map, ten, r.loai) ?? '';
      const o = d.theoNhom[id] ?? { soDanhGia: 0, soHuy: 0 };
      if (r.loai === 'huy') {
        o.soHuy += so;
        d.soHuy += so;
      } else {
        o.soDanhGia += so;
        d.soDanhGia += so;
      }
      d.theoNhom[id] = o;
      if (id === '') {
        const ck = khoaLoi(ten);
        const ct = d.chiTietChua.get(ck) ?? { ten, soDanhGia: 0, soHuy: 0 };
        if (r.loai === 'huy') ct.soHuy += so;
        else ct.soDanhGia += so;
        d.chiTietChua.set(ck, ct);
      }
    }
  }
  return [...m.values()]
    .map(({ chiTietChua, ...d }) => ({
      ...d,
      chuaPhanLoai: [...chiTietChua.values()].sort(
        (a, b) => b.soDanhGia + b.soHuy - (a.soDanhGia + a.soHuy) || a.ten.localeCompare(b.ten, 'vi')
      ),
    }))
    .sort((a, b) => a.id_chi_nhanh.localeCompare(b.id_chi_nhanh) || a.id_lo.localeCompare(b.id_lo, 'vi', { numeric: true }));
}
