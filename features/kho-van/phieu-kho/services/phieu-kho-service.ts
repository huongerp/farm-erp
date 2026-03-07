import type { PhieuKho, PhieuKhoChiTiet, LoaiPhieuKho, ChiTietPhieuKhoFlat } from '../core/types';
import type { PhieuKhoFormValues } from '../core/schema';
import i18n from '../../../../lib/i18n';
import { getKhoList } from '../../danh-sach-kho/services/kho-service';
import { getAllHangHoa } from '../../danh-sach-hang-hoa/services/hang-hoa-service';
import { getAllDoiTac } from '../../danh-sach-doi-tac/services/doi-tac-service';
import { capNhatTonKho } from './ton-kho-service';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

type PhieuKhoRow = Omit<PhieuKho, 'ten_kho' | 'ten_kho_den' | 'ten_nha_cung_cap' | 'ten_khach_hang' | 'chi_tiet'> & { ten_kho?: string; ten_kho_den?: string; ten_nha_cung_cap?: string; ten_khach_hang?: string };

type ChiTietRow = Omit<PhieuKhoChiTiet, 'ma_hang' | 'ten_hang'> & { ma_hang?: string; ten_hang?: string };

const seed: PhieuKhoRow[] = [
  { id: 'pk-n-1', so_phieu: 'PN-001', ngay: '2024-03-01', loai: 'nhap', id_kho: 'kho-1', id_kho_den: null, id_nha_cung_cap: 'dt-1', trang_thai: 1, mo_ta: 'Nhập hàng đầu kỳ', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pk-n-2', so_phieu: 'PN-002', ngay: '2024-03-05', loai: 'nhap', id_kho: 'kho-1', id_kho_den: null, trang_thai: 0, mo_ta: 'Chờ duyệt', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pk-n-3', so_phieu: 'PN-003', ngay: '2024-03-10', loai: 'nhap', id_kho: 'kho-2', id_kho_den: null, trang_thai: 2, mo_ta: 'Phiếu không duyệt', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pk-x-1', so_phieu: 'PX-001', ngay: '2024-03-02', loai: 'xuat', id_kho: 'kho-1', id_kho_den: null, id_khach_hang: 'dt-7', trang_thai: 1, mo_ta: 'Xuất bán', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pk-x-2', so_phieu: 'PX-002', ngay: '2024-03-08', loai: 'xuat', id_kho: 'kho-1', id_kho_den: null, id_khach_hang: 'dt-8', trang_thai: 0, tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pk-c-1', so_phieu: 'PC-001', ngay: '2024-03-03', loai: 'chuyen', id_kho: 'kho-1', id_kho_den: 'kho-2', trang_thai: 1, mo_ta: 'Chuyển từ TW sang PB', tg_tao: ts(), tg_cap_nhat: ts() },
  { id: 'pk-c-2', so_phieu: 'PC-002', ngay: '2024-03-12', loai: 'chuyen', id_kho: 'kho-2', id_kho_den: 'kho-1', trang_thai: 0, tg_tao: ts(), tg_cap_nhat: ts() },
];

const seedChiTiet: ChiTietRow[] = [
  { id: 'ct-1', id_phieu_kho: 'pk-n-1', id_hang_hoa: 'hh-1', so_luong: 20, don_vi_tinh: 'Ram', ghi_chu: 'Nhập đầu kỳ' },
  { id: 'ct-2', id_phieu_kho: 'pk-n-1', id_hang_hoa: 'hh-2', so_luong: 50, don_vi_tinh: 'Cái' },
  { id: 'ct-3', id_phieu_kho: 'pk-n-2', id_hang_hoa: 'hh-1', so_luong: 15, don_vi_tinh: 'Ram' },
  { id: 'ct-4', id_phieu_kho: 'pk-n-2', id_hang_hoa: 'hh-3', so_luong: 25, don_vi_tinh: 'Cái', ghi_chu: 'Chờ duyệt' },
  { id: 'ct-5', id_phieu_kho: 'pk-n-3', id_hang_hoa: 'hh-2', so_luong: 10, don_vi_tinh: 'Cái' },
  { id: 'ct-6', id_phieu_kho: 'pk-n-3', id_hang_hoa: 'hh-3', so_luong: 8, don_vi_tinh: 'Cái' },
  { id: 'ct-7', id_phieu_kho: 'pk-x-1', id_hang_hoa: 'hh-1', so_luong: 5, don_vi_tinh: 'Ram' },
  { id: 'ct-8', id_phieu_kho: 'pk-x-1', id_hang_hoa: 'hh-3', so_luong: 10, don_vi_tinh: 'Cái' },
  { id: 'ct-9', id_phieu_kho: 'pk-x-2', id_hang_hoa: 'hh-1', so_luong: 3, don_vi_tinh: 'Ram' },
  { id: 'ct-10', id_phieu_kho: 'pk-x-2', id_hang_hoa: 'hh-2', so_luong: 20, don_vi_tinh: 'Cái' },
  { id: 'ct-11', id_phieu_kho: 'pk-c-1', id_hang_hoa: 'hh-2', so_luong: 30, don_vi_tinh: 'Cái', ghi_chu: 'Chuyển TW sang PB' },
  { id: 'ct-12', id_phieu_kho: 'pk-c-1', id_hang_hoa: 'hh-3', so_luong: 12, don_vi_tinh: 'Cái' },
  { id: 'ct-13', id_phieu_kho: 'pk-c-2', id_hang_hoa: 'hh-1', so_luong: 8, don_vi_tinh: 'Ram' },
  { id: 'ct-14', id_phieu_kho: 'pk-c-2', id_hang_hoa: 'hh-2', so_luong: 15, don_vi_tinh: 'Cái' },
];

let db: PhieuKhoRow[] = JSON.parse(JSON.stringify(seed));
let dbChiTiet: ChiTietRow[] = JSON.parse(JSON.stringify(seedChiTiet));

async function enrichKhoNames<T extends { id_kho: string; id_kho_den?: string | null }>(items: T[]): Promise<(T & { ten_kho?: string; ten_kho_den?: string })[]> {
  const khoList = await getKhoList();
  const map: Record<string, string> = {};
  khoList.forEach((k) => { map[k.id] = k.ten_kho; });
  return items.map((item) => ({
    ...item,
    ten_kho: map[item.id_kho] ?? undefined,
    ten_kho_den: item.id_kho_den ? (map[item.id_kho_den] ?? undefined) : undefined,
  }));
}

async function enrichDoiTacNames<T extends { id_nha_cung_cap?: string | null; id_khach_hang?: string | null }>(items: T[]): Promise<(T & { ten_nha_cung_cap?: string; ten_khach_hang?: string })[]> {
  const doiTacList = await getAllDoiTac();
  const map: Record<string, string> = {};
  doiTacList.forEach((n) => { map[n.id] = n.ten_ncc; });
  return items.map((item) => ({
    ...item,
    ten_nha_cung_cap: item.id_nha_cung_cap ? (map[item.id_nha_cung_cap] ?? undefined) : undefined,
    ten_khach_hang: item.id_khach_hang ? (map[item.id_khach_hang] ?? undefined) : undefined,
  }));
}

async function enrichChiTietWithHangHoa(items: ChiTietRow[]): Promise<(ChiTietRow & { ma_hang?: string; ten_hang?: string })[]> {
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
}

function applyTonKhoForChiTiet(
  chiTiet: { id_hang_hoa: string; so_luong: number }[],
  loai: LoaiPhieuKho,
  id_kho: string,
  id_kho_den: string | null
): void {
  chiTiet.forEach((ct) => {
    if (loai === 'nhap') {
      capNhatTonKho(id_kho, ct.id_hang_hoa, ct.so_luong);
    } else if (loai === 'xuat') {
      capNhatTonKho(id_kho, ct.id_hang_hoa, -ct.so_luong);
    } else if (loai === 'chuyen' && id_kho_den) {
      capNhatTonKho(id_kho, ct.id_hang_hoa, -ct.so_luong);
      capNhatTonKho(id_kho_den, ct.id_hang_hoa, ct.so_luong);
    }
  });
}

function revertTonKhoForChiTiet(
  chiTiet: { id_hang_hoa: string; so_luong: number }[],
  loai: LoaiPhieuKho,
  id_kho: string,
  id_kho_den: string | null
): void {
  chiTiet.forEach((ct) => {
    if (loai === 'nhap') {
      capNhatTonKho(id_kho, ct.id_hang_hoa, -ct.so_luong);
    } else if (loai === 'xuat') {
      capNhatTonKho(id_kho, ct.id_hang_hoa, ct.so_luong);
    } else if (loai === 'chuyen' && id_kho_den) {
      capNhatTonKho(id_kho, ct.id_hang_hoa, ct.so_luong);
      capNhatTonKho(id_kho_den, ct.id_hang_hoa, -ct.so_luong);
    }
  });
}

export const getAllPhieuKho = async (): Promise<PhieuKho[]> => {
  await delay(400);
  const sorted = [...db].sort((a, b) => (b.ngay as string).localeCompare(a.ngay) || a.so_phieu.localeCompare(b.so_phieu));
  const withKho = await enrichKhoNames(sorted);
  const withDoiTac = await enrichDoiTacNames(withKho);
  return withDoiTac as PhieuKho[];
};

export const getPhieuKhoById = async (id: string): Promise<PhieuKho | null> => {
  await delay(200);
  const row = db.find((p) => p.id === id) ?? null;
  if (!row) return null;
  const [withKho] = await enrichKhoNames([row]);
  const [enrichedRow] = await enrichDoiTacNames([withKho]);
  const ctRows = dbChiTiet.filter((c) => c.id_phieu_kho === id);
  const enrichedCt = await enrichChiTietWithHangHoa(ctRows);
  return {
    ...enrichedRow,
    chi_tiet: enrichedCt,
  } as PhieuKho;
};

export const createPhieuKho = async (loai: LoaiPhieuKho, data: PhieuKhoFormValues): Promise<PhieuKho> => {
  await delay(500);
  const soPhieu = data.so_phieu.trim().toUpperCase();
  const existing = db.some((p) => p.so_phieu === soPhieu && p.loai === loai);
  if (existing) throw new Error(i18n.t('phieuKho.service.duplicateCode'));

  const id = `pk-${loai.charAt(0)}-${Date.now()}`;
  const id_kho_den = loai === 'chuyen' && data.id_kho_den ? data.id_kho_den : null;
  const id_nha_cung_cap = data.id_nha_cung_cap && data.id_nha_cung_cap.trim() ? data.id_nha_cung_cap.trim() : null;
  const id_khach_hang = data.id_khach_hang && data.id_khach_hang.trim() ? data.id_khach_hang.trim() : null;
  const row: PhieuKhoRow = {
    id,
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    loai,
    id_kho: data.id_kho,
    id_kho_den,
    id_nha_cung_cap: id_nha_cung_cap ?? undefined,
    id_khach_hang: id_khach_hang ?? undefined,
    trang_thai: data.trang_thai as 0 | 1 | 2,
    mo_ta: data.mo_ta?.trim() || undefined,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, row];

  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h.don_vi_tinh ?? ''; });

  const chiTietPayload = data.chi_tiet ?? [];
  const newChiTiet: ChiTietRow[] = chiTietPayload.map((ct, idx) => ({
    id: `ct-${id}-${idx}-${Date.now()}`,
    id_phieu_kho: id,
    id_hang_hoa: ct.id_hang_hoa,
    so_luong: ct.so_luong,
    don_vi_tinh: hangHoaMap[ct.id_hang_hoa],
    ghi_chu: ct.ghi_chu?.trim() || undefined,
  }));
  dbChiTiet = [...dbChiTiet, ...newChiTiet];

  applyTonKhoForChiTiet(
    newChiTiet.map((c) => ({ id_hang_hoa: c.id_hang_hoa, so_luong: c.so_luong })),
    loai,
    data.id_kho,
    id_kho_den
  );

  const [withKho] = await enrichKhoNames([row]);
  const [enriched] = await enrichDoiTacNames([withKho]);
  const enrichedCt = await enrichChiTietWithHangHoa(newChiTiet);
  return { ...enriched, chi_tiet: enrichedCt } as PhieuKho;
};

