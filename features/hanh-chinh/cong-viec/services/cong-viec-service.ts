import type { CongViec } from '../core/types';
import type { CongViecFormValues } from '../core/schema';
import type { BaoCaoKetQua, BinhLuanCongViec } from '../core/types';
import i18n from '../../../../lib/i18n';
import {
  MOCK_CONG_VIEC,
  MOCK_BAO_CAO_KET_QUA,
  MOCK_BINH_LUAN_CONG_VIEC,
} from '../../../../mocks/cong-viec';

const STORAGE_KEY = 'cong_viec_list';
const BAO_CAO_KEY = 'bao_cao_ket_qua_list';
const BINH_LUAN_KEY = 'binh_luan_cong_viec_list';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function seedCongViecIfNeeded(): void {
  if (localStorage.getItem(STORAGE_KEY)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(JSON.parse(JSON.stringify(MOCK_CONG_VIEC))));
  localStorage.setItem(BAO_CAO_KEY, JSON.stringify(JSON.parse(JSON.stringify(MOCK_BAO_CAO_KET_QUA))));
  localStorage.setItem(BINH_LUAN_KEY, JSON.stringify(JSON.parse(JSON.stringify(MOCK_BINH_LUAN_CONG_VIEC))));
}

function loadCongViec(): CongViec[] {
  try {
    seedCongViecIfNeeded();
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: CongViec[] = raw ? JSON.parse(raw) : [];
    const existingIds = new Set(list.map((i) => i.id));
    const toMerge = MOCK_CONG_VIEC.filter((m) => !existingIds.has(m.id));
    if (toMerge.length > 0) {
      list = [...toMerge, ...list];
      saveCongViec(list);
    }
    return list;
  } catch {
    // ignore
  }
  return [];
}

