import type {
  DoiThu,
  DoiThuTaiLieu,
  DoiThuNhatKy,
  DoiThuBattlecard,
  BattlecardDong,
} from '../core/types';
import type { DoiThuFormValues, BattlecardFormValues } from '../core/schema';
import type { LoaiDoiThu } from '../core/constants';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

/** Chuẩn hóa diem_manh/diem_yeu: string (cũ) hoặc string[] → string[] | null */
function toStrArray(v: string | string[] | null | undefined): string[] | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.length ? v : null;
  const s = String(v).trim();
  return s ? [s] : null;
}

function normalizeDoiThu(d: DoiThu): DoiThu {
  return { ...d, diem_manh: toStrArray(d.diem_manh) ?? null, diem_yeu: toStrArray(d.diem_yeu) ?? null };
}

const seedDoiThu: DoiThu[] = [
  {
    id: 'dt-1',
    ten_doi_thu: 'Công ty A',
    phan_loai: 'truc_tiep',
    diem_manh_nhat: 'Giá thấp, giao nhanh',
    website: 'https://example.com',
    fanpage: null,
    ngay_cap_nhat: ts(),
    ten_cong_ty: 'Công ty A',
    mst: '0123456789',
    dia_chi: 'Hà Nội',
    hotline: '1900xxxx',
    quy_mo: 'Doanh nghiệp vừa',
    nam_thanh_lap: 2015,
    tg_tao: ts(),
  },
  {
    id: 'dt-2',
    ten_doi_thu: 'Công ty B',
    phan_loai: 'dau_nganh',
    diem_manh_nhat: 'Thương hiệu mạnh',
    website: null,
    fanpage: 'https://facebook.com/example',
    ngay_cap_nhat: ts(),
    tg_tao: ts(),
  },
  {
    id: 'dt-3',
    ten_doi_thu: 'Đối thủ C',
    phan_loai: 'tiem_nang',
    diem_manh_nhat: 'Công nghệ mới, hỗ trợ 24/7',
    website: 'https://doithu-c.vn',
    fanpage: null,
    ngay_cap_nhat: ts(),
    ten_cong_ty: 'Công ty C',
    quy_mo: 'SME',
    nam_thanh_lap: 2020,
    thi_phan: '5%',
    tg_tao: ts(),
  },
  {
    id: 'dt-4',
    ten_doi_thu: 'Tập đoàn D',
    phan_loai: 'dau_nganh',
    diem_manh_nhat: 'Phủ sóng toàn quốc, dịch vụ cao cấp',
    website: 'https://tapdoan-d.com',
    fanpage: 'https://facebook.com/tapdoanD',
    ngay_cap_nhat: ts(),
    ten_cong_ty: 'Tập đoàn D',
    dia_chi: 'TP.HCM',
    hotline: '1800xxxx',
    quy_mo: 'Tập đoàn',
    nam_thanh_lap: 2010,
    phan_khuc: 'Cao cấp',
    tg_tao: ts(),
  },
  {
    id: 'dt-5',
    ten_doi_thu: 'Startup E',
    phan_loai: 'tiem_nang',
    diem_manh_nhat: 'Giá cạnh tranh, app tiện lợi',
    website: null,
    fanpage: null,
    ngay_cap_nhat: ts(),
    quy_mo: 'Startup',
    nam_thanh_lap: 2023,
    tg_tao: ts(),
  },
  {
    id: 'dt-6',
    ten_doi_thu: 'Công ty F Logistics',
    phan_loai: 'truc_tiep',
    diem_manh_nhat: 'Mạng lưới kho bãi rộng, giao hàng nhanh',
    website: 'https://flogistics.vn',
    fanpage: 'https://facebook.com/flogistics',
    ngay_cap_nhat: ts(),
    ten_cong_ty: 'Công ty CP F Logistics',
    dia_chi: 'Bình Dương',
    hotline: '1900xxxx',
    quy_mo: 'Doanh nghiệp vừa',
    nam_thanh_lap: 2018,
    phan_khuc: 'B2B',
    thi_phan: '8%',
    nguon_goc: 'Việt Nam',
    tg_tao: ts(),
  },
  {
    id: 'dt-7',
    ten_doi_thu: 'Công ty G Tech',
    phan_loai: 'dau_nganh',
    diem_manh_nhat: 'Giải pháp phần mềm hàng đầu, tích hợp AI',
    website: 'https://gtech.com.vn',
    fanpage: null,
    ngay_cap_nhat: ts(),
    ten_cong_ty: 'Công ty G Technology',
    dia_chi: 'Hà Nội',
    quy_mo: 'Tập đoàn',
    nam_thanh_lap: 2008,
    thi_phan: '15%',
    dinh_vi: 'Cao cấp, doanh nghiệp',
    san_pham: 'Phần mềm ERP, CRM, AI',
    tg_tao: ts(),
  },
  {
    id: 'dt-8',
    ten_doi_thu: 'Thương hiệu H',
    phan_loai: 'tiem_nang',
    diem_manh_nhat: 'Giá rẻ, nhiều chi nhánh',
    website: null,
    fanpage: 'https://facebook.com/thuonghieuH',
    ngay_cap_nhat: ts(),
    quy_mo: 'SME',
    nam_thanh_lap: 2021,
    phan_khuc: 'Bình dân',
    tg_tao: ts(),
  },
  {
    id: 'dt-9',
    ten_doi_thu: 'Tổng công ty I',
    phan_loai: 'dau_nganh',
    diem_manh_nhat: 'Vốn mạnh, thị phần lớn',
    website: 'https://tongcongty-i.vn',
    fanpage: 'https://facebook.com/tongcongtyI',
    ngay_cap_nhat: ts(),
    ten_cong_ty: 'Tổng công ty I',
    dia_chi: 'TP.HCM',
    hotline: '1800xxxx',
    quy_mo: 'Tập đoàn',
    nam_thanh_lap: 2005,
    thi_phan: '12%',
    nguon_goc: 'Việt Nam',
    phan_khuc: 'Đa dạng',
    tg_tao: ts(),
  },
];

