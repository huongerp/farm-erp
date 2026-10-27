import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { soTuanIsoTrongNam } from './tuan';

const reqMsg = (key: string) => i18n.t(key);

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
const MA_MAU_RE = /^#[0-9A-F]{6}$/;

/** '' / null / undefined → null; còn lại → chuỗi đã trim. */
const rongThanhNull = (v: unknown) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

/** id bắt buộc (select trả số hoặc chuỗi). */
const idBatBuoc = (msgKey: string) =>
  z.preprocess((v) => (v == null ? '' : String(v).trim()), z.string().min(1, reqMsg(msgKey)));

/** id tuỳ chọn — base là pipe nên KHÔNG gọi thêm `.max()` phía sau. */
const idTuyChon = z.preprocess(rongThanhNull, z.string().nullable());

/** Ngày 'YYYY-MM-DD' tuỳ chọn — base là pipe nên KHÔNG gọi thêm `.max()` phía sau. */
const ngayTuyChon = z.preprocess(
  rongThanhNull,
  z.string().regex(YMD_RE, reqMsg('danhGiaDauVao.validation.ngayKhongHopLe')).nullable()
);

const ghiChuTuyChon = (max: number) => z.string().max(max).optional().nullable();

// ---- Form phiếu -----------------------------------------------------------------

export const dgdvCotFormSchema = z
  .object({
    /** id cột đã lưu (sửa phiếu); bỏ trống = cột mới. */
    id: z.string().optional(),
    chich_bap_tu: ngayTuyChon,
    chich_bap_den: ngayTuyChon,
    thu_hoach_tu: ngayTuyChon,
    thu_hoach_den: ngayTuyChon,
    id_mau_1: idBatBuoc('danhGiaDauVao.validation.mau1Required'),
    id_mau_2: idTuyChon,
    xe_doi: z.boolean().default(false),
  })
  .superRefine((c, ctx) => {
    if (c.id_mau_2 != null && c.id_mau_2 === c.id_mau_1) {
      ctx.addIssue({ code: 'custom', path: ['id_mau_2'], message: reqMsg('danhGiaDauVao.validation.mau2TrungMau1') });
    }
    if (c.chich_bap_tu && c.chich_bap_den && c.chich_bap_den < c.chich_bap_tu) {
      ctx.addIssue({ code: 'custom', path: ['chich_bap_den'], message: reqMsg('danhGiaDauVao.validation.denTruocTu') });
    }
    if (c.thu_hoach_tu && c.thu_hoach_den && c.thu_hoach_den < c.thu_hoach_tu) {
      ctx.addIssue({ code: 'custom', path: ['thu_hoach_den'], message: reqMsg('danhGiaDauVao.validation.denTruocTu') });
    }
  });

export const dgdvLoFormSchema = z.object({
  /** id dòng fp_farm_dgdv_lo đã lưu (sửa phiếu); bỏ trống = lô mới. */
  id: z.string().optional(),
  id_lo: idBatBuoc('danhGiaDauVao.validation.loRequired'),
  id_to_truong: idTuyChon,
  ghi_chu: ghiChuTuyChon(2000),
});

export const dgdvFormSchema = z
  .object({
    nam: z.coerce.number().int().min(2000).max(2100),
    tuan: z.coerce.number().int().min(1).max(53),
    id_chi_nhanh: idBatBuoc('danhGiaDauVao.validation.branchRequired'),
    ghi_chu: ghiChuTuyChon(8000),
    /** Thứ tự mảng = stt khi lưu. */
    cot: z.array(dgdvCotFormSchema).default([]),
    lo: z.array(dgdvLoFormSchema).default([]),
  })
  .superRefine((f, ctx) => {
    if (f.tuan === 53 && soTuanIsoTrongNam(f.nam) < 53) {
      ctx.addIssue({ code: 'custom', path: ['tuan'], message: reqMsg('danhGiaDauVao.validation.tuanKhongCoTrongNam') });
    }
    const daGap = new Set<string>();
    f.lo.forEach((l, i) => {
      if (!l.id_lo) return;
      if (daGap.has(l.id_lo)) {
        ctx.addIssue({ code: 'custom', path: ['lo', i, 'id_lo'], message: reqMsg('danhGiaDauVao.validation.loTrung') });
      }
      daGap.add(l.id_lo);
    });
  });

export type DgdvCotFormValues = z.infer<typeof dgdvCotFormSchema>;
export type DgdvLoFormValues = z.infer<typeof dgdvLoFormSchema>;
export type DgdvFormValues = z.infer<typeof dgdvFormSchema>;

// ---- Danh mục (dialog Cài đặt) --------------------------------------------------

export const mauDayFormSchema = z.object({
  ten: z.string().trim().min(1, reqMsg('danhGiaDauVao.validation.tenRequired')).max(100),
  /** Chuẩn hoá chữ hoa trước khi kiểm (#rrggbb → #RRGGBB), khớp CHECK ở DB. */
  ma_mau: z.string().trim().toUpperCase().regex(MA_MAU_RE, reqMsg('danhGiaDauVao.validation.maMauKhongHopLe')),
  thu_tu: z.coerce.number().int().min(0).default(0),
  dang_dung: z.boolean().default(true),
});

export const loThuHoachFormSchema = z.object({
  ten_lo: z.string().trim().min(1, reqMsg('danhGiaDauVao.validation.tenRequired')).max(200),
  id_chi_nhanh: idBatBuoc('danhGiaDauVao.validation.branchRequired'),
  id_to_truong: idTuyChon,
  ghi_chu: ghiChuTuyChon(2000),
  thu_tu: z.coerce.number().int().min(0).default(0),
  dang_dung: z.boolean().default(true),
});

export const dgdvLyDoFormSchema = z.object({
  ten: z.string().trim().min(1, reqMsg('danhGiaDauVao.validation.tenRequired')).max(200),
  loai: z.enum(['danh_gia', 'loi']),
  thu_tu: z.coerce.number().int().min(0).default(0),
});

export type MauDayFormValues = z.infer<typeof mauDayFormSchema>;
export type LoThuHoachFormValues = z.infer<typeof loThuHoachFormSchema>;
export type DgdvLyDoFormValues = z.infer<typeof dgdvLyDoFormSchema>;
