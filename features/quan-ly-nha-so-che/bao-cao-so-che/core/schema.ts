import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { emptyPhamCapRows, PHAM_CAP_ROWS_MAX } from './pham-cap';
import { kpiThuongArraySchema } from '../../shared/kpi-thuong/schema';
import { defaultBcscKpiThuongRows } from './kpi-thuong-presets';

const reqMsg = (key: string) => i18n.t(key);

function phamCapRowHasNumbers(r: {
  so_tham_chieu: unknown;
  so_thung: unknown;
  so_thung_quy_doi: unknown;
  ghi_chu?: unknown;
}): boolean {
  const n = (v: unknown) => Number(v) || 0;
  const note = typeof r.ghi_chu === 'string' ? r.ghi_chu.trim() : '';
  return n(r.so_tham_chieu) !== 0 || n(r.so_thung) !== 0 || n(r.so_thung_quy_doi) !== 0 || note !== '';
}

const phamCapRowFormSchema = z.object({
  ten_pham_cap: z.string().max(200).default(''),
  so_tham_chieu: z.coerce.number().min(0).default(0),
  so_thung: z.coerce.number().min(0).default(0),
  so_thung_quy_doi: z.coerce.number().min(0).default(0),
  ghi_chu: z.string().max(500).default(''),
});

const phamCapArraySchema = z
  .array(phamCapRowFormSchema)
  .max(PHAM_CAP_ROWS_MAX, { message: reqMsg('baoCaoSoChe.validation.phamCapMaxRows') })
  .superRefine((arr, ctx) => {
    arr.forEach((r, i) => {
      const ten = typeof r.ten_pham_cap === 'string' ? r.ten_pham_cap.trim() : '';
      if (phamCapRowHasNumbers(r) && !ten) {
        ctx.addIssue({
          code: 'custom',
          path: ['pham_cap', i, 'ten_pham_cap'],
          message: reqMsg('baoCaoSoChe.validation.phamCapTenWhenNumbers'),
        });
      }
    });
  });

const soLieuRowEntrySchema = z.object({
  ghi_chu: z.string().max(500),
  don_vi_tinh_phu: z.string().max(50),
});

const soLieuRowMetaFormSchema = z.object({
  sl_buong_ton_dau_ngay: soLieuRowEntrySchema,
  tong_buong_thu_hoach: soLieuRowEntrySchema,
  tong_buong_khong_so_che: soLieuRowEntrySchema,
  tong_buong_so_che: soLieuRowEntrySchema,
  sl_buong_ton_cuoi_ngay: soLieuRowEntrySchema,
  danh_gia_loi_qc_pct: soLieuRowEntrySchema,
});

export const baoCaoSoCheFormSchema = z.object({
  ngay: z.string().min(1, 'required'),
  id_chi_nhanh: z.preprocess(
    (v) => (v == null || v === '' ? '' : String(v).trim()),
    z.string().min(1, reqMsg('baoCaoSoChe.validation.branchRequired'))
  ),
  ten_chi_nhanh: z.string().optional().nullable(),
  /** Đồng bộ từ đvt từng dòng khi lưu; form không còn ô ĐVT tổng. */
  don_vi_tinh: z.string().max(50, reqMsg('baoCaoSoChe.validation.dvtMax')).optional().default('Buồng'),
  sl_buong_ton_dau_ngay: z.coerce.number().min(0).default(0),
  tong_buong_thu_hoach: z.coerce.number().min(0).default(0),
  tong_buong_khong_so_che: z.coerce.number().min(0).default(0),
  tong_buong_so_che: z.coerce.number().min(0).default(0),
  sl_buong_ton_cuoi_ngay: z.coerce.number().min(0).default(0),
  danh_gia_loi_qc_pct: z.coerce.number().min(0).max(100).default(0),
  tong_luong: z.coerce.number().min(0).default(0),
  so_lieu_row_meta: soLieuRowMetaFormSchema.default({
    sl_buong_ton_dau_ngay: { ghi_chu: '', don_vi_tinh_phu: 'Buồng' },
    tong_buong_thu_hoach: { ghi_chu: '', don_vi_tinh_phu: 'Buồng' },
    tong_buong_khong_so_che: { ghi_chu: '', don_vi_tinh_phu: 'Buồng' },
    tong_buong_so_che: { ghi_chu: '', don_vi_tinh_phu: 'Buồng' },
    sl_buong_ton_cuoi_ngay: { ghi_chu: '', don_vi_tinh_phu: 'Buồng' },
    danh_gia_loi_qc_pct: { ghi_chu: '', don_vi_tinh_phu: '%' },
  }),
  pham_cap: phamCapArraySchema.default(emptyPhamCapRows()),
  kpi_thuong: kpiThuongArraySchema.default(defaultBcscKpiThuongRows()),
  ghi_chu: z.string().max(8000).optional().nullable(),
});

export type BaoCaoSoCheFormValues = z.infer<typeof baoCaoSoCheFormSchema>;