export const updatePhieuKho = async (id: string, data: PhieuKhoFormValues): Promise<PhieuKho> => {
  await delay(500);
  const index = db.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(i18n.t('phieuKho.service.notFound'));

  const oldRow = db[index];
  const soPhieu = data.so_phieu.trim().toUpperCase();
  const other = db.find((p) => p.id !== id && p.so_phieu === soPhieu && p.loai === oldRow.loai);
  if (other) throw new Error(i18n.t('phieuKho.service.duplicateCode'));

  const oldChiTiet = dbChiTiet.filter((c) => c.id_phieu_kho === id);
  revertTonKhoForChiTiet(
    oldChiTiet.map((c) => ({ id_hang_hoa: c.id_hang_hoa, so_luong: c.so_luong })),
    oldRow.loai,
    oldRow.id_kho,
    oldRow.id_kho_den ?? null
  );

  const id_kho_den = oldRow.loai === 'chuyen' && data.id_kho_den ? data.id_kho_den : null;
  const id_nha_cung_cap = data.id_nha_cung_cap && data.id_nha_cung_cap.trim() ? data.id_nha_cung_cap.trim() : null;
  const id_khach_hang = data.id_khach_hang && data.id_khach_hang.trim() ? data.id_khach_hang.trim() : null;
  const row: PhieuKhoRow = {
    ...oldRow,
    so_phieu: soPhieu,
    ngay: data.ngay.trim(),
    id_kho: data.id_kho,
    id_kho_den,
    id_nha_cung_cap: id_nha_cung_cap ?? undefined,
    id_khach_hang: id_khach_hang ?? undefined,
    trang_thai: data.trang_thai as 0 | 1 | 2,
    mo_ta: data.mo_ta?.trim() || undefined,
    tg_cap_nhat: ts(),
  };
  db[index] = row;

  dbChiTiet = dbChiTiet.filter((c) => c.id_phieu_kho !== id);
  const hangHoaList = await getAllHangHoa();
  const hangHoaMap: Record<string, string> = {};
  hangHoaList.forEach((h) => { hangHoaMap[h.id] = h.don_vi_tinh ?? ''; });

  const chiTietPayload = data.chi_tiet ?? [];
  const newChiTiet: ChiTietRow[] = chiTietPayload.map((ct, idx) => ({
    id: `ct-${id}-${idx}-${Date.now()}`,
    id_phieu_kho: id,
    id_hang_hoa: ct.id_hang_hoa,
    so_luong: ct.so_luong,
    don_vi_tinh: hangHoaMap[ct.id_hang_hoa],
    ghi_chu: ct.ghi_chu?.trim() || undefined,
  }));
  dbChiTiet = [...dbChiTiet, ...newChiTiet];

  applyTonKhoForChiTiet(
    newChiTiet.map((c) => ({ id_hang_hoa: c.id_hang_hoa, so_luong: c.so_luong })),
    oldRow.loai,
    data.id_kho,
    id_kho_den
  );

  const [withKho] = await enrichKhoNames([row]);
  const [enriched] = await enrichDoiTacNames([withKho]);
  const enrichedCt = await enrichChiTietWithHangHoa(newChiTiet);
  return { ...enriched, chi_tiet: enrichedCt } as PhieuKho;
};

