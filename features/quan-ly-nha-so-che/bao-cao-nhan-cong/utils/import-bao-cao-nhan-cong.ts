import i18n from '../../../../lib/i18n';
import { normalizeText, matchKey, parseImportDate, parseImportNumber, parseImportInt } from '../../../../lib/import-common';
import { IMPORT_ROW_KEY, type ImportErrorRow } from '../../../../lib/import-types';
import { baoCaoNhanCongFormSchema, type BaoCaoNhanCongFormValues } from '../core/schema';
import { defaultChiTietRows, applySubTotalsToChiTietForm, findBaoCaoDuplicateByBranchAndDate, type PhieuTomTatTrung } from '../core/form-mappers';
import { CHAM_CONG_CODES, LOAI_CHUYEN_CODES, NGOAI_LE_CODE } from '../core/types';
import { GIO_CONG_MAC_DINH } from '../core/danh-sach-nv';
import { emptySubFormByLoai } from '../core/ct-sub';

export const COT_IMPORT_BCNC = ['ngay', 'chi_nhanh', 'loai_chuyen', 'ho_ten', 'vi_tri', 'cham_cong', 'so_luong', 'so_gio_cong', 'so_gio_tc', 'ghi_chu', 'ghi_chu_phieu'] as const;
export type CotImportBcnc = typeof COT_IMPORT_BCNC[number];
export interface ChiNhanhImportBcnc { id: string; ma: string; ten: string }
export interface PhieuImportBcnc {
  values: BaoCaoNhanCongFormValues;
  rows: Record<string, unknown>[];
}

const tr = (key: string) => i18n.t(`baoCaoNhanCong.import.${key}`);

