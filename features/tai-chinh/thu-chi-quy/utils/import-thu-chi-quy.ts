/**
 * Chuyển các dòng Excel sổ quỹ cũ → payload ghi vào fp_tc_quy_thu_chi.
 * Thuần, không React / không db → test trực tiếp.
 *
 * Cột file gốc: NGÀY | FARM | DIỄN GIẢI | SỐ LƯỢNG | ĐƠN GIÁ | HẠNG MỤC | THU | CHI |
 * TỒN QUỸ | SỐ ĐỀ XUẤT | GHI CHÚ.
 * - Cột TỒN QUỸ CỐ Ý bỏ qua — hệ thống tự tính lũy kế ở view.
 * - SỐ LƯỢNG / ĐƠN GIÁ ghi vào cột riêng, đồng thời gộp vào GHI CHÚ vì màn hình
 *   chưa hiện hai cột này — dữ liệu sổ cũ vẫn thấy được.
 * - FARM: mã hoặc tên; trống thì lấy farm đang chọn trên thanh công cụ (nếu chọn đúng một).
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { ImportErrorRow } from '../../../../lib/import-types';
import { matchKey, normalizeCode, normalizeText, parseImportDate, parseImportNumber } from '../../../../lib/import-common';
import type { LoaiThuChi } from '../core/types';

/** Giữ export cũ: hàm đã chuyển lên lib/import-common để các module import dùng chung. */
export { parseImportDate };

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`thuChiQuy.import.${k}`, o ?? {});

export interface HangMucRefLite {
  id: string;
  ma: string;
  ten: string;
  loai: 'thu' | 'chi' | 'ca_hai';
}

export interface ChiNhanhRefLite {
  id: string;
  ma: string;
  ten: string;
}

export interface ThuChiQuyImportPayload {
  ngay: string;
  id_chi_nhanh: number;
  ten_chi_nhanh: string | null;
  loai: LoaiThuChi;
  so_tien: number;
  so_luong: number | null;
  don_gia: number | null;
  id_hang_muc: number;
  ten_hang_muc: string | null;
  dien_giai: string;
  ghi_chu: string | null;
  so_chung_tu: string | null;
}

export interface ThuChiQuyImportPlan {
  toInsert: { row: number; values: Record<string, unknown>; payload: ThuChiQuyImportPayload }[];
  errors: ImportErrorRow[];
}

export interface ImportPlanInput {
  hangMuc: HangMucRefLite[];
  /** Chỉ những farm người dùng được phép xem/ghi — farm ngoài danh sách coi như không tồn tại. */
  chiNhanh: ChiNhanhRefLite[];
  /** Farm đang chọn trên thanh công cụ (khi chọn đúng một) — dùng cho dòng để trống cột Farm. */
  defaultChiNhanhId?: string | null;
}

