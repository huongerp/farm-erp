import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { SO_LAN_PHA } from './constants';
import { parseSo } from './so';

/**
 * Ô số của form giữ dạng CHUỖI (trống = chưa nhập) rồi kiểm ở superRefine — tránh `Number('')` = 0
 * và tránh base ZodPipe của optional. Chuyển sang số bằng `parseSo` khi lưu.
 */
const oSo = z.string();

const lanFormSchema = z.object({
  lan: z.number().int().min(1).max(SO_LAN_PHA),
  gio: z.string(),
  so_kg: oSo,
  dinh_muc_kg: z.number().nullable(),
});

export type LanFormValues = z.infer<typeof lanFormSchema>;

const khongAm = (s: string, nguyen = false): boolean => {
  if (s.trim() === '') return true;
  const n = parseSo(s);
  return n != null && n >= 0 && (!nguyen || Number.isInteger(n));
};

export const nhatKyFormSchema = z
  .object({
    id_chi_nhanh: z.string().min(1, { message: i18n.t('nkpp.validation.chiNhanhRequired') }),
    ngay: z.string().min(1, { message: i18n.t('nkpp.validation.ngayRequired') }),
    so_buong_du_thu: oSo,
    so_be_so_che: oSo,
    id_nhan_vien_phu_trach: z.string(),
    ghi_chu: z.string().max(2000),
    lan: z.array(lanFormSchema).length(SO_LAN_PHA),
  })
  .superRefine((v, ctx) => {
    if (!khongAm(v.so_buong_du_thu, true)) {
      ctx.addIssue({ code: 'custom', path: ['so_buong_du_thu'], message: i18n.t('nkpp.validation.soNguyenKhongAm') });
    }
    if (!khongAm(v.so_be_so_che, true)) {
      ctx.addIssue({ code: 'custom', path: ['so_be_so_che'], message: i18n.t('nkpp.validation.soNguyenKhongAm') });
    }
    v.lan.forEach((l, i) => {
      if (!khongAm(l.so_kg)) {
        ctx.addIssue({ code: 'custom', path: ['lan', i, 'so_kg'], message: i18n.t('nkpp.validation.soKhongAm') });
      }
    });
  });

export type NhatKyFormValues = z.infer<typeof nhatKyFormSchema>;

/** Form hồ pha phèn — mọi ô số là chuỗi, trống = chưa nhập. */
export const hoFormSchema = z
  .object({
    id_chi_nhanh: z.string().min(1, { message: i18n.t('nkpp.validation.chiNhanhRequired') }),
    ten_ho: z.string().trim().min(1, { message: i18n.t('nkpp.validation.tenHoRequired') }).max(100),
    the_tich_xan_m3: oSo,
    the_tich_tia_m3: oSo,
    bo_sung_xan_kg: oSo,
    bo_sung_tia_kg: oSo,
    ty_le_g_lit: oSo,
    ty_le_dau_ca: oSo,
    dang_dung: z.boolean(),
    ghi_chu: z.string().max(500),
  })
  .superRefine((v, ctx) => {
    for (const k of [
      'the_tich_xan_m3',
      'the_tich_tia_m3',
      'bo_sung_xan_kg',
      'bo_sung_tia_kg',
      'ty_le_g_lit',
      'ty_le_dau_ca',
    ] as const) {
      if (!khongAm(v[k])) ctx.addIssue({ code: 'custom', path: [k], message: i18n.t('nkpp.validation.soKhongAm') });
    }
  });

export type HoFormValues = z.infer<typeof hoFormSchema>;