/** Lấy phiếu kho liên quan đến đối tác: NCC -> phiếu nhập, KH -> phiếu xuất. */
export async function getPhieuKhoByDoiTac(
  idDoiTac: string,
  loaiDoiTac: 'nha_cung_cap' | 'khach_hang'
): Promise<PhieuKho[]> {
  await delay(200);
  let list: PhieuKhoRow[];
  if (loaiDoiTac === 'nha_cung_cap') {
    list = db.filter((p) => p.loai === 'nhap' && (p as PhieuKhoRow).id_nha_cung_cap === idDoiTac);
  } else {
    list = db.filter((p) => p.loai === 'xuat' && (p as PhieuKhoRow).id_khach_hang === idDoiTac);
  }
  const withKho = await enrichKhoNames(list);
  const withDoiTac = await enrichDoiTacNames(withKho);
  return withDoiTac.sort((a, b) => (b.ngay as string).localeCompare(a.ngay) || a.so_phieu.localeCompare(b.so_phieu)) as PhieuKho[];
}

export const deletePhieuKho = async (id: string): Promise<void> => {
  await delay(400);
  const index = db.findIndex((p) => p.id === id);
  if (index === -1) throw new Error(i18n.t('phieuKho.service.notFound'));
  const row = db[index];
  const oldChiTiet = dbChiTiet.filter((c) => c.id_phieu_kho === id);
  revertTonKhoForChiTiet(
    oldChiTiet.map((c) => ({ id_hang_hoa: c.id_hang_hoa, so_luong: c.so_luong })),
    row.loai,
    row.id_kho,
    row.id_kho_den ?? null
  );
  dbChiTiet = dbChiTiet.filter((c) => c.id_phieu_kho !== id);
  db = db.filter((p) => p.id !== id);
};

