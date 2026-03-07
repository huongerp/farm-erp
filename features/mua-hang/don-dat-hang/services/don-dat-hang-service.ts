import type { DonDatHang, DonDatHangChiTiet } from '../core/types';
import type { DonDatHangFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoList } from '../../../kho-van/danh-sach-kho/services/kho-service';
import { getAllDoiTac } from '../../../kho-van/danh-sach-doi-tac/services/doi-tac-service';
import { getEmployees } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { getAllHangHoa } from '../../../kho-van/danh-sach-hang-hoa/services/hang-hoa-service';
import { getPhieuDeXuatVatTuById } from '../../../kho-van/phieu-de-xuat-vat-tu/services/phieu-de-xuat-vat-tu-service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

type DonDatHangRow = Omit<
  DonDatHang,
  'ten_nha_cung_cap' | 'ma_nha_cung_cap' | 'ten_kho_nhan' | 'so_phieu_de_xuat' | 'ten_nguoi_dat' | 'ma_nguoi_dat' | 'ten_nguoi_duyet' | 'ma_nguoi_duyet' | 'chi_tiet'
> & {
  ten_nha_cung_cap?: string;
  ma_nha_cung_cap?: string;
  ten_kho_nhan?: string | null;
  so_phieu_de_xuat?: string | null;
  ten_nguoi_dat?: string;
  ma_nguoi_dat?: string;
  ten_nguoi_duyet?: string | null;
  ma_nguoi_duyet?: string | null;
};

type ChiTietRow = Omit<DonDatHangChiTiet, 'ma_hang' | 'ten_hang'> & { ma_hang?: string; ten_hang?: string };