/** Ghép số lượng / đơn giá của sổ cũ vào ghi chú (không còn cột riêng trên UI). */
export function gopGhiChu(
  ghiChu: string,
  soLuong: number | null,
  donGia: number | null
): string | null {
  const phan: string[] = [];
  if (soLuong != null) phan.push(`SL ${soLuong}`);
  if (donGia != null) phan.push(`ĐG ${donGia.toLocaleString('vi-VN')}`);
  const themVao = phan.join(' × ');
  const goc = ghiChu.trim();
  if (!themVao) return goc || null;
  return goc ? `${goc} (${themVao})` : themVao;
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
 * Lập kế hoạch import: mỗi dòng Excel → payload, dòng hỏng → lỗi kèm số dòng thật
 * (ImportDialog gắn sẵn ở `IMPORT_ROW_KEY`), KHÔNG âm thầm bỏ qua. Mọi lỗi của một dòng
 * được gom lại để người dùng sửa một lượt.
 */
export function buildThuChiQuyImportPlan(
  rows: Record<string, unknown>[],
  input: ImportPlanInput
): ThuChiQuyImportPlan {
  const findHangMuc = buildLookup(input.hangMuc, (h) => h.ma, (h) => h.ten);
  const findFarm = buildLookup(input.chiNhanh, (c) => c.ma, (c) => c.ten);
  const defaultFarm = input.defaultChiNhanhId
    ? input.chiNhanh.find((c) => String(c.id) === String(input.defaultChiNhanhId)) ?? null
    : null;
  const toInsert: ThuChiQuyImportPlan['toInsert'] = [];
  const errors: ImportErrorRow[] = [];

  rows.forEach((raw, idx) => {
    const rowNo = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const { [IMPORT_ROW_KEY]: _ignored, ...values } = raw;
    const errs: string[] = [];

    const farmRaw = normalizeText(raw.chi_nhanh);
    let farm: ChiNhanhRefLite | null = null;
    if (farmRaw) {
      const hit = findFarm(farmRaw);
      if (hit === null) errs.push(tr('errFarmAmbiguous', { ten: farmRaw }));
      else if (!hit) errs.push(tr('errFarmNotFound', { ten: farmRaw }));
      else farm = hit;
    } else if (defaultFarm) {
      farm = defaultFarm;
    } else {
      errs.push(tr('errFarmRequired'));
    }

    const ngay = parseImportDate(raw.ngay);
    if (!ngay) errs.push(tr('errNgay'));

    const dienGiai = normalizeText(raw.dien_giai);
    if (!dienGiai) errs.push(tr('errDienGiai'));

    const thu = parseImportNumber(raw.thu);
    const chi = parseImportNumber(raw.chi);
    let loai: LoaiThuChi | null = null;
    let soTien = 0;
    if (!thu.ok || !chi.ok) {
      errs.push(tr('errSoTien'));
    } else {
      const thuVal = thu.value ?? 0;
      const chiVal = chi.value ?? 0;
      if (thuVal > 0 && chiVal > 0) errs.push(tr('errThuVaChi'));
      else if (thuVal <= 0 && chiVal <= 0) errs.push(tr('errSoTienZero'));
      else {
        loai = thuVal > 0 ? 'thu' : 'chi';
        soTien = thuVal > 0 ? thuVal : chiVal;
      }
    }

    const soLuong = parseImportNumber(raw.so_luong);
    const donGia = parseImportNumber(raw.don_gia);
    if (!soLuong.ok || !donGia.ok) errs.push(tr('errSoLuongDonGia'));

    // Form bắt buộc hạng mục — import cũng vậy, để phiếu nhập vào mở ra sửa không bị form chặn.
    const hangMucRaw = normalizeText(raw.hang_muc);
    let hangMuc: HangMucRefLite | null = null;
    if (!hangMucRaw) {
      errs.push(tr('errHangMucRequired'));
    } else {
      const hit = findHangMuc(hangMucRaw);
      if (hit === null) errs.push(tr('errHangMucAmbiguous', { ten: hangMucRaw }));
      else if (!hit) errs.push(tr('errHangMuc', { ten: hangMucRaw }));
      else if (loai && hit.loai !== 'ca_hai' && hit.loai !== loai) errs.push(tr('errHangMucLoai', { ten: hit.ten }));
      else hangMuc = hit;
    }

    if (errs.length > 0 || !farm || !ngay || !loai || !hangMuc) {
      errors.push({ row: rowNo, msg: errs.join('; '), values });
      return;
    }

    const soLuongVal = soLuong.ok ? soLuong.value : null;
    const donGiaVal = donGia.ok ? donGia.value : null;
    toInsert.push({
      row: rowNo,
      values,
      payload: {
        ngay,
        id_chi_nhanh: Number(farm.id),
        ten_chi_nhanh: farm.ten || null,
        loai,
        so_tien: soTien,
        so_luong: soLuongVal,
        don_gia: donGiaVal,
        id_hang_muc: Number(hangMuc.id),
        ten_hang_muc: hangMuc.ten ?? null,
        dien_giai: dienGiai,
        ghi_chu: gopGhiChu(normalizeText(raw.ghi_chu), soLuongVal, donGiaVal),
        so_chung_tu: normalizeText(raw.so_chung_tu) || null,
      },
    });
  });

  return { toInsert, errors };
}
