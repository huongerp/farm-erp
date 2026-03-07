/** Loại đối thủ */
export const LOAI_DOI_THU = ['dau_nganh', 'truc_tiep', 'tiem_nang'] as const;
export type LoaiDoiThu = (typeof LOAI_DOI_THU)[number];

export const LOAI_DOI_THU_LABELS: Record<LoaiDoiThu, string> = {
  dau_nganh: 'Đầu ngành',
  truc_tiep: 'Trực tiếp',
  tiem_nang: 'Tiềm năng',
};

/** Quy mô doanh nghiệp (dropdown) */
export const QUY_MO_OPTIONS = ['sme', 'dn_vua', 'tap_doan', 'startup'] as const;
export type QuyMoOption = (typeof QUY_MO_OPTIONS)[number];
export const QUY_MO_LABELS: Record<QuyMoOption, string> = {
  sme: 'SME',
  dn_vua: 'Doanh nghiệp vừa',
  tap_doan: 'Tập đoàn',
  startup: 'Startup',
};

/** Phân khúc thị trường (dropdown) */
export const PHAN_KHUC_OPTIONS = ['cao_cap', 'binh_dan', 'b2b', 'b2c', 'doanh_nghiep'] as const;
export type PhanKhucOption = (typeof PHAN_KHUC_OPTIONS)[number];
export const PHAN_KHUC_LABELS: Record<PhanKhucOption, string> = {
  cao_cap: 'Cao cấp',
  binh_dan: 'Bình dân',
  b2b: 'B2B',
  b2c: 'B2C',
  doanh_nghiep: 'Doanh nghiệp',
};

/** Các tiêu chí so sánh đối thủ (key field + label i18n) */
export const SO_SANH_TIEU_CHI: { key: string; labelKey: string }[] = [
  { key: 'ten_doi_thu', labelKey: 'phanTichDoiThu.form.tenDoiThu' },
  { key: 'phan_loai', labelKey: 'phanTichDoiThu.form.phanLoai' },
  { key: 'diem_manh_nhat', labelKey: 'phanTichDoiThu.form.diemManhNhat' },
  { key: 'ten_cong_ty', labelKey: 'phanTichDoiThu.form.tenCongTy' },
  { key: 'quy_mo', labelKey: 'phanTichDoiThu.form.quyMo' },
  { key: 'nam_thanh_lap', labelKey: 'phanTichDoiThu.form.namThanhLap' },
  { key: 'thi_phan', labelKey: 'phanTichDoiThu.form.thiPhan' },
  { key: 'nguon_goc', labelKey: 'phanTichDoiThu.form.nguonGoc' },
  { key: 'dinh_vi', labelKey: 'phanTichDoiThu.form.dinhVi' },
  { key: 'phan_khuc', labelKey: 'phanTichDoiThu.form.phanKhuc' },
  { key: 'san_pham', labelKey: 'phanTichDoiThu.form.sanPham' },
  { key: 'the_manh', labelKey: 'phanTichDoiThu.form.theManh' },
  { key: 'website', labelKey: 'phanTichDoiThu.form.website' },
  { key: 'hotline', labelKey: 'phanTichDoiThu.form.hotline' },
];
