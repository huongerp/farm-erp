/**
 * Chuyển các dòng Excel → payload ghi vào fp_mh_thanh_toan_doi_tac.
 * Thuần, không React / không db → test trực tiếp.
 *
 * Cột file: so_phieu | ngay | don_vi | nhom_doi_tac | doi_tac | hang_muc_thanh_toan |
 * noi_dung_chi_tiet | so_tien | trang_thai | ngay_xu_ly | ghi_chu.
 * - so_phieu trống: tự sinh (nếu cấu hình bật) — payload để `null`, service sinh lúc ghi.
 * - don_vi: chỉ tra trong chi nhánh người dùng được phép xem; trống → đơn vị mặc định.
 * - nhom_doi_tac: tuỳ chọn; có điền thì đối tác phải thuộc nhóm, đồng thời gỡ mơ hồ khi tên đối tác trùng.
 * - so_tien: ô trống là lỗi (KHÔNG thành 0), phải ≥ 1 như schema form.
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { ImportErrorRow } from '../../../../lib/import-types';
import { matchKey, normalizeCode, normalizeText, parseImportDate, parseImportNumber } from '../../../../lib/import-common';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`thanhToanDoiTac.import.${k}`, o ?? {});

/** Khớp ràng buộc schema.ts. */
export const SO_PHIEU_MAX = 50;
export const HANG_MUC_MAX = 255;

export interface MaTenRefLite {
  id: string;
  ma: string;
  ten: string;
}

export interface DoiTacRefLite extends MaTenRefLite {
  /** id nhóm đối tác (chuỗi) hoặc null nếu chưa phân nhóm. */
  idNhom: string | null;
}

export interface ThanhToanDoiTacImportPayload {
  /** `null` = chờ sinh số phiếu lúc ghi. */
  so_phieu: string | null;
  hang_muc_thanh_toan: string;
  noi_dung_chi_tiet: string | null;
  ngay: string;
  id_don_vi: number;
  id_doi_tac: number;
  id_trang_thai_thanh_toan: number;
  trang_thai: string;
  so_tien: number;
  ngay_xu_ly: string | null;
  ghi_chu: string | null;
}

export interface ThanhToanDoiTacImportItem {
  row: number;
  values: Record<string, unknown>;
  payload: ThanhToanDoiTacImportPayload;
}

export interface ThanhToanDoiTacImportPlan {
  toInsert: ThanhToanDoiTacImportItem[];
  errors: ImportErrorRow[];
}

export interface ImportPlanInput {
  /** Chỉ chi nhánh người dùng được phép xem — ngoài danh sách coi như không tồn tại. */
  chiNhanh: MaTenRefLite[];
  nhom: MaTenRefLite[];
  doiTac: DoiTacRefLite[];
  trangThai: MaTenRefLite[];
  defaultDonViId?: string | null;
  idTrangThaiMacDinh?: string | null;
  /** Bật: dòng trống số phiếu được sinh khi ghi; tắt: dòng trống số phiếu là lỗi. */
  tuSinhSoPhieu: boolean;
}

/** Tra theo mã trước rồi theo tên; tên trùng nhau → `null` (không đoán). */
function buildLookup<T>(list: T[], ma: (x: T) => string, ten: (x: T) => string) {
  const byMa = new Map<string, T>();
  const byTen = new Map<string, T | null>();
  for (const x of list) {
    const m = normalizeCode(ma(x));
    if (m && !byMa.has(m)) byMa.set(m, x);
    const n = matchKey(ten(x));
    if (n) byTen.set(n, byTen.has(n) ? null : x);
  }
  return (input: string): T | null | undefined => byMa.get(normalizeCode(input)) ?? byTen.get(matchKey(input));
}

/**
 * Tra đối tác theo mã hoặc tên. Có `idNhom` thì chỉ nhận đối tác thuộc nhóm đó
 * (và tên trùng giữa các nhóm được gỡ nhờ nhóm).
 */
