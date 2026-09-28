/**
 * Import nhân viên từ Excel: dòng → `EmployeeFormValues`, validate bằng CHÍNH `employeeSchema`
 * của form để import không tạo ra hồ sơ mà form từ chối lưu khi sửa.
 * Thuần, không React / không db → test trực tiếp.
 *
 * Không có cột mật khẩu: service cấp mật khẩu mặc định + buộc đổi ở lần đăng nhập đầu
 * (mật khẩu không được nằm trong file Excel đi qua tay nhiều người).
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { ImportErrorRow } from '../../../../lib/import-types';
import { matchKey, normalizeCode, normalizeHeader, normalizeText, parseImportDate } from '../../../../lib/import-common';
import { TRANG_THAI_NV } from '../../../../lib/constants';
import { employeeSchema, type EmployeeFormValues } from '../core/schema';
import { getDefaultEmployeeFormValues } from './employee-to-form';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`employee.import.${k}`, o ?? {});

export interface RefLite {
  id: string;
  ma?: string;
  ten: string;
}

export interface CapBacRefLite extends RefLite {
  cap_bac: number;
}

export interface NhanVienImportInput {
  chiNhanh: RefLite[];
  phongBan: RefLite[];
  chucVu: RefLite[];
  capBac: CapBacRefLite[];
  /** Email đã có trong hệ thống (lowercase). */
  existingEmails: string[];
}

export interface NhanVienImportPlan {
  toCreate: { row: number; values: Record<string, unknown>; data: EmployeeFormValues }[];
  errors: ImportErrorRow[];
}

export const GIOI_TINH_VALUES = ['Nam', 'Nữ', 'Khác'] as const;
export const LOAI_HOP_DONG_VALUES = ['Thử việc', 'Có thời hạn', 'Không thời hạn', 'Thời vụ'] as const;
export const TRANG_THAI_NV_VALUES = Object.values(TRANG_THAI_NV);

/** Khớp một giá trị trong danh sách cố định, bỏ qua dấu / hoa thường. */
function pickValue<T extends string>(raw: string, values: readonly T[]): T | null {
  const n = normalizeHeader(raw);
  return values.find((v) => normalizeHeader(v) === n) ?? null;
}

/** Tra mã trước rồi tên; tên trùng → `null` (không đoán). */
function buildLookup(list: RefLite[]) {
  const byMa = new Map<string, RefLite>();
  const byTen = new Map<string, RefLite | null>();
  list.forEach((x) => {
    const m = normalizeCode(x.ma);
    if (m && !byMa.has(m)) byMa.set(m, x);
    const n = matchKey(x.ten);
    if (n) byTen.set(n, byTen.has(n) ? null : x);
  });
  return (input: string): RefLite | null | undefined => byMa.get(normalizeCode(input)) ?? byTen.get(matchKey(input));
}

/**
 * Excel hay biến "0912345678" thành số 912345678 (mất số 0 đầu). Ô dạng số có 9–10 chữ số
 * thì thêm lại số 0; bỏ khoảng trắng / dấu chấm / gạch người dùng gõ cho dễ đọc.
 */
export function normalizePhone(raw: unknown): string {
  if (typeof raw === 'number' && Number.isInteger(raw)) {
    const s = String(raw);
    return s.length >= 9 && s.length <= 10 ? `0${s}` : s;
  }
  return String(raw ?? '').replace(/[\s.\-()]/g, '');
}

/** CCCD 12 số hay bắt đầu bằng 0 — Excel lưu thành số thì mất số 0 đầu. */
export function normalizeCccd(raw: unknown): string {
  if (typeof raw === 'number' && Number.isInteger(raw)) return String(raw).padStart(12, '0');
  return String(raw ?? '').replace(/\s/g, '');
}