let dbDoiThu: DoiThu[] = JSON.parse(JSON.stringify(seedDoiThu));

const seedTaiLieu: DoiThuTaiLieu[] = [
  { id: 'tl-1', doi_thu_id: 'dt-1', ten_file: 'Báo giá Công ty A 2024.pdf', duong_dan_file: null, loai: 'bao_gia', tg_tao: ts() },
  { id: 'tl-2', doi_thu_id: 'dt-1', ten_file: 'Ảnh năng lực dự án.jpg', duong_dan_file: null, loai: 'anh_nang_luc', tg_tao: ts() },
  { id: 'tl-3', doi_thu_id: 'dt-1', ten_file: 'Link bài báo giới thiệu', duong_dan_file: 'https://example.com/news', loai: 'link_bai_bao', tg_tao: ts() },
  { id: 'tl-4', doi_thu_id: 'dt-2', ten_file: 'Catalog sản phẩm.pdf', duong_dan_file: null, loai: 'bao_gia', tg_tao: ts() },
  { id: 'tl-5', doi_thu_id: 'dt-2', ten_file: 'Ảnh quảng cáo thương hiệu', duong_dan_file: null, loai: 'anh_quang_cao', tg_tao: ts() },
  { id: 'tl-6', doi_thu_id: 'dt-3', ten_file: 'Báo giá Đối thủ C Q4.pdf', duong_dan_file: null, loai: 'bao_gia', tg_tao: ts() },
  { id: 'tl-7', doi_thu_id: 'dt-4', ten_file: 'Hồ sơ năng lực Tập đoàn D', duong_dan_file: null, loai: 'anh_nang_luc', tg_tao: ts() },
  { id: 'tl-8', doi_thu_id: 'dt-4', ten_file: 'Tin tức ra mắt sản phẩm mới', duong_dan_file: 'https://example.com/d-news', loai: 'link_bai_bao', tg_tao: ts() },
];

let dbTaiLieu: DoiThuTaiLieu[] = JSON.parse(JSON.stringify(seedTaiLieu));

const seedNhatKy: DoiThuNhatKy[] = [
  { id: 'nk-1', doi_thu_id: 'dt-1', noi_dung: 'Công ty A giảm giá 10% cho đơn từ 50 triệu.', nguoi_tao: 'Nguyễn Văn A', ngay: '2025-03-01', tg_tao: '2025-03-01T10:00:00.000Z' },
  { id: 'nk-2', doi_thu_id: 'dt-1', noi_dung: 'Ra mắt gói dịch vụ mới hỗ trợ 24/7.', nguoi_tao: 'Trần Thị B', ngay: '2025-02-28', tg_tao: '2025-02-28T14:30:00.000Z' },
  { id: 'nk-3', doi_thu_id: 'dt-2', noi_dung: 'Công ty B mở rộng chi nhánh tại Đà Nẵng.', nguoi_tao: 'User', ngay: '2025-03-02', tg_tao: '2025-03-02T09:15:00.000Z' },
  { id: 'nk-4', doi_thu_id: 'dt-3', noi_dung: 'Đối thủ C tung chương trình khuyến mãi tháng 3.', nguoi_tao: 'User', ngay: '2025-03-03', tg_tao: '2025-03-03T11:00:00.000Z' },
  { id: 'nk-5', doi_thu_id: 'dt-4', noi_dung: 'Tập đoàn D công bố báo cáo tài chính năm 2024.', nguoi_tao: 'Lê Văn C', ngay: '2025-02-25', tg_tao: '2025-02-25T16:00:00.000Z' },
];