export const deletePhieuKhoMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  for (const id of ids) {
    const index = db.findIndex((p) => p.id === id);
    if (index === -1) continue;
    const row = db[index];
    const oldChiTiet = dbChiTiet.filter((c) => c.id_phieu_kho === id);
    revertTonKhoForChiTiet(
      oldChiTiet.map((c) => ({ id_hang_hoa: c.id_hang_hoa, so_luong: c.so_luong })),
      row.loai,
      row.id_kho,
      row.id_kho_den ?? null
    );
  }
  dbChiTiet = dbChiTiet.filter((c) => !ids.includes(c.id_phieu_kho));
  db = db.filter((p) => !ids.includes(p.id));
};

/** Dòng lịch sử nhập/xuất/chuyển theo hàng hóa (dùng trong detail tồn theo sản phẩm). */
export interface LichSuNhapXuatRow {
  id_phieu_kho: string;
  id_chi_tiet: string;
  so_phieu: string;
  ngay: string;
  loai: LoaiPhieuKho;
  so_luong: number;
  don_vi_tinh?: string;
  ghi_chu?: string;
  ten_kho?: string;
  ten_kho_den?: string;
}

/** Lấy lịch sử nhập/xuất/chuyển liên quan đến một hàng hóa. */
export async function getLichSuNhapXuatByHangHoa(id_hang_hoa: string): Promise<LichSuNhapXuatRow[]> {
  await delay(200);
  const chiTietList = dbChiTiet.filter((c) => c.id_hang_hoa === id_hang_hoa);
  if (chiTietList.length === 0) return [];
  const phieuIds = [...new Set(chiTietList.map((c) => c.id_phieu_kho))];
  const phieuList = db.filter((p) => phieuIds.includes(p.id));
  const enrichedPhieu = await enrichKhoNames(phieuList);
  const phieuById = new Map(enrichedPhieu.map((p) => [p.id, p]));
  const rows: LichSuNhapXuatRow[] = chiTietList.map((ct) => {
    const p = phieuById.get(ct.id_phieu_kho);
    return {
      id_phieu_kho: ct.id_phieu_kho,
      id_chi_tiet: ct.id,
      so_phieu: p?.so_phieu ?? '',
      ngay: p?.ngay ?? '',
      loai: (p?.loai ?? 'nhap') as LoaiPhieuKho,
      so_luong: ct.so_luong,
      don_vi_tinh: ct.don_vi_tinh,
      ghi_chu: ct.ghi_chu,
      ten_kho: p?.ten_kho,
      ten_kho_den: p?.id_kho_den ? p?.ten_kho_den : undefined,
    };
  });
  return rows.sort((a, b) => (b.ngay as string).localeCompare(a.ngay) || a.so_phieu.localeCompare(b.so_phieu));
}