const seed: DonDatHangRow[] = [
  {
    id: 'ddh-1',
    so_po: 'PO-2024-001',
    ngay_dat: '2024-03-05',
    ngay_giao_dk: '2024-03-12',
    id_nha_cung_cap: 'dt-1',
    id_kho_nhan: 'kho-1',
    id_phieu_de_xuat_vat_tu: 'pdx-1',
    id_nguoi_dat: 'emp-000',
    id_nguoi_duyet: 'emp-001',
    dieu_khoan_thanh_toan: 'Trả sau 30 ngày',
    ghi_chu: 'Giao kho A',
    trang_thai: 3,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: 'ddh-2',
    so_po: 'PO-2024-002',
    ngay_dat: '2024-03-10',
    ngay_giao_dk: '2024-03-18',
    id_nha_cung_cap: 'dt-2',
    id_kho_nhan: 'kho-2',
    id_phieu_de_xuat_vat_tu: null,
    id_nguoi_dat: 'emp-003',
    id_nguoi_duyet: null,
    ghi_chu: '',
    trang_thai: 0,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const seedChiTiet: ChiTietRow[] = [
  { id: 'ct-ddh-1', id_don_dat_hang: 'ddh-1', id_hang_hoa: 'hh-1', so_luong: 20, don_vi_tinh: 'Ram', don_gia: 120000, thanh_tien: 2400000, ghi_chu: '' },
  { id: 'ct-ddh-2', id_don_dat_hang: 'ddh-1', id_hang_hoa: 'hh-2', so_luong: 50, don_vi_tinh: 'Cái', don_gia: 50000, thanh_tien: 2500000 },
  { id: 'ct-ddh-3', id_don_dat_hang: 'ddh-2', id_hang_hoa: 'hh-1', so_luong: 15, don_vi_tinh: 'Ram', don_gia: 115000 },
];

let db: DonDatHangRow[] = JSON.parse(JSON.stringify(seed));
let dbChiTiet: ChiTietRow[] = JSON.parse(JSON.stringify(seedChiTiet));

async function enrichNhaCungCap<T extends { id_nha_cung_cap: string }>(
  items: T[]
): Promise<(T & { ten_nha_cung_cap?: string; ma_nha_cung_cap?: string })[]> {
  try {
    const list = await getAllDoiTac('nha_cung_cap');
    const map: Record<string, { ten: string; ma: string }> = {};
    list.forEach((d) => { map[d.id] = { ten: d.ten_ncc, ma: d.ma_ncc }; });
    return items.map((item) => ({
      ...item,
      ten_nha_cung_cap: map[item.id_nha_cung_cap]?.ten,
      ma_nha_cung_cap: map[item.id_nha_cung_cap]?.ma,
    }));
  } catch {
    return items.map((item) => ({ ...item, ten_nha_cung_cap: undefined, ma_nha_cung_cap: undefined }));
  }
}

async function enrichKho<T extends { id_kho_nhan?: string | null }>(
  items: T[]
): Promise<(T & { ten_kho_nhan?: string | null })[]> {
  try {
    const khoList = await getKhoList();
    const map: Record<string, string> = {};
    khoList.forEach((k) => { map[k.id] = k.ten_kho; });
    return items.map((item) => ({
      ...item,
      ten_kho_nhan: item.id_kho_nhan ? (map[item.id_kho_nhan] ?? null) : null,
    }));
  } catch {
    return items.map((item) => ({ ...item, ten_kho_nhan: null }));
  }
}

async function enrichNhanVien<T extends { id_nguoi_dat: string; id_nguoi_duyet?: string | null }>(
  items: T[]
): Promise<
  (T & {
    ten_nguoi_dat?: string;
    ma_nguoi_dat?: string;
    ten_nguoi_duyet?: string | null;
    ma_nguoi_duyet?: string | null;
  })[]
> {
  try {
    const employees = await getEmployees();
    const map: Record<string, { ho_ten: string; ma_nhan_vien: string }> = {};
    employees.forEach((e) => { map[e.id] = { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien ?? '' }; });
    return items.map((item) => ({
      ...item,
      ten_nguoi_dat: map[item.id_nguoi_dat]?.ho_ten,
      ma_nguoi_dat: map[item.id_nguoi_dat]?.ma_nhan_vien,
      ten_nguoi_duyet: item.id_nguoi_duyet ? (map[item.id_nguoi_duyet]?.ho_ten ?? null) : null,
      ma_nguoi_duyet: item.id_nguoi_duyet ? (map[item.id_nguoi_duyet]?.ma_nhan_vien ?? null) : null,
    }));
  } catch {
    return items.map((item) => ({
      ...item,
      ten_nguoi_dat: undefined,
      ma_nguoi_dat: undefined,
      ten_nguoi_duyet: null,
      ma_nguoi_duyet: null,
    }));
  }
}

async function enrichSoPhieuDeXuat<T extends { id_phieu_de_xuat_vat_tu?: string | null }>(
  items: T[]
): Promise<(T & { so_phieu_de_xuat?: string | null })[]> {
  const result: (T & { so_phieu_de_xuat?: string | null })[] = [];
  for (const item of items) {
    if (!item.id_phieu_de_xuat_vat_tu) {
      result.push({ ...item, so_phieu_de_xuat: null });
      continue;
    }
    try {
      const pdx = await getPhieuDeXuatVatTuById(item.id_phieu_de_xuat_vat_tu);
      result.push({ ...item, so_phieu_de_xuat: pdx?.so_phieu ?? null });
    } catch {
      result.push({ ...item, so_phieu_de_xuat: null });
    }
  }
  return result;
}

async function enrichChiTietWithHangHoa(
  items: ChiTietRow[]
): Promise<(ChiTietRow & { ma_hang?: string; ten_hang?: string })[]> {
  try {
    const hangHoaList = await getAllHangHoa();
    const map: Record<string, { ma_hang: string; ten_hang: string; don_vi_tinh?: string }> = {};
    hangHoaList.forEach((h) => { map[h.id] = { ma_hang: h.ma_hang, ten_hang: h.ten_hang, don_vi_tinh: h.don_vi_tinh }; });
    return items.map((item) => {
      const h = map[item.id_hang_hoa];
      return {
        ...item,
        ma_hang: h?.ma_hang,
        ten_hang: h?.ten_hang,
        don_vi_tinh: item.don_vi_tinh ?? h?.don_vi_tinh,
      };
    });
  } catch {
    return items.map((item) => ({ ...item, ma_hang: undefined, ten_hang: undefined }));
  }
}

export const getAllDonDatHang = async (): Promise<DonDatHang[]> => {
  await delay(400);
  const sorted = [...db].sort(
    (a, b) => (b.ngay_dat as string).localeCompare(a.ngay_dat) || a.so_po.localeCompare(b.so_po)
  );
  let out = await enrichNhaCungCap(sorted);
  out = await enrichKho(out);
  out = await enrichNhanVien(out);
  out = await enrichSoPhieuDeXuat(out);
  return out as DonDatHang[];
};

export const getDonDatHangById = async (id: string): Promise<DonDatHang | null> => {
  await delay(200);
  const row = db.find((p) => p.id === id) ?? null;
  if (!row) return null;
  const [withNcc] = await enrichNhaCungCap([row]);
  const [withKho] = await enrichKho([withNcc]);
  const [enrichedRow] = await enrichNhanVien([withKho]);
  const [withSoPhieu] = await enrichSoPhieuDeXuat([enrichedRow]);
  const ctRows = dbChiTiet.filter((c) => c.id_don_dat_hang === id);
  const enrichedCt = await enrichChiTietWithHangHoa(ctRows);
  return { ...withSoPhieu, chi_tiet: enrichedCt } as DonDatHang;
};

export const createDonDatHang = async (data: DonDatHangFormValues): Promise<DonDatHang> => {
  await delay(500);
  const soPo = data.so_po.trim().toUpperCase();
  const existing = db.some((p) => p.so_po === soPo);
  if (existing) throw new Error(i18n.t('donDatHang.service.duplicateCode'));

  const id = `ddh-${Date.now()}`;
  const row: DonDatHangRow = {
    id,
    so_po: soPo,
    ngay_dat: data.ngay_dat.trim(),
    ngay_giao_dk: data.ngay_giao_dk.trim(),
    id_nha_cung_cap: data.id_nha_cung_cap,
    id_kho_nhan: data.id_kho_nhan?.trim() || null,
    id_phieu_de_xuat_vat_tu: data.id_phieu_de_xuat_vat_tu?.trim() || null,
    id_nguoi_dat: data.id_nguoi_dat,
    id_nguoi_duyet: data.id_nguoi_duyet?.trim() || null,
    dieu_khoan_thanh_toan: data.dieu_khoan_thanh_toan?.trim() || undefined,
    ghi_chu: data.ghi_chu?.trim() || undefined,
    trang_thai: data.trang_thai as DonDatHang['trang_thai'],
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, row];

  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h.don_vi_tinh ?? ''; });

  const chiTietPayload = (data.chi_tiet ?? []).filter(
    (ct) => ct.id_hang_hoa && Number(ct.so_luong) > 0
  );
  const newChiTiet: ChiTietRow[] = chiTietPayload.map((ct, idx) => {
    const sl = Number(ct.so_luong);
    const dg = Number(ct.don_gia ?? 0);
    return {
      id: `ct-${id}-${idx}-${Date.now()}`,
      id_don_dat_hang: id,
      id_hang_hoa: ct.id_hang_hoa,
      so_luong: sl,
      don_vi_tinh: hangHoaMap[ct.id_hang_hoa],
      don_gia: dg > 0 ? dg : undefined,
      thanh_tien: dg > 0 ? sl * dg : undefined,
      ghi_chu: ct.ghi_chu?.trim() || undefined,
    };
  });
  dbChiTiet = [...dbChiTiet, ...newChiTiet];

  let out = await enrichNhaCungCap([row]);
  out = await enrichKho(out);
  out = await enrichNhanVien(out);
  out = await enrichSoPhieuDeXuat(out);
  const enrichedCt = await enrichChiTietWithHangHoa(newChiTiet);
  return { ...out[0], chi_tiet: enrichedCt } as DonDatHang;
};

