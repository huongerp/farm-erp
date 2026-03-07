import type { PhieuDeXuatVatTu, PhieuDeXuatVatTuChiTiet } from '../core/types';
import type { PhieuDeXuatVatTuFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { getAllHangHoa } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getEmployees } from '../../../he-thong/nhan-vien/services/nhan-vien-service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

type PhieuRow = Omit<
  PhieuDeXuatVatTu,
  'ten_noi_de_xuat' | 'ten_nguoi_de_xuat' | 'ma_nguoi_de_xuat' | 'ten_nguoi_duyet' | 'ma_nguoi_duyet' | 'chi_tiet'
> & {
  ten_noi_de_xuat?: string;
  ten_nguoi_de_xuat?: string;
  ma_nguoi_de_xuat?: string;
  ten_nguoi_duyet?: string | null;
  ma_nguoi_duyet?: string | null;
};

type ChiTietRow = Omit<PhieuDeXuatVatTuChiTiet, 'ma_hang' | 'ten_hang'> & { ma_hang?: string; ten_hang?: string };

const seed: PhieuRow[] = [
  {
    id: 'pdx-1',
    so_phieu: 'PDX-001',
    ngay: '2024-03-01',
    ngay_can: '2024-03-05',
    id_noi_de_xuat: 'kho-1',
    id_nguoi_de_xuat: 'emp-000',
    id_nguoi_duyet: 'emp-001',
    ghi_chu: 'Vật tư phục vụ dự án Q1',
    trang_thai: 1,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: 'pdx-2',
    so_phieu: 'PDX-002',
    ngay: '2024-03-08',
    ngay_can: '2024-03-12',
    id_noi_de_xuat: 'kho-2',
    id_nguoi_de_xuat: 'emp-003',
    id_nguoi_duyet: null,
    ghi_chu: 'Chờ duyệt',
    trang_thai: 0,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
  {
    id: 'pdx-3',
    so_phieu: 'PDX-003',
    ngay: '2024-03-10',
    ngay_can: '2024-03-15',
    id_noi_de_xuat: 'kho-1',
    id_nguoi_de_xuat: 'emp-002',
    id_nguoi_duyet: 'emp-001',
    ghi_chu: 'Không đủ ngân sách',
    trang_thai: 2,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  },
];

const seedChiTiet: ChiTietRow[] = [
  { id: 'ct-pdx-1', id_phieu_de_xuat_vat_tu: 'pdx-1', id_hang_hoa: 'hh-1', so_luong: 20, don_vi_tinh: 'Ram', ghi_chu: 'Giấy A4' },
  { id: 'ct-pdx-2', id_phieu_de_xuat_vat_tu: 'pdx-1', id_hang_hoa: 'hh-2', so_luong: 50, don_vi_tinh: 'Cái' },
  { id: 'ct-pdx-3', id_phieu_de_xuat_vat_tu: 'pdx-2', id_hang_hoa: 'hh-1', so_luong: 15, don_vi_tinh: 'Ram' },
  { id: 'ct-pdx-4', id_phieu_de_xuat_vat_tu: 'pdx-2', id_hang_hoa: 'hh-3', so_luong: 25, don_vi_tinh: 'Cái' },
  { id: 'ct-pdx-5', id_phieu_de_xuat_vat_tu: 'pdx-3', id_hang_hoa: 'hh-2', so_luong: 10, don_vi_tinh: 'Cái' },
];

let db: PhieuRow[] = JSON.parse(JSON.stringify(seed));
let dbChiTiet: ChiTietRow[] = JSON.parse(JSON.stringify(seedChiTiet));

async function enrichNoiDeXuat<T extends { id_noi_de_xuat: string }>(
  items: T[]
): Promise<(T & { ten_noi_de_xuat?: string })[]> {
  try {
    const khoList = await getKhoList();
    const map: Record<string, string> = {};
    khoList.forEach((k) => {
      map[k.id] = k.ten_kho;
    });
    return items.map((item) => ({
      ...item,
      ten_noi_de_xuat: map[item.id_noi_de_xuat] ?? undefined,
    }));
  } catch {
    return items.map((item) => ({ ...item, ten_noi_de_xuat: undefined }));
  }
}

async function enrichNhanVien<T extends { id_nguoi_de_xuat: string; id_nguoi_duyet?: string | null }>(
  items: T[]
): Promise<
  (T & {
    ten_nguoi_de_xuat?: string;
    ma_nguoi_de_xuat?: string;
    ten_nguoi_duyet?: string | null;
    ma_nguoi_duyet?: string | null;
  })[]
> {
  try {
    const employees = await getEmployees();
    const map: Record<string, { ho_ten: string; ma_nhan_vien: string }> = {};
    employees.forEach((e) => {
      map[e.id] = { ho_ten: e.ho_ten, ma_nhan_vien: e.ma_nhan_vien ?? '' };
    });
    return items.map((item) => ({
      ...item,
      ten_nguoi_de_xuat: map[item.id_nguoi_de_xuat]?.ho_ten,
      ma_nguoi_de_xuat: map[item.id_nguoi_de_xuat]?.ma_nhan_vien,
      ten_nguoi_duyet: item.id_nguoi_duyet ? (map[item.id_nguoi_duyet]?.ho_ten ?? null) : null,
      ma_nguoi_duyet: item.id_nguoi_duyet ? (map[item.id_nguoi_duyet]?.ma_nhan_vien ?? null) : null,
    }));
  } catch {
    return items.map((item) => ({
      ...item,
      ten_nguoi_de_xuat: undefined,
      ma_nguoi_de_xuat: undefined,
      ten_nguoi_duyet: null,
      ma_nguoi_duyet: null,
    }));
  }
}

async function enrichChiTietWithHangHoa(
  items: ChiTietRow[]
): Promise<(ChiTietRow & { ma_hang?: string; ten_hang?: string })[]> {
  try {
    const hangHoaList = await getAllHangHoa();
    const map: Record<string, { ma_hang: string; ten_hang: string; don_vi_tinh?: string }> = {};
    hangHoaList.forEach((h) => {
      map[h.id] = { ma_hang: h.ma_hang, ten_hang: h.ten_hang, don_vi_tinh: h.don_vi_tinh };
    });
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

export const getAllPhieuDeXuatVatTu = async (): Promise<PhieuDeXuatVatTu[]> => {
  await delay(400);
  const sorted = [...db].sort(
    (a, b) => (b.ngay as string).localeCompare(a.ngay) || a.so_phieu.localeCompare(b.so_phieu)
  );
  const withNoiDeXuat = await enrichNoiDeXuat(sorted);
  const withNhanVien = await enrichNhanVien(withNoiDeXuat);
  return withNhanVien as PhieuDeXuatVatTu[];
};

export const getPhieuDeXuatVatTuById = async (id: string): Promise<PhieuDeXuatVatTu | null> => {
  await delay(200);
  const row = db.find((p) => p.id === id) ?? null;
  if (!row) return null;
  const [withNoiDeXuat] = await enrichNoiDeXuat([row]);
  const [enrichedRow] = await enrichNhanVien([withNoiDeXuat]);
  const ctRows = dbChiTiet.filter((c) => c.id_phieu_de_xuat_vat_tu === id);
  const enrichedCt = await enrichChiTietWithHangHoa(ctRows);
  return {
    ...enrichedRow,
    chi_tiet: enrichedCt,
  } as PhieuDeXuatVatTu;
};

export const createPhieuDeXuatVatTu = async (
  data: PhieuDeXuatVatTuFormValues
): Promise<PhieuDeXuatVatTu> => {
  await delay(500);
  const soPhieu = data.so_phieu.trim().toUpperCase();
  const existing = db.some((p) => p.so_phieu === soPhieu);
  if (existing) throw new Error(i18n.t('phieuDeXuatVatTu.service.duplicateCode'));

  const id = `pdx-${Date.now()}`;
  const row: PhieuRow = {
    id,
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    ngay_can: data.ngay_can.trim(),
    id_noi_de_xuat: data.id_noi_de_xuat,
    id_nguoi_de_xuat: data.id_nguoi_de_xuat,
    id_nguoi_duyet: data.id_nguoi_duyet?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || undefined,
    trang_thai: data.trang_thai as 0 | 1 | 2,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, row];

  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });

  const chiTietPayload = (data.chi_tiet ?? []).filter(
    (ct) => ct.id_hang_hoa && Number(ct.so_luong) > 0
  );
  const newChiTiet: ChiTietRow[] = chiTietPayload.map((ct, idx) => ({
    id: `ct-${id}-${idx}-${Date.now()}`,
    id_phieu_de_xuat_vat_tu: id,
    id_hang_hoa: ct.id_hang_hoa,
    so_luong: ct.so_luong,
    don_vi_tinh: hangHoaMap[ct.id_hang_hoa],
    thong_so: ct.thong_so?.trim() || undefined,
    ghi_chu: ct.ghi_chu?.trim() || undefined,
  }));
  dbChiTiet = [...dbChiTiet, ...newChiTiet];

  const [withNoiDeXuat] = await enrichNoiDeXuat([row]);
  const [enriched] = await enrichNhanVien([withNoiDeXuat]);
  const enrichedCt = await enrichChiTietWithHangHoa(newChiTiet);
  return { ...enriched, chi_tiet: enrichedCt } as PhieuDeXuatVatTu;
};

export const updatePhieuDeXuatVatTu = async (
  id: string,
  data: PhieuDeXuatVatTuFormValues
): Promise<PhieuDeXuatVatTu> => {
  await delay(500);
  const index = db.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));

  const soPhieu = data.so_phieu.trim().toUpperCase();
  const other = db.find((p) => p.id !== id && p.so_phieu === soPhieu);
  if (other) throw new Error(i18n.t('phieuDeXuatVatTu.service.duplicateCode'));

  const row: PhieuRow = {
    ...db[index],
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    ngay_can: data.ngay_can.trim(),
    id_noi_de_xuat: data.id_noi_de_xuat,
    id_nguoi_de_xuat: data.id_nguoi_de_xuat,
    id_nguoi_duyet: data.id_nguoi_duyet?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || undefined,
    trang_thai: data.trang_thai as 0 | 1 | 2,
    tg_cap_nhat: ts(),
  };
  db[index] = row;

  dbChiTiet = dbChiTiet.filter((c) => c.id_phieu_de_xuat_vat_tu !== id);
  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => {
    hangHoaMap[h.id] = h.don_vi_tinh ?? '';
  });

  const chiTietPayload = (data.chi_tiet ?? []).filter(
    (ct) => ct.id_hang_hoa && Number(ct.so_luong) > 0
  );
  const newChiTiet: ChiTietRow[] = chiTietPayload.map((ct, idx) => ({
    id: `ct-${id}-${idx}-${Date.now()}`,
    id_phieu_de_xuat_vat_tu: id,
    id_hang_hoa: ct.id_hang_hoa,
    so_luong: ct.so_luong,
    don_vi_tinh: hangHoaMap[ct.id_hang_hoa],
    thong_so: ct.thong_so?.trim() || undefined,
    ghi_chu: ct.ghi_chu?.trim() || undefined,
  }));
  dbChiTiet = [...dbChiTiet, ...newChiTiet];

  const [withNoiDeXuat] = await enrichNoiDeXuat([row]);
  const [enriched] = await enrichNhanVien([withNoiDeXuat]);
  const enrichedCt = await enrichChiTietWithHangHoa(newChiTiet);
  return { ...enriched, chi_tiet: enrichedCt } as PhieuDeXuatVatTu;
};

export const deletePhieuDeXuatVatTu = async (id: string): Promise<void> => {
  await delay(400);
  const idx = db.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(i18n.t('phieuDeXuatVatTu.service.notFound'));
  dbChiTiet = dbChiTiet.filter((c) => c.id_phieu_de_xuat_vat_tu !== id);
  db = db.filter((p) => p.id !== id);
};

export const deletePhieuDeXuatVatTuMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  const idSet = new Set(ids);
  dbChiTiet = dbChiTiet.filter((c) => !idSet.has(c.id_phieu_de_xuat_vat_tu));
  db = db.filter((p) => !idSet.has(p.id));
};