export function planNhanVienImport(rows: Record<string, unknown>[], input: NhanVienImportInput): NhanVienImportPlan {
  const findChiNhanh = buildLookup(input.chiNhanh);
  const findPhongBan = buildLookup(input.phongBan);
  const findChucVu = buildLookup(input.chucVu);
  const findCapBac = buildLookup(input.capBac);
  const capBacBySo = new Map(input.capBac.map((c) => [c.cap_bac, c]));
  const existing = new Set(input.existingEmails.map((e) => e.trim().toLowerCase()));
  const seenEmail = new Map<string, number>();

  const toCreate: NhanVienImportPlan['toCreate'] = [];
  const errors: ImportErrorRow[] = [];

  rows.forEach((raw, idx) => {
    const row = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const { [IMPORT_ROW_KEY]: _ignored, ...values } = raw;
    const errs: string[] = [];

    const resolveRef = (value: string, find: (s: string) => RefLite | null | undefined, label: string) => {
      const hit = find(value);
      if (hit === null) errs.push(tr('errAmbiguous', { label, value }));
      else if (!hit) errs.push(tr('errNotFound', { label, value }));
      return hit ?? null;
    };

    const email = normalizeText(raw.email).toLowerCase();
    if (email) {
      if (existing.has(email)) errs.push(tr('errEmailExists', { value: email }));
      const seenAt = seenEmail.get(email);
      if (seenAt != null) errs.push(tr('errEmailDuplicateInFile', { row: seenAt }));
      else seenEmail.set(email, row);
    }

    const gioiTinhRaw = normalizeText(raw.gioi_tinh);
    const gioiTinh = gioiTinhRaw ? pickValue(gioiTinhRaw, GIOI_TINH_VALUES) : null;
    if (!gioiTinh) errs.push(tr('errGioiTinh', { value: gioiTinhRaw }));

    const ngayVaoLamRaw = raw.ngay_vao_lam;
    const ngayVaoLam = parseImportDate(ngayVaoLamRaw);
    if (!ngayVaoLam) errs.push(tr('errDate', { label: tr('colNgayVaoLam'), value: String(ngayVaoLamRaw ?? '') }));

    const chiNhanhIds: string[] = [];
    normalizeText(raw.chi_nhanh)
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => {
        const hit = resolveRef(s, findChiNhanh, tr('colChiNhanh'));
        if (hit && !chiNhanhIds.includes(hit.id)) chiNhanhIds.push(hit.id);
      });

    const phongBanRaw = normalizeText(raw.phong_ban);
    const phongBan = phongBanRaw ? resolveRef(phongBanRaw, findPhongBan, tr('colPhongBan')) : null;
    const chucVuRaw = normalizeText(raw.chuc_vu);
    const chucVu = chucVuRaw ? resolveRef(chucVuRaw, findChucVu, tr('colChucVu')) : null;

    const capBacRaw = normalizeText(raw.cap_bac);
    let capBacId = '';
    if (capBacRaw) {
      const bySo = /^\d+$/.test(capBacRaw) ? capBacBySo.get(Number(capBacRaw)) : undefined;
      const hit = bySo ?? resolveRef(capBacRaw, findCapBac, tr('colCapBac'));
      if (hit) capBacId = hit.id;
    }

    const trangThaiRaw = normalizeText(raw.trang_thai);
    const trangThai = trangThaiRaw ? pickValue(trangThaiRaw, TRANG_THAI_NV_VALUES) : TRANG_THAI_NV.DANG_LAM_VIEC;
    if (!trangThai) errs.push(tr('errTrangThai', { value: trangThaiRaw }));

    const loaiHdRaw = normalizeText(raw.loai_hop_dong);
    const loaiHd = loaiHdRaw ? pickValue(loaiHdRaw, LOAI_HOP_DONG_VALUES) : '';
    if (loaiHd === null) errs.push(tr('errLoaiHopDong', { value: loaiHdRaw }));

    const optionalDate = (key: string, label: string): string => {
      const v = raw[key];
      if (v === null || v === undefined || String(v).trim() === '') return '';
      const d = parseImportDate(v);
      if (!d) errs.push(tr('errDate', { label, value: String(v) }));
      return d ?? '';
    };
    const ngaySinh = optionalDate('ngay_sinh', tr('colNgaySinh'));
    const ngayHetHan = optionalDate('ngay_het_han_hd', tr('colNgayHetHanHd'));

    const data: EmployeeFormValues = {
      ...getDefaultEmployeeFormValues(ngayVaoLam ?? ''),
      ho_ten: normalizeText(raw.ho_ten),
      email,
      so_dien_thoai: normalizePhone(raw.so_dien_thoai),
      gioi_tinh: gioiTinh ?? 'Nam',
      trang_thai: trangThai ?? TRANG_THAI_NV.DANG_LAM_VIEC,
      id_chi_nhanh: chiNhanhIds,
      id_phong_ban: phongBan?.id ?? '',
      id_chuc_vu: chucVu?.id ?? '',
      id_cap_bac: capBacId,
      loai_hop_dong: loaiHd ?? '',
      ngay_het_han_hd: ngayHetHan,
      ngay_sinh: ngaySinh,
      cmnd_cccd: normalizeCccd(raw.cmnd_cccd),
      dia_chi_cu_the: normalizeText(raw.dia_chi_cu_the),
    };

    // Chạy đúng schema của form: bắt thêm họ tên ngắn, email / SĐT / CCCD sai định dạng, thiếu
    // phòng ban / chức vụ / chi nhánh, HĐ có thời hạn thiếu ngày hết hạn… Chỉ lấy lỗi chưa báo ở trên.
    const parsed = employeeSchema.safeParse(data);
    if (!parsed.success) {
      const reported = new Set(['gioi_tinh', 'trang_thai']);
      if (!ngayVaoLam) reported.add('ngay_vao_lam');
      parsed.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? '');
        if (reported.has(field)) return;
        // Ô có điền nhưng tra không ra đã báo "không tìm thấy" — không báo thêm "bắt buộc".
        if (field === 'id_chi_nhanh' && normalizeText(raw.chi_nhanh)) return;
        if (field === 'id_phong_ban' && phongBanRaw) return;
        if (field === 'id_chuc_vu' && chucVuRaw) return;
        reported.add(field);
        errs.push(issue.message);
      });
    }

    if (errs.length > 0) {
      errors.push({ row, msg: errs.join('; '), values });
      return;
    }
    toCreate.push({ row, values, data: parsed.success ? parsed.data : data });
  });

  return { toCreate, errors };
}