const dbNhatKy: DoiThuNhatKy[] = JSON.parse(JSON.stringify(seedNhatKy));
const dbBattlecard: Record<string, DoiThuBattlecard> = {};

function getBattlecardDefault(doiThuId: string): DoiThuBattlecard {
  return {
    doi_thu_id: doiThuId,
    so_sanh: [],
    diem_yeu_chi_mang: [],
    kich_ban_xu_ly: [],
  };
}

function normalizeKichBanXuLy(
  raw: DoiThuBattlecard['kich_ban_xu_ly']
): { id: string; noi_dung: string }[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim())
    return [{ id: `kb-1`, noi_dung: raw }];
  return [];
}

export async function getDanhSachDoiThu(): Promise<DoiThu[]> {
  await delay(300);
  return [...dbDoiThu].sort((a, b) => a.ten_doi_thu.localeCompare(b.ten_doi_thu)).map(normalizeDoiThu);
}

export async function getDoiThuById(id: string): Promise<DoiThu | null> {
  await delay(200);
  const found = dbDoiThu.find((d) => d.id === id);
  return found ? normalizeDoiThu(found) : null;
}

export async function createDoiThu(data: DoiThuFormValues): Promise<DoiThu> {
  await delay(400);
  const id = `dt-${Date.now()}`;
  const now = ts();
  const item: DoiThu = {
    id,
    ten_doi_thu: data.ten_doi_thu.trim(),
    logo: data.logo || null,
    phan_loai: data.phan_loai as LoaiDoiThu,
    diem_manh_nhat: data.diem_manh_nhat?.trim() || null,
    website: data.website?.trim() || null,
    fanpage: data.fanpage?.trim() || null,
    ngay_cap_nhat: now,
    ghi_chu_nhan_dang: data.ghi_chu_nhan_dang?.trim() || null,
    ten_cong_ty: data.ten_cong_ty?.trim() || null,
    mst: data.mst?.trim() || null,
    dia_chi: data.dia_chi?.trim() || null,
    hotline: data.hotline?.trim() || null,
    youtube: data.youtube?.trim() || null,
    facebook: data.facebook?.trim() || null,
    quy_mo: data.quy_mo?.trim() || null,
    nam_thanh_lap: data.nam_thanh_lap ?? null,
    diem_manh: Array.isArray(data.diem_manh) && data.diem_manh.length ? data.diem_manh : null,
    diem_yeu: Array.isArray(data.diem_yeu) && data.diem_yeu.length ? data.diem_yeu : null,
    phan_khuc: data.phan_khuc?.trim() || null,
    san_pham: data.san_pham?.trim() || null,
    linh_vuc_kinh_doanh: data.linh_vuc_kinh_doanh?.trim() || null,
    thi_truong_muc_tieu: data.thi_truong_muc_tieu?.trim() || null,
    so_nhan_vien: data.so_nhan_vien?.trim() || null,
    von_dieu_le: data.von_dieu_le?.trim() || null,
    thi_phan: data.thi_phan?.trim() || null,
    nguon_goc: data.nguon_goc?.trim() || null,
    nam_hoat_dong: data.nam_hoat_dong?.trim() || null,
    dinh_vi: data.dinh_vi?.trim() || null,
    cach_thuc_hoat_dong: data.cach_thuc_hoat_dong?.trim() || null,
    kenh_phan_phoi: data.kenh_phan_phoi?.trim() || null,
    chien_luoc_gia: data.chien_luoc_gia?.trim() || null,
    marketing_truyen_thong: data.marketing_truyen_thong?.trim() || null,
    the_manh: data.the_manh?.trim() || null,
    tiktok: data.tiktok?.trim() || null,
    link_khac: data.link_khac?.trim() || null,
    ghi_chu_khac: data.ghi_chu_khac?.trim() || null,
    tg_tao: now,
  };
  dbDoiThu = [...dbDoiThu, item];
  return item;
}