export const updateDonDatHang = async (
  id: string,
  data: DonDatHangFormValues
): Promise<DonDatHang> => {
  await delay(500);
  const index = db.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(i18n.t('donDatHang.service.notFound'));

  const soPo = data.so_po.trim().toUpperCase();
  const other = db.find((p) => p.id !== id && p.so_po === soPo);
  if (other) throw new Error(i18n.t('donDatHang.service.duplicateCode'));

  const row: DonDatHangRow = {
    ...db[index],
    so_po: soPo,
    ngay_dat: data.ngay_dat.trim(),
    ngay_giao_dk: data.ngay_giao_dk.trim(),
    id_nha_cung_cap: data.id_nha_cung_cap,
    id_kho_nhan: data.id_kho_nhan?.trim() || null,
    id_phieu_de_xuat_vat_tu: data.id_phieu_de_xuat_vat_tu?.trim() || null,
    id_nguoi_dat: data.id_nguoi_dat,
    id_nguoi_duyet: data.id_nguoi_duyet?.trim() || null,
    dieu_khoan_thanh_toan: data.dieu_khoan_thanh_toan?.trim() || undefined,
    ghi_chu: data.ghi_chu?.trim() || undefined,
    trang_thai: data.trang_thai as DonDatHang['trang_thai'],
    tg_cap_nhat: ts(),
  };
  db[index] = row;

  dbChiTiet = dbChiTiet.filter((c) => c.id_don_dat_hang !== id);
  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h.don_vi_tinh ?? ''; });

  const chiTietPayload = (data.chi_tiet ?? []).filter(
    (ct) => ct.id_hang_hoa && Number(ct.so_luong) > 0
  );
  const newChiTiet: ChiTietRow[] = chiTietPayload.map((ct, idx) => {
    const sl = Number(ct.so_luong);
    const dg = Number(ct.don_gia ?? 0);
    return {
      id: `ct-${id}-${idx}-${Date.now()}`,
      id_don_dat_hang: id,
      id_hang_hoa: ct.id_hang_hoa,
      so_luong: sl,
      don_vi_tinh: hangHoaMap[ct.id_hang_hoa],
      don_gia: dg > 0 ? dg : undefined,
      thanh_tien: dg > 0 ? sl * dg : undefined,
      ghi_chu: ct.ghi_chu?.trim() || undefined,
    };
  });
  dbChiTiet = [...dbChiTiet, ...newChiTiet];

  let out = await enrichNhaCungCap([row]);
  out = await enrichKho(out);
  out = await enrichNhanVien(out);
  out = await enrichSoPhieuDeXuat(out);
  const enrichedCt = await enrichChiTietWithHangHoa(newChiTiet);
  return { ...out[0], chi_tiet: enrichedCt } as DonDatHang;
};

export const deleteDonDatHang = async (id: string): Promise<void> => {
  await delay(400);
  const idx = db.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(i18n.t('donDatHang.service.notFound'));
  dbChiTiet = dbChiTiet.filter((c) => c.id_don_dat_hang !== id);
  db = db.filter((p) => p.id !== id);
};

export const deleteDonDatHangMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  const idSet = new Set(ids);
  dbChiTiet = dbChiTiet.filter((c) => !idSet.has(c.id_don_dat_hang));
  db = db.filter((p) => !idSet.has(p.id));
};
