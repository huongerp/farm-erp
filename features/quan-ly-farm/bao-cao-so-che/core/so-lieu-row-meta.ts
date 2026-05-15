/** ĐVT mặc định cho từng dòng chỉ tiêu (số liệu buồng). */
export const SO_LIEU_ROW_DVT_DEFAULT = 'Buồng' as const;

/** Các chỉ tiêu số liệu buồng — khóa `ma_chi_tieu` trên `fp_farm_bao_cao_so_che_ct` và key form / `so_lieu_row_meta` (chỉ dùng trong app). */
export const SO_LIEU_ROW_KEYS = [
  'sl_buong_ton_dau_ngay',
  'tong_buong_thu_hoach',
  'tong_buong_khong_so_che',
  'tong_buong_so_che',
  'sl_buong_ton_cuoi_ngay',
] as const;

export type SoLieuRowKey = (typeof SO_LIEU_ROW_KEYS)[number];

export interface SoLieuRowMetaEntry {
  ghi_chu?: string | null;
  don_vi_tinh_phu?: string | null;
}

/** Dữ liệu lưu DB (chỉ gửi key có nội dung). */
export type SoLieuRowMeta = Partial<Record<SoLieuRowKey, SoLieuRowMetaEntry>>;

/** Form: mỗi dòng luôn có ô (chuỗi rỗng khi không nhập). */
export type SoLieuRowMetaForm = Record<SoLieuRowKey, { ghi_chu: string; don_vi_tinh_phu: string }>;

export function emptySoLieuRowMetaForm(): SoLieuRowMetaForm {
  const row = { ghi_chu: '', don_vi_tinh_phu: SO_LIEU_ROW_DVT_DEFAULT };
  return {
    sl_buong_ton_dau_ngay: { ...row },
    tong_buong_thu_hoach: { ...row },
    tong_buong_khong_so_che: { ...row },
    tong_buong_so_che: { ...row },
    sl_buong_ton_cuoi_ngay: { ...row },
  };
}

export function mergeSoLieuMetaToForm(fromDb: SoLieuRowMeta | null | undefined): SoLieuRowMetaForm {
  const base = emptySoLieuRowMetaForm();
  if (!fromDb || typeof fromDb !== 'object') return base;
  for (const k of SO_LIEU_ROW_KEYS) {
    const e = fromDb[k];
    if (!e || typeof e !== 'object') continue;
    const dRaw = typeof e.don_vi_tinh_phu === 'string' ? e.don_vi_tinh_phu : e.don_vi_tinh_phu != null ? String(e.don_vi_tinh_phu) : '';
    base[k] = {
      ghi_chu: typeof e.ghi_chu === 'string' ? e.ghi_chu : e.ghi_chu != null ? String(e.ghi_chu) : '',
      don_vi_tinh_phu: dRaw.trim() || SO_LIEU_ROW_DVT_DEFAULT,
    };
  }
  return base;
}

export function pruneSoLieuRowMetaForDb(form: SoLieuRowMetaForm): SoLieuRowMeta {
  const out: SoLieuRowMeta = {};
  for (const k of SO_LIEU_ROW_KEYS) {
    const e = form[k];
    if (!e) continue;
    const g = e.ghi_chu?.trim() ?? '';
    const d = e.don_vi_tinh_phu?.trim() ?? '';
    const dMeaningful = d && d !== SO_LIEU_ROW_DVT_DEFAULT;
    if (!g && !dMeaningful) continue;
    out[k] = {
      ghi_chu: g || null,
      don_vi_tinh_phu: d ? d : null,
    };
  }
  return out;
}

export function parseSoLieuRowMetaFromDb(raw: unknown): SoLieuRowMeta {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const out: SoLieuRowMeta = {};
  for (const k of SO_LIEU_ROW_KEYS) {
    const v = o[k];
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    const e = v as Record<string, unknown>;
    const g = e.ghi_chu;
    const d = e.don_vi_tinh_phu;
    out[k] = {
      ghi_chu: typeof g === 'string' ? g : g != null && g !== '' ? String(g) : null,
      don_vi_tinh_phu: typeof d === 'string' ? d : d != null && d !== '' ? String(d) : null,
    };
  }
  return out;
}

/** Thứ tự dòng bảng “Số liệu buồng” (form + chi tiết). */
export const SO_LIEU_BUONG_ROW_DEFS: { key: SoLieuRowKey; labelKey: string }[] = [
  { key: 'sl_buong_ton_dau_ngay', labelKey: 'baoCaoSoChe.form.slTonDau' },
  { key: 'tong_buong_thu_hoach', labelKey: 'baoCaoSoChe.form.tongThuHoach' },
  { key: 'tong_buong_khong_so_che', labelKey: 'baoCaoSoChe.form.tongKhongSoChe' },
  { key: 'tong_buong_so_che', labelKey: 'baoCaoSoChe.form.tongSoChe' },
  { key: 'sl_buong_ton_cuoi_ngay', labelKey: 'baoCaoSoChe.form.slTonCuoi' },
];

/** Số dòng chỉ số trong khối BCNC readout. */
export const BCSC_BCNC_READOUT_ROW_COUNT = 4;
/** STT bắt đầu cho bảng số liệu buồng (sau các dòng BCNC). */
export const BCSC_SO_LIEU_STT_OFFSET = BCSC_BCNC_READOUT_ROW_COUNT;

/** STT bắt đầu cho khối KPI (sau BCNC + các chỉ tiêu buồng). */
export const BCSC_KPI_STT_OFFSET = BCSC_BCNC_READOUT_ROW_COUNT + SO_LIEU_BUONG_ROW_DEFS.length;

/** Gợi ý đvt cho combobox (có thể thêm mới). */
export const SO_LIEU_DVT_PRESET_OPTIONS = ['Buồng', 'Thùng', 'kg', 'tạ', 'Chai', 'Cây'] as const;

export function deriveDonViTinhSlipFromSoLieuMeta(meta: SoLieuRowMetaForm | undefined | null): string {
  if (!meta) return SO_LIEU_ROW_DVT_DEFAULT;
  for (const { key } of SO_LIEU_BUONG_ROW_DEFS) {
    const d = meta[key]?.don_vi_tinh_phu?.trim();
    if (d) return d;
  }
  return SO_LIEU_ROW_DVT_DEFAULT;
}