export async function updateDoiThu(id: string, data: DoiThuFormValues): Promise<DoiThu> {
  await delay(400);
  const idx = dbDoiThu.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error(i18n.t('phanTichDoiThu.service.notFound'));
  const now = ts();
  const item: DoiThu = {
    ...dbDoiThu[idx],
    ten_doi_thu: data.ten_doi_thu.trim(),
    logo: data.logo || null,
    phan_loai: data.phan_loai as LoaiDoiThu,
    diem_manh_nhat: data.diem_manh_nhat?.trim() || null,
    website: data.website?.trim() || null,
    fanpage: data.fanpage?.trim() || null,
    ngay_cap_nhat: now,
    ghi_chu_nhan_dang: data.ghi_chu_nhan_dang?.trim() || null,
    ten_cong_ty: data.ten_cong_ty?.trim() || null,
    mst: data.mst?.trim() || null,
    dia_chi: data.dia_chi?.trim() || null,
    hotline: data.hotline?.trim() || null,
    youtube: data.youtube?.trim() || null,
    facebook: data.facebook?.trim() || null,
    quy_mo: data.quy_mo?.trim() || null,
    nam_thanh_lap: data.nam_thanh_lap ?? null,
    diem_manh: Array.isArray(data.diem_manh) && data.diem_manh.length ? data.diem_manh : null,
    diem_yeu: Array.isArray(data.diem_yeu) && data.diem_yeu.length ? data.diem_yeu : null,
    phan_khuc: data.phan_khuc?.trim() || null,
    san_pham: data.san_pham?.trim() || null,
    linh_vuc_kinh_doanh: data.linh_vuc_kinh_doanh?.trim() || null,
    thi_truong_muc_tieu: data.thi_truong_muc_tieu?.trim() || null,
    so_nhan_vien: data.so_nhan_vien?.trim() || null,
    von_dieu_le: data.von_dieu_le?.trim() || null,
    thi_phan: data.thi_phan?.trim() || null,
    nguon_goc: data.nguon_goc?.trim() || null,
    nam_hoat_dong: data.nam_hoat_dong?.trim() || null,
    dinh_vi: data.dinh_vi?.trim() || null,
    cach_thuc_hoat_dong: data.cach_thuc_hoat_dong?.trim() || null,
    kenh_phan_phoi: data.kenh_phan_phoi?.trim() || null,
    chien_luoc_gia: data.chien_luoc_gia?.trim() || null,
    marketing_truyen_thong: data.marketing_truyen_thong?.trim() || null,
    the_manh: data.the_manh?.trim() || null,
    tiktok: data.tiktok?.trim() || null,
    link_khac: data.link_khac?.trim() || null,
    ghi_chu_khac: data.ghi_chu_khac?.trim() || null,
  };
  dbDoiThu[idx] = item;
  return item;
}

export async function deleteDoiThu(id: string): Promise<void> {
  await delay(300);
  const idx = dbDoiThu.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error(i18n.t('phanTichDoiThu.service.notFound'));
  dbDoiThu = dbDoiThu.filter((d) => d.id !== id);
}

export async function getTaiLieu(doiThuId: string): Promise<DoiThuTaiLieu[]> {
  await delay(200);
  return dbTaiLieu.filter((t) => t.doi_thu_id === doiThuId);
}

export async function getAllTaiLieu(): Promise<DoiThuTaiLieu[]> {
  await delay(200);
  return [...dbTaiLieu];
}

export async function themTaiLieu(
  doiThuId: string,
  payload: { ten_file: string; duong_dan_file?: string; loai: DoiThuTaiLieu['loai'] }
): Promise<DoiThuTaiLieu> {
  await delay(300);
  const item: DoiThuTaiLieu = {
    id: `tl-${Date.now()}`,
    doi_thu_id: doiThuId,
    ten_file: payload.ten_file,
    duong_dan_file: payload.duong_dan_file || null,
    loai: payload.loai,
    tg_tao: ts(),
  };
  dbTaiLieu.push(item);
  return item;
}

export async function capNhatTaiLieu(
  id: string,
  payload: { ten_file?: string; duong_dan_file?: string; loai?: DoiThuTaiLieu['loai'] }
): Promise<DoiThuTaiLieu> {
  await delay(300);
  const idx = dbTaiLieu.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error('Tài liệu không tồn tại');
  const item = dbTaiLieu[idx];
  dbTaiLieu[idx] = {
    ...item,
    ten_file: payload.ten_file ?? item.ten_file,
    duong_dan_file: payload.duong_dan_file !== undefined ? payload.duong_dan_file : item.duong_dan_file,
    loai: payload.loai ?? item.loai,
  };
  return dbTaiLieu[idx];
}

