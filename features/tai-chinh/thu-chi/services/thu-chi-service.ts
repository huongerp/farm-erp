import type { ThuChi } from '../../core/types';
import type { ThuChiFormValues } from '../core/schema';
import { MOCK_THU_CHI } from '../../../../mocks/tai-chinh';
import { MOCK_TAI_KHOAN, MOCK_DANH_MUC_TAI_CHINH } from '../../../../mocks/tai-chinh';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

let db: ThuChi[] = JSON.parse(JSON.stringify(MOCK_THU_CHI));

function getTenTaiKhoan(id: string): string {
  return MOCK_TAI_KHOAN.find((t) => t.id === id)?.ten_tai_khoan ?? id;
}

function getTenDanhMuc(id: string): string {
  return MOCK_DANH_MUC_TAI_CHINH.find((d) => d.id === id)?.ten_danh_muc ?? id;
}

async function getTenNhanVien(id: string): Promise<string> {
  try {
    const employees = await getEmployeesRef();
    const emp = employees.find((e) => e.id === id);
    return emp?.ho_ten ?? id;
  } catch {
    return id;
  }
}

function nextMaGiaoDich(): string {
  const year = new Date().getFullYear();
  const prefix = `TC-${year}-`;
  const nums = db
    .filter((g) => g.ma_giao_dich.startsWith(prefix))
    .map((g) => parseInt(g.ma_giao_dich.slice(prefix.length), 10) || 0);
  const max = Math.max(0, ...nums);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export const getAllThuChi = async (): Promise<ThuChi[]> => {
  await delay(300);
  return [...db].sort((a, b) => new Date(b.ngay_giao_dich).getTime() - new Date(a.ngay_giao_dich).getTime());
};

export const getThuChiById = async (id: string): Promise<ThuChi | null> => {
  await delay(200);
  const item = db.find((d) => d.id === id) ?? null;
  return item ? { ...item } : null;
};

export const createThuChi = async (data: ThuChiFormValues): Promise<ThuChi> => {
  await delay(400);
  const id = `gd-${Date.now()}`;
  const ten_tai_khoan = getTenTaiKhoan(data.id_tai_khoan);
  const ten_danh_muc = data.id_danh_muc ? getTenDanhMuc(data.id_danh_muc) : undefined;
  const ten_nhan_vien = data.id_nhan_vien_thuc_hien ? await getTenNhanVien(data.id_nhan_vien_thuc_hien) : undefined;
  const ten_tai_khoan_dich = data.id_tai_khoan_dich ? getTenTaiKhoan(data.id_tai_khoan_dich) : undefined;

  const ngayIso = data.ngay_giao_dich.includes('T') ? new Date(data.ngay_giao_dich).toISOString() : data.ngay_giao_dich + 'T00:00:00.000Z';
  const newItem: ThuChi = {
    id,
    ma_giao_dich: data.ma_giao_dich.trim(),
    ngay_giao_dich: ngayIso,
    so_tien: data.so_tien,
    loai: data.loai as ThuChi['loai'],
    id_tai_khoan: data.id_tai_khoan,
    ten_tai_khoan,
    id_danh_muc: data.id_danh_muc || undefined,
    ten_danh_muc,
    noi_dung: data.noi_dung.trim(),
    id_nhan_vien_thuc_hien: data.id_nhan_vien_thuc_hien || undefined,
    ten_nhan_vien,
    trang_thai: data.trang_thai,
    id_tai_khoan_dich: data.id_tai_khoan_dich || undefined,
    ten_tai_khoan_dich,
    phi_giao_dich: data.phi_giao_dich,
    id_de_xuat_chi_phi: data.id_de_xuat_chi_phi || undefined,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
  };
  db = [...db, newItem];
  return newItem;
};

export const updateThuChi = async (id: string, data: ThuChiFormValues): Promise<ThuChi> => {
  await delay(400);
  const index = db.findIndex((d) => d.id === id);
  if (index === -1) throw new Error(i18n.t('thuChi.service.notFound'));
  const ten_tai_khoan = getTenTaiKhoan(data.id_tai_khoan);
  const ten_danh_muc = data.id_danh_muc ? getTenDanhMuc(data.id_danh_muc) : undefined;
  const ten_nhan_vien = data.id_nhan_vien_thuc_hien ? await getTenNhanVien(data.id_nhan_vien_thuc_hien) : undefined;
  const ten_tai_khoan_dich = data.id_tai_khoan_dich ? getTenTaiKhoan(data.id_tai_khoan_dich) : undefined;

  const ngayIso = data.ngay_giao_dich.includes('T') ? new Date(data.ngay_giao_dich).toISOString() : data.ngay_giao_dich + 'T00:00:00.000Z';
  const updated: ThuChi = {
    ...db[index],
    ma_giao_dich: data.ma_giao_dich.trim(),
    ngay_giao_dich: ngayIso,
    so_tien: data.so_tien,
    loai: data.loai as ThuChi['loai'],
    id_tai_khoan: data.id_tai_khoan,
    ten_tai_khoan,
    id_danh_muc: data.id_danh_muc || undefined,
    ten_danh_muc,
    noi_dung: data.noi_dung.trim(),
    id_nhan_vien_thuc_hien: data.id_nhan_vien_thuc_hien || undefined,
    ten_nhan_vien,
    trang_thai: data.trang_thai,
    id_tai_khoan_dich: data.id_tai_khoan_dich || undefined,
    ten_tai_khoan_dich,
    phi_giao_dich: data.phi_giao_dich,
    id_de_xuat_chi_phi: data.id_de_xuat_chi_phi || undefined,
    tg_cap_nhat: ts(),
  };
  db[index] = updated;
  return updated;
};

export const deleteThuChi = async (id: string): Promise<void> => {
  await delay(300);
  const idx = db.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error(i18n.t('thuChi.service.notFound'));
  db = db.filter((d) => d.id !== id);
};

export const deleteThuChiMany = async (ids: string[]): Promise<void> => {
  await delay(400);
  db = db.filter((d) => !ids.includes(d.id));
};

/** Thống kê theo loại trong khoảng ngày. */
export interface ThuChiStatsByLoai {
  loai: 'thu' | 'chi' | 'chuyen_quy';
  so_giao_dich: number;
  tong_tien: number;
}

export const getThuChiStatsByLoai = async (
  tuNgay: string,
  denNgay: string
): Promise<ThuChiStatsByLoai[]> => {
  await delay(200);
  const tu = tuNgay ? new Date(tuNgay).getTime() : 0;
  const den = denNgay ? new Date(denNgay).getTime() + 86400000 : Number.MAX_SAFE_INTEGER;
  const list = db.filter((g) => {
    const t = new Date(g.ngay_giao_dich).getTime();
    return t >= tu && t <= den && g.trang_thai === 'hoan_thanh';
  });
  const byLoai = new Map<string, { count: number; sum: number }>();
  for (const g of list) {
    const key = g.loai;
    const cur = byLoai.get(key) ?? { count: 0, sum: 0 };
    byLoai.set(key, { count: cur.count + 1, sum: cur.sum + g.so_tien });
  }
  return ['thu', 'chi', 'chuyen_quy'].map((loai) => {
    const v = byLoai.get(loai) ?? { count: 0, sum: 0 };
    return { loai: loai as ThuChiStatsByLoai['loai'], so_giao_dich: v.count, tong_tien: v.sum };
  });
};

/** Thống kê theo tài khoản (thu + chi hoàn thành). */
export interface ThuChiStatsByTaiKhoan {
  id_tai_khoan: string;
  ten_tai_khoan: string;
  tong_thu: number;
  tong_chi: number;
  so_giao_dich: number;
}

export const getThuChiStatsByTaiKhoan = async (
  tuNgay: string,
  denNgay: string
): Promise<ThuChiStatsByTaiKhoan[]> => {
  await delay(200);
  const tu = tuNgay ? new Date(tuNgay).getTime() : 0;
  const den = denNgay ? new Date(denNgay).getTime() + 86400000 : Number.MAX_SAFE_INTEGER;
  const list = db.filter((g) => {
    const t = new Date(g.ngay_giao_dich).getTime();
    return t >= tu && t <= den && g.trang_thai === 'hoan_thanh' && g.loai !== 'chuyen_quy';
  });
  const byTk = new Map<string, { thu: number; chi: number; count: number }>();
  for (const g of list) {
    const cur = byTk.get(g.id_tai_khoan) ?? { thu: 0, chi: 0, count: 0 };
    if (g.loai === 'thu') cur.thu += g.so_tien;
    else cur.chi += g.so_tien;
    cur.count += 1;
    byTk.set(g.id_tai_khoan, cur);
  }
  return Array.from(byTk.entries()).map(([id_tai_khoan, v]) => ({
    id_tai_khoan,
    ten_tai_khoan: getTenTaiKhoan(id_tai_khoan),
    tong_thu: v.thu,
    tong_chi: v.chi,
    so_giao_dich: v.count,
  }));
};

/** Thống kê theo danh mục (thu + chi). */
export interface ThuChiStatsByDanhMuc {
  id_danh_muc: string;
  ten_danh_muc: string;
  loai: 'thu' | 'chi';
  so_giao_dich: number;
  tong_tien: number;
}

export const getThuChiStatsByDanhMuc = async (
  tuNgay: string,
  denNgay: string
): Promise<ThuChiStatsByDanhMuc[]> => {
  await delay(200);
  const tu = tuNgay ? new Date(tuNgay).getTime() : 0;
  const den = denNgay ? new Date(denNgay).getTime() + 86400000 : Number.MAX_SAFE_INTEGER;
  const list = db.filter((g) => {
    const t = new Date(g.ngay_giao_dich).getTime();
    return t >= tu && t <= den && g.trang_thai === 'hoan_thanh' && g.loai !== 'chuyen_quy' && g.id_danh_muc;
  });
  const byDm = new Map<string, { loai: 'thu' | 'chi'; count: number; sum: number }>();
  for (const g of list) {
    const key = `${g.id_danh_muc!}_${g.loai}`;
    const cur = byDm.get(key) ?? { loai: g.loai as 'thu' | 'chi', count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += g.so_tien;
    byDm.set(key, cur);
  }
  return Array.from(byDm.entries()).map(([key, v]) => {
    const [id_danh_muc] = key.split('_');
    return {
      id_danh_muc,
      ten_danh_muc: getTenDanhMuc(id_danh_muc),
      loai: v.loai,
      so_giao_dich: v.count,
      tong_tien: v.sum,
    };
  });
};