/** Mỗi dòng là một người hoặc một nhóm cùng mức giờ; chỉ tạo phiếu mới. */
export function planBaoCaoNhanCongImport(
  rows: Record<string, unknown>[],
  chiNhanh: ChiNhanhImportBcnc[],
  existing: PhieuTomTatTrung[]
): { phieu: PhieuImportBcnc[]; errors: ImportErrorRow[] } {
  const errors: ImportErrorRow[] = [];
  const groups = new Map<string, PhieuImportBcnc>();
  const chuyen = new Map(LOAI_CHUYEN_CODES.flatMap((c) => [[matchKey(c), c], [matchKey(i18n.t(`baoCaoNhanCong.chuyen.${c}`)), c]]));
  const chamCong = new Map(CHAM_CONG_CODES.flatMap((c) => [[matchKey(c), c], [matchKey(i18n.t(`baoCaoNhanCong.nv.chamCong.${c}`)), c]]));
  // NGHI dùng nhãn riêng trong giao diện hiện tại.
  chamCong.set(matchKey(tr('nghi')), 'NGHI');
  const addError = (r: Record<string, unknown>, index: number, msg: string) => {
    errors.push({ row: Number(r[IMPORT_ROW_KEY] ?? index + 2), msg, values: r });
  };

  rows.forEach((r, index) => {
    const msgs: string[] = [];
    const ngay = parseImportDate(r.ngay);
    if (!ngay) msgs.push(tr('loiNgay'));
    const key = matchKey(r.chi_nhanh);
    const byMa = chiNhanh.filter((b) => matchKey(b.ma) === key);
    const matches = byMa.length ? byMa : chiNhanh.filter((b) => matchKey(b.ten) === key);
    const cn = key && matches.length === 1 ? matches[0] : undefined;
    if (!cn) msgs.push(tr('loiChiNhanh'));
    const loai = chuyen.get(matchKey(r.loai_chuyen));
    if (!loai) msgs.push(tr('loiChuyen'));
    const ngoaiLe = loai === NGOAI_LE_CODE;
    const cc = chamCong.get(matchKey(r.cham_cong));
    if (!cc) msgs.push(tr('loiChamCong'));
    const ten = normalizeText(r.ho_ten);
    const sl = parseImportInt(r.so_luong);
    const gio = parseImportNumber(r.so_gio_cong);
    const tc = parseImportNumber(r.so_gio_tc);
    if (!sl.ok || (ten ? sl.value != null && sl.value !== 1 : sl.value == null || sl.value < 1)) msgs.push(tr('loiSoLuong'));
    const soGio = gio.ok ? gio.value ?? (cc && !ngoaiLe ? GIO_CONG_MAC_DINH[cc] : 0) : 0;
    const soTc = tc.ok ? tc.value ?? 0 : 0;
    if (!gio.ok || !tc.ok || soGio > 24 || soTc > 24 || (!ngoaiLe && cc !== 'NGHI' && soGio <= 0)) msgs.push(tr('loiGio'));
    if (ngoaiLe && (!ten || !normalizeText(r.vi_tri) || soGio !== 0 || soTc !== 0)) msgs.push(tr('loiNgoaiLe'));
    if (cc === 'NGHI' && (soGio !== 0 || soTc !== 0)) msgs.push(tr('loiNghi'));
    if (!ten && normalizeText(r.vi_tri)) msgs.push(tr('loiViTri'));
    if (ngay && cn && findBaoCaoDuplicateByBranchAndDate(existing, ngay, cn.id)) msgs.push(i18n.t('baoCaoNhanCong.validation.duplicateNgayChiNhanh'));
    if (msgs.length || !ngay || !cn || !loai || !cc || !sl.ok) {
      addError(r, index, msgs.join('; '));
      return;
    }
    const groupKey = `${ngay}|${cn.id}`;
    let group = groups.get(groupKey);
    if (!group) {
      group = { values: { ngay, id_chi_nhanh: cn.id, ten_chi_nhanh: cn.ten, ghi_chu: normalizeText(r.ghi_chu_phieu) || null, hinh_anh_urls: [], chi_tiet: defaultChiTietRows().map((ct) => ({ ...ct, sub: emptySubFormByLoai() })) }, rows: [] };
      groups.set(groupKey, group);
    }
    group.rows.push(r);
    const note = normalizeText(r.ghi_chu_phieu);
    if (note && group.values.ghi_chu && note !== group.values.ghi_chu) addError(r, index, tr('loiGhiChuPhieu'));
    else if (note) group.values.ghi_chu = note;
    const ct = group.values.chi_tiet.find((c) => c.loai_chuyen === loai)!;
    const ghi_chu = normalizeText(r.ghi_chu) || null;
    if (ten) {
      if (Object.values(ct.sub).some((s) => s.length > 0)) addError(r, index, tr('loiTron'));
      ct.nhan_vien.push({ ho_ten: ten, vi_tri: normalizeText(r.vi_tri) || null, cham_cong: cc, so_gio_cong: soGio, so_gio_tc: soTc, ghi_chu });
    } else {
      if (ct.nhan_vien.length > 0) addError(r, index, tr('loiTron'));
      if (cc === 'NGHI') addError(r, index, tr('loiNghiNhom'));
      else ct.sub[cc === 'CA_NGAY' ? 'CN_NGAY' : 'CN_NUA'].push({ sl_cong: sl.value!, so_gio: soGio, ghi_chu });
      if (soTc > 0) ct.sub.TANG_CA.push({ sl_cong: sl.value!, so_gio: soTc, ghi_chu });
    }
  });

  const phieu: PhieuImportBcnc[] = [];
  for (const group of groups.values()) {
    group.values.chi_tiet = applySubTotalsToChiTietForm(group.values.chi_tiet);
    const result = baoCaoNhanCongFormSchema.safeParse(group.values);
    if (!result.success) {
      const msg = [...new Set(result.error.issues.map((e) => e.message))].join('; ');
      group.rows.forEach((r) => addError(r, rows.indexOf(r), msg));
    } else phieu.push({ ...group, values: result.data });
  }
  // Không nhập một phần phiếu khi có dòng lỗi trong file.
  return { phieu: errors.length ? [] : phieu, errors: errors.sort((a, b) => a.row - b.row) };
}