function saveCongViec(list: CongViec[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function loadBaoCao(): BaoCaoKetQua[] {
  try {
    seedCongViecIfNeeded();
    const raw = localStorage.getItem(BAO_CAO_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveBaoCao(list: BaoCaoKetQua[]) {
  localStorage.setItem(BAO_CAO_KEY, JSON.stringify(list));
}

function loadBinhLuan(): BinhLuanCongViec[] {
  try {
    seedCongViecIfNeeded();
    const raw = localStorage.getItem(BINH_LUAN_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

function saveBinhLuan(list: BinhLuanCongViec[]) {
  localStorage.setItem(BINH_LUAN_KEY, JSON.stringify(list));
}

export const getCongViecList = async (): Promise<CongViec[]> => {
  await delay(500);
  return loadCongViec();
};

export const getCongViecById = async (id: string): Promise<CongViec | null> => {
  await delay(200);
  const list = loadCongViec();
  return list.find((i) => i.id === id) ?? null;
};

export const createCongViec = async (
  data: CongViecFormValues,
  id_nguoi_giao: string,
  ten_nguoi_giao?: string,
  ten_du_an?: string | null
): Promise<CongViec> => {
  await delay(600);
  const list = loadCongViec();
  const now = new Date().toISOString();
  const newItem: CongViec = {
    id: `cv-${Date.now()}`,
    ma_cong_viec: data.ma_cong_viec,
    tieu_de: data.tieu_de,
    mo_ta: data.mo_ta ?? '',
    id_du_an: data.id_du_an || null,
    ten_du_an: ten_du_an ?? null,
    id_cha: data.id_cha || null,
    id_nguoi_giao,
    ten_nguoi_giao: ten_nguoi_giao ?? undefined,
    danh_sach_nguoi_thuc_hien: data.danh_sach_nguoi_thuc_hien ?? [],
    ten_nguoi_thuc_hien: [],
    uu_tien: data.uu_tien as CongViec['uu_tien'],
    trang_thai: data.trang_thai as CongViec['trang_thai'],
    ngay_het_han: data.ngay_het_han,
    phan_tram_hoan_thanh: data.phan_tram_hoan_thanh ?? 0,
    id_mau_cong_viec: data.id_mau_cong_viec || null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  list.unshift(newItem);
  saveCongViec(list);
  return newItem;
};

export const updateCongViec = async (
  id: string,
  data: Partial<CongViecFormValues> & { phan_tram_hoan_thanh?: number },
  ten_du_an?: string | null
): Promise<CongViec> => {
  await delay(600);
  const list = loadCongViec();
  const index = list.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('congViec.service.notFound'));
  const updated: CongViec = {
    ...list[index],
    ...data,
    ten_du_an: ten_du_an ?? list[index].ten_du_an,
    tg_cap_nhat: new Date().toISOString(),
  };
  list[index] = updated;
  saveCongViec(list);
  return updated;
};

export const deleteCongViecList = async (ids: string[]): Promise<void> => {
  await delay(400);
  const list = loadCongViec().filter((i) => !ids.includes(i.id));
  saveCongViec(list);
  const baoCao = loadBaoCao().filter((b) => !ids.includes(b.id_cong_viec));
  saveBaoCao(baoCao);
  const binhLuan = loadBinhLuan().filter((b) => !ids.includes(b.id_cong_viec));
  saveBinhLuan(binhLuan);
};

export const getBaoCaoByCongViecId = async (id_cong_viec: string): Promise<BaoCaoKetQua[]> => {
  await delay(300);
  return loadBaoCao().filter((b) => b.id_cong_viec === id_cong_viec).reverse();
};

export const createBaoCaoKetQua = async (
  id_cong_viec: string,
  data: { noi_dung: string; links?: string[]; file_dinh_kem?: string },
  nguoi_bao_cao_id: string,
  ten_nguoi_bao_cao?: string
): Promise<BaoCaoKetQua> => {
  await delay(400);
  const list = loadBaoCao();
  const now = new Date().toISOString();
  const newItem: BaoCaoKetQua = {
    id: `bc-${Date.now()}`,
    id_cong_viec,
    noi_dung: data.noi_dung,
    links: data.links ?? [],
    file_dinh_kem: data.file_dinh_kem ?? '',
    nguoi_bao_cao_id,
    ten_nguoi_bao_cao: ten_nguoi_bao_cao ?? undefined,
    tg_bao_cao: now,
  };
  list.push(newItem);
  saveBaoCao(list);
  return newItem;
};

export const getBinhLuanByCongViecId = async (id_cong_viec: string): Promise<BinhLuanCongViec[]> => {
  await delay(300);
  return loadBinhLuan().filter((b) => b.id_cong_viec === id_cong_viec).reverse();
};

export const createBinhLuan = async (
  id_cong_viec: string,
  noi_dung: string,
  nguoi_gui_id: string,
  ten_nguoi_gui?: string
): Promise<BinhLuanCongViec> => {
  await delay(300);
  const list = loadBinhLuan();
  const now = new Date().toISOString();
  const newItem: BinhLuanCongViec = {
    id: `bl-${Date.now()}`,
    id_cong_viec,
    noi_dung,
    nguoi_gui_id,
    ten_nguoi_gui: ten_nguoi_gui ?? undefined,
    tg_gui: now,
  };
  list.push(newItem);
  saveBinhLuan(list);
  return newItem;
};

/** Import nhiều công việc từ Excel. id_nguoi_giao/ten_nguoi_giao là người tạo (thường = user đăng nhập). */
export const importCongViecList = async (
  rows: Array<{
    ma_cong_viec: string;
    tieu_de: string;
    id_du_an?: string;
    ten_du_an?: string;
    ngay_het_han: string;
    uu_tien: string;
    trang_thai: string;
    phan_tram_hoan_thanh?: number;
    mo_ta?: string;
    danh_sach_nguoi_thuc_hien?: string;
  }>,
  id_nguoi_giao: string,
  ten_nguoi_giao?: string
): Promise<{ created: number; errors: string[] }> => {
  await delay(500);
  const errors: string[] = [];
  let created = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];
      const ma = String(row.ma_cong_viec ?? '').trim();
      const ten = String(row.tieu_de ?? '').trim();
      if (!ma || !ten) {
        errors.push(`Dòng ${i + 2}: Thiếu mã hoặc tiêu đề công việc`);
        continue;
      }
      const ngayHetHan = String(row.ngay_het_han ?? '').trim();
      if (!ngayHetHan) {
        errors.push(`Dòng ${i + 2}: Thiếu ngày hết hạn`);
        continue;
      }
      const uuTien = (['cao', 'trung_binh', 'thap'].includes(row.uu_tien) ? row.uu_tien : 'trung_binh') as CongViec['uu_tien'];
      const trangThai = (['draft', 'dang_thuc_hien', 'cho_bao_cao', 'hoan_thanh', 'huy'].includes(row.trang_thai) ? row.trang_thai : 'draft') as CongViec['trang_thai'];
      const idDuAn = row.id_du_an != null && String(row.id_du_an).trim() !== '' ? String(row.id_du_an).trim() : null;
      const nguoiThucHienStr = row.danh_sach_nguoi_thuc_hien != null ? String(row.danh_sach_nguoi_thuc_hien).trim() : '';
      const danhSachNguoiThucHien = nguoiThucHienStr ? nguoiThucHienStr.split(/[,;]/).map((s) => s.trim()).filter(Boolean) : [];
      const data: CongViecFormValues = {
        ma_cong_viec: ma,
        tieu_de: ten,
        mo_ta: row.mo_ta != null ? String(row.mo_ta).trim() : undefined,
        id_du_an: idDuAn,
        id_cha: null,
        danh_sach_nguoi_thuc_hien: danhSachNguoiThucHien,
        uu_tien: uuTien,
        trang_thai: trangThai,
        ngay_het_han: ngayHetHan,
        phan_tram_hoan_thanh: Number(row.phan_tram_hoan_thanh) || 0,
        id_mau_cong_viec: null,
      };
      await createCongViec(data, id_nguoi_giao, ten_nguoi_giao, row.ten_du_an?.trim() || null);
      created++;
    } catch (e: unknown) {
      errors.push(`Dòng ${i + 2}: ${(e as Error).message || 'Lỗi'}`);
    }
  }
  return { created, errors };
};

/** Flatten tree by parent: root first, then children at level 2, etc. */
export function flattenCongViecWithLevel(
  items: CongViec[],
  parentId: string | null = null,
  level = 1
): { item: CongViec; level: number }[] {
  const result: { item: CongViec; level: number }[] = [];
  const children = items.filter((i) => (i.id_cha ?? null) === parentId);
  for (const item of children) {
    result.push({ item, level });
    result.push(...flattenCongViecWithLevel(items, item.id, level + 1));
  }
  return result;
}
