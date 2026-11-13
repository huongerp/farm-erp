import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { DON_VI_NONG_DO } from './constants';
import { laSoKhongHopLe, parseSo } from './so';

/**
 * Giá trị form giữ ô số ở dạng chuỗi (ô trống = '' → null khi lưu, không thành 0);
 * chuyển sang số ở `formSangPayload` của service.
 */
export const lanFormSchema = z.object({
  gio: z.string(),
  id_hang_hoa: z.string(),
  nong_do: z.string(),
  don_vi: z.enum(DON_VI_NONG_DO),
  luong_nuoc_lit: z.string(),
  ghi_chu: z.string().max(500, { message: i18n.t('nkpc.validation.ghiChuDaiQua') }),
});

export type LanFormValues = z.infer<typeof lanFormSchema>;

/** Dòng chưa nhập gì (dòng trống mặc định) — bỏ qua khi lưu. Đơn vị không tính (luôn có mặc định). */
export function laDongTrong(l: LanFormValues): boolean {
  return [l.gio, l.id_hang_hoa, l.nong_do, l.luong_nuoc_lit, l.ghi_chu].every((v) => v.trim() === '');
}

export const nhatKyFormSchema = z
  .object({
    id_chi_nhanh: z.string().min(1, { message: i18n.t('nkpc.validation.chiNhanhRequired') }),
    ngay: z.string().min(1, { message: i18n.t('nkpc.validation.ngayRequired') }),
    id_nhan_vien_phu_trach: z.string(),
    ghi_chu: z.string().max(2000, { message: i18n.t('nkpc.validation.ghiChuDaiQua') }),
    lan: z.array(lanFormSchema),
  })
  .superRefine((v, ctx) => {
    let coDong = false;
    v.lan.forEach((l, i) => {
      if (laDongTrong(l)) return;
      coDong = true;
      if (!l.id_hang_hoa.trim()) {
        ctx.addIssue({ code: 'custom', path: ['lan', i, 'id_hang_hoa'], message: i18n.t('nkpc.validation.thuocRequired') });
      }
      for (const cot of ['nong_do', 'luong_nuoc_lit'] as const) {
        const n = parseSo(l[cot]);
        if (laSoKhongHopLe(l[cot]) || (n != null && n < 0)) {
          ctx.addIssue({ code: 'custom', path: ['lan', i, cot], message: i18n.t('nkpc.validation.soKhongHopLe') });
        }
      }
    });
    if (!coDong) {
      ctx.addIssue({ code: 'custom', path: ['lan'], message: i18n.t('nkpc.validation.lanRequired') });
    }
  });

export type NhatKyFormValues = z.infer<typeof nhatKyFormSchema>;

export const dinhMucFormSchema = z
  .object({
    id_chi_nhanh: z.string().min(1, { message: i18n.t('nkpc.validation.chiNhanhRequired') }),
    id_hang_hoa: z.string().min(1, { message: i18n.t('nkpc.validation.thuocRequired') }),
    nong_do: z.string(),
    don_vi: z.enum(DON_VI_NONG_DO),
    dang_dung: z.boolean(),
    ghi_chu: z.string().max(500, { message: i18n.t('nkpc.validation.ghiChuDaiQua') }),
  })
  .superRefine((v, ctx) => {
    const n = parseSo(v.nong_do);
    if (n == null || n <= 0) {
      ctx.addIssue({ code: 'custom', path: ['nong_do'], message: i18n.t('nkpc.validation.nongDoDuong') });
    }
  });

export type DinhMucFormValues = z.infer<typeof dinhMucFormSchema>;