/** Dòng lịch sử nhập/xuất/chuyển theo kho (có thêm ma_hang, ten_hang). */
export interface LichSuNhapXuatByKhoRow extends LichSuNhapXuatRow {
  ma_hang?: string;
  ten_hang?: string;
}

/** Lấy lịch sử nhập/xuất/chuyển liên quan đến một kho (phiếu có id_kho hoặc id_kho_den = id_kho). */
export async function getLichSuNhapXuatByKho(id_kho: string): Promise<LichSuNhapXuatByKhoRow[]> {
  await delay(200);
  const phieuList = db.filter((p) => p.id_kho === id_kho || p.id_kho_den === id_kho);
  if (phieuList.length === 0) return [];
  const phieuIds = phieuList.map((p) => p.id);
  const chiTietList = dbChiTiet.filter((c) => phieuIds.includes(c.id_phieu_kho));
  if (chiTietList.length === 0) return [];
  const enrichedPhieu = await enrichKhoNames(phieuList);
  const enrichedCt = await enrichChiTietWithHangHoa(chiTietList);
  const phieuById = new Map(enrichedPhieu.map((p) => [p.id, p]));
  const rows: LichSuNhapXuatByKhoRow[] = enrichedCt.map((ct) => {
    const p = phieuById.get(ct.id_phieu_kho);
    return {
      id_phieu_kho: ct.id_phieu_kho,
      id_chi_tiet: ct.id,
      so_phieu: p?.so_phieu ?? '',
      ngay: p?.ngay ?? '',
      loai: (p?.loai ?? 'nhap') as LoaiPhieuKho,
      so_luong: ct.so_luong,
      don_vi_tinh: ct.don_vi_tinh,
      ghi_chu: ct.ghi_chu,
      ten_kho: p?.ten_kho,
      ten_kho_den: p?.id_kho_den ? p?.ten_kho_den : undefined,
      ma_hang: ct.ma_hang,
      ten_hang: ct.ten_hang,
    };
  });
  return rows.sort((a, b) => (b.ngay as string).localeCompare(a.ngay) || a.so_phieu.localeCompare(b.so_phieu));
}