function buildDoiTacFinder(list: DoiTacRefLite[]) {
  const byMa = new Map<string, DoiTacRefLite>();
  const byTen = new Map<string, DoiTacRefLite[]>();
  for (const d of list) {
    const m = normalizeCode(d.ma);
    if (m && !byMa.has(m)) byMa.set(m, d);
    const n = matchKey(d.ten);
    if (n) byTen.set(n, [...(byTen.get(n) ?? []), d]);
  }
  type Result =
    | { kind: 'ok'; item: DoiTacRefLite }
    | { kind: 'notFound' }
    | { kind: 'ambiguous' }
    | { kind: 'wrongNhom' };
  return (input: string, idNhom: string | null): Result => {
    const hitMa = byMa.get(normalizeCode(input));
    if (hitMa) {
      return idNhom && hitMa.idNhom !== idNhom ? { kind: 'wrongNhom' } : { kind: 'ok', item: hitMa };
    }
    const candidates = byTen.get(matchKey(input)) ?? [];
    if (candidates.length === 0) return { kind: 'notFound' };
    const scoped = idNhom ? candidates.filter((d) => d.idNhom === idNhom) : candidates;
    if (scoped.length === 0) return { kind: 'wrongNhom' };
    if (scoped.length > 1) return { kind: 'ambiguous' };
    return { kind: 'ok', item: scoped[0] };
  };
}

const isBlank = (raw: unknown) => normalizeText(raw) === '';

/**
 * Lập kế hoạch import: mỗi dòng Excel → payload, dòng hỏng → lỗi kèm số dòng thật
 * (ImportDialog gắn sẵn ở `IMPORT_ROW_KEY`), KHÔNG âm thầm bỏ qua. Mọi lỗi của một dòng
 * được gom lại để người dùng sửa một lượt.
 */