export async function xoaTaiLieu(id: string): Promise<void> {
  await delay(200);
  const idx = dbTaiLieu.findIndex((t) => t.id === id);
  if (idx !== -1) dbTaiLieu.splice(idx, 1);
}

export async function getNhatKy(doiThuId: string): Promise<DoiThuNhatKy[]> {
  await delay(200);
  const list = dbNhatKy
    .filter((n) => n.doi_thu_id === doiThuId)
    .map((n) => ({
      ...n,
      ngay: (n as DoiThuNhatKy).ngay || n.tg_tao.slice(0, 10),
    }));
  return list.sort((a, b) => {
    if (b.ngay !== a.ngay) return b.ngay.localeCompare(a.ngay);
    return b.tg_tao > a.tg_tao ? 1 : -1;
  });
}

export async function getAllNhatKy(): Promise<DoiThuNhatKy[]> {
  await delay(200);
  const list = dbNhatKy.map((n) => ({
    ...n,
    ngay: (n as DoiThuNhatKy).ngay || n.tg_tao.slice(0, 10),
  }));
  return list.sort((a, b) => {
    if (b.ngay !== a.ngay) return b.ngay.localeCompare(a.ngay);
    return b.tg_tao > a.tg_tao ? 1 : -1;
  });
}

export async function themNhatKy(
  doiThuId: string,
  payload: { noi_dung: string; nguoi_tao: string; ngay?: string }
): Promise<DoiThuNhatKy> {
  await delay(300);
  const ngay =
    payload.ngay && /^\d{4}-\d{2}-\d{2}$/.test(payload.ngay)
      ? payload.ngay
      : new Date().toISOString().slice(0, 10);
  const item: DoiThuNhatKy = {
    id: `nk-${Date.now()}`,
    doi_thu_id: doiThuId,
    noi_dung: payload.noi_dung,
    nguoi_tao: payload.nguoi_tao,
    ngay,
    tg_tao: ts(),
  };
  dbNhatKy.push(item);
  return item;
}

export async function capNhatNhatKy(
  id: string,
  data: { noi_dung?: string; nguoi_tao?: string; ngay?: string }
): Promise<DoiThuNhatKy> {
  await delay(300);
  const idx = dbNhatKy.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('Nhật ký không tồn tại');
  const prev = dbNhatKy[idx];
  const ngay =
    data.ngay !== undefined && data.ngay && /^\d{4}-\d{2}-\d{2}$/.test(data.ngay)
      ? data.ngay
      : prev.ngay || prev.tg_tao.slice(0, 10);
  const item: DoiThuNhatKy = {
    ...prev,
    noi_dung: data.noi_dung ?? prev.noi_dung,
    nguoi_tao: data.nguoi_tao ?? prev.nguoi_tao,
    ngay,
  };
  dbNhatKy[idx] = item;
  return item;
}

export async function xoaNhatKy(id: string): Promise<void> {
  await delay(300);
  const idx = dbNhatKy.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error('Nhật ký không tồn tại');
  dbNhatKy.splice(idx, 1);
}

export async function getBattlecard(doiThuId: string): Promise<DoiThuBattlecard> {
  await delay(200);
  const raw = dbBattlecard[doiThuId] ?? getBattlecardDefault(doiThuId);
  const kich_ban_xu_ly = normalizeKichBanXuLy((raw as any).kich_ban_xu_ly);
  return { ...raw, doi_thu_id: doiThuId, kich_ban_xu_ly };
}

export async function updateBattlecard(
  doiThuId: string,
  data: BattlecardFormValues
): Promise<DoiThuBattlecard> {
  await delay(300);
  const so_sanh: BattlecardDong[] = data.so_sanh.map((d) => ({
    id: d.id || `bc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tinh_nang_dich_vu: d.tinh_nang_dich_vu,
    giai_phap_minh: d.giai_phap_minh,
    giai_phap_doi_thu: d.giai_phap_doi_thu,
  }));
  const kich_ban_xu_ly = (data.kich_ban_xu_ly || []).map((kb, i) => ({
    id: kb.id || `kb-${Date.now()}-${i}`,
    noi_dung: kb.noi_dung,
  }));
  const payload: DoiThuBattlecard = {
    doi_thu_id: doiThuId,
    so_sanh,
    diem_yeu_chi_mang: data.diem_yeu_chi_mang || [],
    kich_ban_xu_ly,
  };
  dbBattlecard[doiThuId] = payload;
  return payload;
}
