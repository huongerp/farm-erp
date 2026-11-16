/**
 * Import danh sách tài sản: dòng Excel → `TaiSanFormValues`, validate bằng `taiSanSchema` của form.
 * Nhóm / nơi lưu / trạng thái tra theo mã hoặc tên. Thuần, không React / không db → test trực tiếp.
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY, type ImportErrorRow } from '../../../../lib/import-types';
import {
  buildRefLookup,
  normalizeCode,
  normalizeText,
  parseImportDate,
  parseImportNumber,
  schemaIssueMessages,
} from '../../../../lib/import-common';
import { taiSanSchema, type TaiSanFormValues } from '../core/schema';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`danhSachTaiSan.import.${k}`, o ?? {});

export interface TaiSanImportRefs {
  nhom: { id: string; ma: string; ten: string }[];
  noiLuu: { id: string; ma_noi_luu: string; ten_noi_luu: string }[];
  trangThai: { id: string; ma: string; ten: string }[];
}

export interface TaiSanImportPlan {
  toCreate: { row: number; values: Record<string, unknown>; data: TaiSanFormValues }[];
  errors: ImportErrorRow[];
}

export function planTaiSanImport(rows: Record<string, unknown>[], refs: TaiSanImportRefs): TaiSanImportPlan {
  const lookups = {
    id_nhom: { find: buildRefLookup(refs.nhom, (x) => x.ma, (x) => x.ten), col: 'nhom', label: tr('refNhom') },
    id_noi_luu: {
      find: buildRefLookup(refs.noiLuu, (x) => x.ma_noi_luu, (x) => x.ten_noi_luu),
      col: 'noi_luu',
      label: tr('refNoiLuu'),
    },
    id_trang_thai: {
      find: buildRefLookup(refs.trangThai, (x) => x.ma, (x) => x.ten),
      col: 'trang_thai',
      label: tr('refTrangThai'),
    },
  } as const;

  const toCreate: TaiSanImportPlan['toCreate'] = [];
  const errors: ImportErrorRow[] = [];
  const seenMa = new Map<string, number>();

  rows.forEach((raw, idx) => {
    const row = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const { [IMPORT_ROW_KEY]: _ignored, ...values } = raw;
    const errs: string[] = [];
    const reported = new Set<string>();

    const ma = normalizeText(raw.ma_tai_san);
    const maKey = normalizeCode(ma);
    const seenAt = seenMa.get(maKey);
    if (maKey && seenAt != null) errs.push(tr('errDuplicateInFile', { row: seenAt }));
    else if (maKey) seenMa.set(maKey, row);

    const ids: Record<keyof typeof lookups, string> = { id_nhom: '', id_noi_luu: '', id_trang_thai: '' };
    (Object.keys(lookups) as (keyof typeof lookups)[]).forEach((field) => {
      const { find, col, label } = lookups[field];
      const value = normalizeText(raw[col]);
      if (!value) return; // để schema báo "bắt buộc"
      reported.add(field);
      const hit = find(value);
      if (hit === null) errs.push(tr('errRefAmbiguous', { field: label, value }));
      else if (!hit) errs.push(tr('errRefNotFound', { field: label, value }));
      else ids[field] = hit.id;
    });

    const ngayNhapRaw = raw.ngay_nhap;
    const ngayNhap = parseImportDate(ngayNhapRaw);
    if (normalizeText(ngayNhapRaw) && !ngayNhap) {
      errs.push(tr('errNgay', { field: tr('colNgayNhap'), value: String(ngayNhapRaw) }));
      reported.add('ngay_nhap');
    }
    const ngayKhRaw = raw.ngay_bat_dau_trich_khau_hao;
    const ngayKh = parseImportDate(ngayKhRaw);
    if (normalizeText(ngayKhRaw) && !ngayKh) {
      errs.push(tr('errNgay', { field: tr('colNgayKhauHao'), value: String(ngayKhRaw) }));
      reported.add('ngay_bat_dau_trich_khau_hao');
    }

    const nguyenGia = parseImportNumber(raw.nguyen_gia);
    if (!nguyenGia.ok) {
      errs.push(tr('errNguyenGia', { value: String(raw.nguyen_gia ?? '') }));
      reported.add('nguyen_gia');
    }

    const opt = (v: unknown) => normalizeText(v) || null;
    const data = {
      ma_tai_san: ma,
      ten_tai_san: normalizeText(raw.ten_tai_san),
      ...ids,
      id_nhan_vien_dang_giu: null,
      thuong_hieu: opt(raw.thuong_hieu),
      model: opt(raw.model),
      serial: opt(raw.serial),
      xuat_xu: opt(raw.xuat_xu),
      ma_barcode: opt(raw.ma_barcode),
      ten_nha_cung_cap: opt(raw.ten_nha_cung_cap),
      ngay_nhap: ngayNhap ?? '',
      nguyen_gia: nguyenGia.ok ? nguyenGia.value : null,
      ngay_bat_dau_trich_khau_hao: ngayKh,
      ghi_chu: opt(raw.ghi_chu),
    };
    const parsed = taiSanSchema.safeParse(data);
    if (!parsed.success) errs.push(...schemaIssueMessages(parsed.error.issues, reported));

    if (errs.length > 0 || !parsed.success) {
      errors.push({ row, msg: errs.join('; '), values });
      return;
    }
    toCreate.push({ row, values, data: parsed.data });
  });

  return { toCreate, errors };
}
