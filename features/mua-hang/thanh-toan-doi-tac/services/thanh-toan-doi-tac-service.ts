import type { ThanhToanDoiTac } from '../core/types';
import type { ThanhToanDoiTacFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getDepartments } from '../../../he-thong/phong-ban/services/phong-ban-service';
import { getAllNhaCungCap } from '../../danh-sach-doi-tac/services/nha-cung-cap-service';
import { getEmployees } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { getTrangThaiThanhToanDoiTacList } from '../../thiet-lap-de-xuat-vat-tu/services/trang-thai-thanh-toan-doi-tac-service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

type Row = Omit<
  ThanhToanDoiTac,
  'ten_don_vi' | 'ten_doi_tac' | 'ma_doi_tac' | 'ten_trang_thai' | 'ma_trang_thai' | 'ten_nguoi_tao' | 'ma_nguoi_tao'
>;

const seed: Row[] = [
  {
    id: 'tto-1',
    so_phieu: 'TTO-2026-001',
    hang_muc_thanh_toan: 'DNTT tiền cơm bếp ăn tuần 9',
    ngay: '2026-03-02',
    id_don_vi: 'dep-1',
    id_doi_tac: 'ncc-mh-1',
    id_trang_thai_thanh_toan: 'tttt-1',
    so_tien: 4770000,
    ngay_xu_ly: '2026-03-02',
    ghi_chu: 'Chi đề nghị thanh toán',
    id_nguoi_tao: 'emp-000',
    tg_tao: '2026-03-02T06:35:08.000Z',
    tg_cap_nhat: ts(),
  },
  {
    id: 'tto-2',
    so_phieu: 'TTO-2026-002',
    hang_muc_thanh_toan: 'Thanh toán dịch vụ vận chuyển',
    ngay: '2026-03-01',
    id_don_vi: null,
    id_doi_tac: 'ncc-mh-3',
    id_trang_thai_thanh_toan: 'tttt-2',
    so_tien: 15000000,
    ngay_xu_ly: null,
    ghi_chu: null,
    id_nguoi_tao: 'emp-001',
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

let db: Row[] = JSON.parse(JSON.stringify(seed));

async function enrichDonVi<T extends { id_don_vi: string | null }>(
  items: T[]
): Promise<(T & { ten_don_vi?: string | null })[]> {
  try {
    const depts = await getDepartments();
    const map: Record<string, string> = {};
    depts.forEach((d) => {
      map[d.id] = d.ten_phong_ban;
    });
    return items.map((item) => ({
      ...item,
      ten_don_vi: item.id_don_vi ? (map[item.id_don_vi] ?? null) : null,
    }));
  } catch {
    return items.map((item) => ({ ...item, ten_don_vi: undefined }));
  }
}

async function enrichDoiTac<T extends { id_doi_tac: string }>(
  items: T[]
): Promise<(T & { ten_doi_tac?: string; ma_doi_tac?: string })[]> {
  try {
    const list = await getAllNhaCungCap();
    const map: Record<string, { ten: string; ma: string }> = {};
    list.forEach((d) => {
      map[d.id] = { ten: d.ten_ncc, ma: d.ma_ncc };
    });
    return items.map((item) => ({
      ...item,
      ten_doi_tac: map[item.id_doi_tac]?.ten,
      ma_doi_tac: map[item.id_doi_tac]?.ma,
    }));
  } catch {
    return items.map((item) => ({ ...item, ten_doi_tac: undefined, ma_doi_tac: undefined }));
  }
}

async function enrichTrangThai<T extends { id_trang_thai_thanh_toan: string }>(
  items: T[]
): Promise<(T & { ten_trang_thai?: string; ma_trang_thai?: string })[]> {
  try {
    const list = await getTrangThaiThanhToanDoiTacList();
    const map: Record<string, { ten: string; ma: string }> = {};
    list.forEach((s) => {
      map[s.id] = { ten: s.ten, ma: s.ma };
    });
    return items.map((item) => ({
      ...item,
      ten_trang_thai: map[item.id_trang_thai_thanh_toan]?.ten,
      ma_trang_thai: map[item.id_trang_thai_thanh_toan]?.ma,
    }));
  } catch {
    return items.map((item) => ({ ...item, ten_trang_thai: undefined, ma_trang_thai: undefined }));
  }
}

async function enrichNguoiTao<T extends { id_nguoi_tao: string }>(
  items: T[]
): Promise<(T & { ten_nguoi_tao?: string; ma_nguoi_tao?: string })[]> {
  try {
    const employees = await getEmployees();
    const map: Record<string, { ten: string; ma: string }> = {};
    employees.forEach((e) => {
      map[e.id] = { ten: e.ho_ten ?? '', ma: e.ma_nhan_vien ?? '' };
    });
    return items.map((item) => ({
      ...item,
      ten_nguoi_tao: map[item.id_nguoi_tao]?.ten,
      ma_nguoi_tao: map[item.id_nguoi_tao]?.ma,
    }));
  } catch {
    return items.map((item) => ({ ...item, ten_nguoi_tao: undefined, ma_nguoi_tao: undefined }));
  }
}

export const getAllThanhToanDoiTac = async (): Promise<ThanhToanDoiTac[]> => {
  await delay(300);
  let out: Row[] = [...db].sort(
    (a, b) => (b.ngay as string).localeCompare(a.ngay) || b.so_phieu.localeCompare(a.so_phieu)
  );
  out = await enrichDonVi(out);
  out = await enrichDoiTac(out);
  out = await enrichTrangThai(out);
  out = await enrichNguoiTao(out);
  return out as ThanhToanDoiTac[];
};

export const getThanhToanDoiTacById = async (id: string): Promise<ThanhToanDoiTac | null> => {
  await delay(200);
  const row = db.find((p) => p.id === id) ?? null;
  if (!row) return null;
  const [withDonVi] = await enrichDonVi([row]);
  const [withDoiTac] = await enrichDoiTac([withDonVi]);
  const [withTrangThai] = await enrichTrangThai([withDoiTac]);
  const [withNguoiTao] = await enrichNguoiTao([withTrangThai]);
  return withNguoiTao as ThanhToanDoiTac;
};

export const createThanhToanDoiTac = async (
  data: ThanhToanDoiTacFormValues
): Promise<ThanhToanDoiTac> => {
  await delay(400);
  const soPhieu = data.so_phieu.trim();
  const existing = db.some((p) => p.so_phieu === soPhieu);
  if (existing) throw new Error(i18n.t('thanhToanDoiTac.service.duplicateSoPhieu'));

  const id = `tto-${Date.now()}`;
  const row: Row = {
    id,
    so_phieu: soPhieu,
    hang_muc_thanh_toan: data.hang_muc_thanh_toan.trim(),
    ngay: data.ngay.trim(),
    id_don_vi: data.id_don_vi?.trim() || null,
    id_doi_tac: data.id_doi_tac,
    id_trang_thai_thanh_toan: data.id_trang_thai_thanh_toan,
    so_tien: Number(data.so_tien),
    ngay_xu_ly: data.ngay_xu_ly?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: data.id_nguoi_tao,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [row, ...db];
  const [enriched] = await enrichNguoiTao(
    await enrichTrangThai(await enrichDoiTac(await enrichDonVi([row])))
  );
  return enriched as ThanhToanDoiTac;
};

export const updateThanhToanDoiTac = async (
  id: string,
  data: ThanhToanDoiTacFormValues
): Promise<ThanhToanDoiTac> => {
  await delay(400);
  const idx = db.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));

  const soPhieu = data.so_phieu.trim();
  const other = db.find((p) => p.id !== id && p.so_phieu === soPhieu);
  if (other) throw new Error(i18n.t('thanhToanDoiTac.service.duplicateSoPhieu'));

  const row: Row = {
    ...db[idx],
    so_phieu: soPhieu,
    hang_muc_thanh_toan: data.hang_muc_thanh_toan.trim(),
    ngay: data.ngay.trim(),
    id_don_vi: data.id_don_vi?.trim() || null,
    id_doi_tac: data.id_doi_tac,
    id_trang_thai_thanh_toan: data.id_trang_thai_thanh_toan,
    so_tien: Number(data.so_tien),
    ngay_xu_ly: data.ngay_xu_ly?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    id_nguoi_tao: data.id_nguoi_tao,
    tg_cap_nhat: ts(),
  };
  db[idx] = row;
  const [enriched] = await enrichNguoiTao(
    await enrichTrangThai(await enrichDoiTac(await enrichDonVi([row])))
  );
  return enriched as ThanhToanDoiTac;
};

export const deleteThanhToanDoiTac = async (id: string): Promise<void> => {
  await delay(300);
  const idx = db.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(i18n.t('thanhToanDoiTac.service.notFound'));
  db = db.filter((p) => p.id !== id);
};

export const deleteThanhToanDoiTacMany = async (ids: string[]): Promise<void> => {
  await delay(400);
  db = db.filter((p) => !ids.includes(p.id));
};