export function buildThanhToanDoiTacImportPlan(
  rows: Record<string, unknown>[],
  input: ImportPlanInput
): ThanhToanDoiTacImportPlan {
  const findDonVi = buildLookup(input.chiNhanh, (c) => c.ma, (c) => c.ten);
  const findNhom = buildLookup(input.nhom, (n) => n.ma, (n) => n.ten);
  const findTrangThai = buildLookup(input.trangThai, (s) => s.ma, (s) => s.ten);
  const findDoiTac = buildDoiTacFinder(input.doiTac);
  const defaultDonVi = input.defaultDonViId
    ? input.chiNhanh.find((c) => String(c.id) === String(input.defaultDonViId)) ?? null
    : null;
  const trangThaiMacDinh = input.idTrangThaiMacDinh
    ? input.trangThai.find((s) => String(s.id) === String(input.idTrangThaiMacDinh)) ?? null
    : null;

  const toInsert: ThanhToanDoiTacImportPlan['toInsert'] = [];
  const errors: ImportErrorRow[] = [];
  const soPhieuTrongFile = new Set<string>();

  rows.forEach((raw, idx) => {
    const rowNo = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const { [IMPORT_ROW_KEY]: _ignored, ...values } = raw;
    const errs: string[] = [];

    // Số phiếu
    let soPhieu: string | null = null;
    const soPhieuRaw = normalizeText(raw.so_phieu);
    if (soPhieuRaw) {
      if (soPhieuRaw.length > SO_PHIEU_MAX) errs.push(tr('errSoPhieuMax', { max: SO_PHIEU_MAX }));
      else if (soPhieuTrongFile.has(soPhieuRaw)) errs.push(tr('errSoPhieuTrungFile', { so: soPhieuRaw }));
      else {
        soPhieuTrongFile.add(soPhieuRaw);
        soPhieu = soPhieuRaw;
      }
    } else if (!input.tuSinhSoPhieu) {
      errs.push(tr('errSoPhieuRequired'));
    }

    // Ngày
    const ngay = parseImportDate(raw.ngay);
    if (!ngay) errs.push(tr('errNgay'));

    // Đơn vị
    const donViRaw = normalizeText(raw.don_vi);
    let donVi: MaTenRefLite | null = null;
    if (donViRaw) {
      const hit = findDonVi(donViRaw);
      if (hit === null) errs.push(tr('errDonViAmbiguous', { ten: donViRaw }));
      else if (!hit) errs.push(tr('errDonViNotFound', { ten: donViRaw }));
      else donVi = hit;
    } else if (defaultDonVi) {
      donVi = defaultDonVi;
    } else {
      errs.push(tr('errDonViRequired'));
    }

    // Nhóm đối tác (tuỳ chọn)
    const nhomRaw = normalizeText(raw.nhom_doi_tac);
    let idNhom: string | null = null;
    let nhomOk = true;
    if (nhomRaw) {
      const hit = findNhom(nhomRaw);
      if (hit === null) {
        errs.push(tr('errNhomAmbiguous', { ten: nhomRaw }));
        nhomOk = false;
      } else if (!hit) {
        errs.push(tr('errNhomNotFound', { ten: nhomRaw }));
        nhomOk = false;
      } else {
        idNhom = String(hit.id);
      }
    }

    // Đối tác
    const doiTacRaw = normalizeText(raw.doi_tac);
    let doiTac: DoiTacRefLite | null = null;
    if (!doiTacRaw) {
      errs.push(tr('errDoiTacRequired'));
    } else if (nhomOk) {
      const res = findDoiTac(doiTacRaw, idNhom);
      if (res.kind === 'ok') doiTac = res.item;
      else if (res.kind === 'ambiguous') errs.push(tr('errDoiTacAmbiguous', { ten: doiTacRaw }));
      else if (res.kind === 'wrongNhom') errs.push(tr('errDoiTacSaiNhom', { ten: doiTacRaw, nhom: nhomRaw }));
      else errs.push(tr('errDoiTacNotFound', { ten: doiTacRaw }));
    }

    // Hạng mục thanh toán
    const hangMuc = normalizeText(raw.hang_muc_thanh_toan);
    if (!hangMuc) errs.push(tr('errHangMucRequired'));
    else if (hangMuc.length > HANG_MUC_MAX) errs.push(tr('errHangMucMax', { max: HANG_MUC_MAX }));

    // Số tiền: ô trống KHÔNG được thành 0
    const soTien = parseImportNumber(raw.so_tien);
    let soTienVal = 0;
    if (!soTien.ok) errs.push(tr('errSoTien'));
    else if (soTien.value === null) errs.push(tr('errSoTienRequired'));
    // Khớp schema form (min 1) — phiếu nhập vào mở ra sửa không bị form chặn.
    else if (soTien.value < 1) errs.push(tr('errSoTienZero'));
    else soTienVal = soTien.value;

    // Trạng thái
    const trangThaiRaw = normalizeText(raw.trang_thai);
    let trangThai: MaTenRefLite | null = null;
    if (trangThaiRaw) {
      const hit = findTrangThai(trangThaiRaw);
      if (hit === null) errs.push(tr('errTrangThaiAmbiguous', { ten: trangThaiRaw }));
      else if (!hit) errs.push(tr('errTrangThaiNotFound', { ten: trangThaiRaw }));
      else trangThai = hit;
    } else if (trangThaiMacDinh) {
      trangThai = trangThaiMacDinh;
    } else {
      errs.push(tr('errTrangThaiRequired'));
    }

    // Ngày xử lý (tuỳ chọn, có điền mà hỏng → lỗi)
    let ngayXuLy: string | null = null;
    if (!isBlank(raw.ngay_xu_ly)) {
      ngayXuLy = parseImportDate(raw.ngay_xu_ly);
      if (!ngayXuLy) errs.push(tr('errNgayXuLy'));
    }

    if (errs.length > 0 || !ngay || !donVi || !doiTac || !trangThai) {
      errors.push({ row: rowNo, msg: errs.join('; '), values });
      return;
    }

    toInsert.push({
      row: rowNo,
      values,
      payload: {
        so_phieu: soPhieu,
        hang_muc_thanh_toan: hangMuc,
        noi_dung_chi_tiet: normalizeText(raw.noi_dung_chi_tiet) ? String(raw.noi_dung_chi_tiet).trim() : null,
        ngay,
        id_don_vi: Number(donVi.id),
        id_doi_tac: Number(doiTac.id),
        id_trang_thai_thanh_toan: Number(trangThai.id),
        trang_thai: trangThai.ten,
        so_tien: soTienVal,
        ngay_xu_ly: ngayXuLy,
        ghi_chu: normalizeText(raw.ghi_chu) ? String(raw.ghi_chu).trim() : null,
      },
    });
  });

  return { toInsert, errors };
}

/**
 * Tách các dòng có số phiếu đã tồn tại trong DB (`daCo`) ra thành lỗi — chạy sau
 * `buildThanhToanDoiTacImportPlan`, trước khi ghi.
 */
export function loaiDongTrungSoPhieuDb(
  plan: ThanhToanDoiTacImportPlan,
  daCo: Set<string>
): ThanhToanDoiTacImportPlan {
  if (daCo.size === 0) return plan;
  const toInsert: ThanhToanDoiTacImportItem[] = [];
  const errors = [...plan.errors];
  for (const item of plan.toInsert) {
    const so = item.payload.so_phieu;
    if (so && daCo.has(so)) errors.push({ row: item.row, msg: tr('errSoPhieuTrungDb', { so }), values: item.values });
    else toInsert.push(item);
  }
  errors.sort((a, b) => a.row - b.row);
  return { toInsert, errors };
}
