/**
 * Import công việc: dòng Excel → `CongViecFormValues`, validate bằng `congViecSchema` của form.
 * Thuần, không React / không db → test trực tiếp.
 *
 * Trước đây: Trách nhiệm / Người hỗ trợ phải ghi id số; Ưu tiên / Trạng thái phải ghi mã nội bộ
 * (`trung_binh`, `draft`) và gõ sai thì lặng lẽ bị gán mặc định. Giờ nhận mã NV hoặc họ tên,
 * nhãn tiếng Việt hoặc mã; sai là báo lỗi dòng.
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY, type ImportErrorRow } from '../../../../lib/import-types';
import { buildRefLookup, normalizeText, pickImportOption, schemaIssueMessages } from '../../../../lib/import-common';
import { congViecSchema, type CongViecFormValues } from '../core/schema';
import type { CongViecTrangThai, CongViecUuTien } from '../core/types';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`congViec.nhapExcel.${k}`, o ?? {});

export interface NhanVienRefLite {
  id: string;
  ma_nhan_vien: string;
  ho_ten: string;
}

export interface CongViecImportInput {
  nhanVien: NhanVienRefLite[];
  uuTienOptions: { value: CongViecUuTien; labels: string[] }[];
  trangThaiOptions: { value: CongViecTrangThai; labels: string[] }[];
}

export interface CongViecImportPlan {
  toCreate: { row: number; values: Record<string, unknown>; data: CongViecFormValues }[];
  errors: ImportErrorRow[];
}

export function planCongViecImport(rows: Record<string, unknown>[], input: CongViecImportInput): CongViecImportPlan {
  const findNv = buildRefLookup(input.nhanVien, (n) => n.ma_nhan_vien, (n) => n.ho_ten);
  const toCreate: CongViecImportPlan['toCreate'] = [];
  const errors: ImportErrorRow[] = [];

  rows.forEach((raw, idx) => {
    const row = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const { [IMPORT_ROW_KEY]: _ignored, ...values } = raw;
    const errs: string[] = [];
    const reported = new Set<string>();

    const resolveNv = (value: string): number | null => {
      const hit = findNv(value);
      if (hit === null) errs.push(tr('errNhanVienAmbiguous', { value }));
      else if (!hit) errs.push(tr('errNhanVienNotFound', { value }));
      return hit ? Number(hit.id) : null;
    };

    const trachNhiemRaw = normalizeText(raw.trach_nhiem);
    let trachNhiem: number | null = null;
    if (trachNhiemRaw) {
      reported.add('trach_nhiem');
      trachNhiem = resolveNv(trachNhiemRaw);
    }

    const nguoiHoTro: number[] = [];
    normalizeText(raw.nguoi_ho_tro)
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => {
        const id = resolveNv(s);
        if (id != null && !nguoiHoTro.includes(id)) nguoiHoTro.push(id);
      });

    const uuTienRaw = normalizeText(raw.uu_tien);
    const uuTien = uuTienRaw ? pickImportOption(uuTienRaw, input.uuTienOptions) : 'trung_binh';
    if (!uuTien) {
      errs.push(tr('errUuTien', { value: uuTienRaw }));
      reported.add('uu_tien');
    }

    const trangThaiRaw = normalizeText(raw.trang_thai);
    const trangThai = trangThaiRaw ? pickImportOption(trangThaiRaw, input.trangThaiOptions) : 'draft';
    if (!trangThai) {
      errs.push(tr('errTrangThai', { value: trangThaiRaw }));
      reported.add('trang_thai');
    }

    const data = {
      tieu_de: normalizeText(raw.tieu_de),
      mo_ta: normalizeText(raw.mo_ta) || undefined,
      id_cha: null,
      trach_nhiem: trachNhiem,
      nguoi_ho_tro: nguoiHoTro,
      uu_tien: uuTien ?? 'trung_binh',
      trang_thai: trangThai ?? 'draft',
    };
    const parsed = congViecSchema.safeParse(data);
    if (!parsed.success) errs.push(...schemaIssueMessages(parsed.error.issues, reported));

    if (errs.length > 0 || !parsed.success) {
      errors.push({ row, msg: errs.join('; '), values });
      return;
    }
    toCreate.push({ row, values, data: parsed.data });
  });

  return { toCreate, errors };
}