/** Tập hợp toàn bộ dòng chi tiết hàng hóa của mọi phiếu nhập, xuất, chuyển kho (dùng cho tab Chi tiết phiếu). */
export async function getChiTietPhieuKhoAll(): Promise<ChiTietPhieuKhoFlat[]> {
  await delay(400);
  const phieuList = [...db].sort((a, b) => (b.ngay as string).localeCompare(a.ngay) || a.so_phieu.localeCompare(b.so_phieu));
  const withKho = await enrichKhoNames(phieuList);
  const withDoiTac = await enrichDoiTacNames(withKho);
  const allChiTiet = dbChiTiet.slice();
  const enrichedCt = await enrichChiTietWithHangHoa(allChiTiet);
  const phieuById = new Map(withDoiTac.map((p) => [p.id, p]));
  const flat: ChiTietPhieuKhoFlat[] = [];
  for (const ct of enrichedCt) {
    const p = phieuById.get(ct.id_phieu_kho);
    if (!p) continue;
    const row = p as PhieuKhoRow;
    flat.push({
      id: ct.id,
      id_phieu_kho: p.id,
      so_phieu: p.so_phieu,
      ngay: p.ngay,
      loai: p.loai,
      id_kho: p.id_kho,
      ten_kho: p.ten_kho,
      id_kho_den: p.id_kho_den ?? undefined,
      ten_kho_den: p.ten_kho_den,
      id_nha_cung_cap: row.id_nha_cung_cap ?? undefined,
      ten_nha_cung_cap: row.ten_nha_cung_cap,
      id_khach_hang: row.id_khach_hang ?? undefined,
      ten_khach_hang: row.ten_khach_hang,
      trang_thai: p.trang_thai,
      id_hang_hoa: ct.id_hang_hoa,
      ma_hang: ct.ma_hang,
      ten_hang: ct.ten_hang,
      so_luong: ct.so_luong,
      don_vi_tinh: ct.don_vi_tinh,
      ghi_chu: ct.ghi_chu,
    });
  }
  flat.sort((a, b) => (b.ngay as string).localeCompare(a.ngay) || a.so_phieu.localeCompare(b.so_phieu) || (a.ma_hang ?? '').localeCompare(b.ma_hang ?? ''));
  return flat;
}
