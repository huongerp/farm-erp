import type { DeXuatChiPhi, DeXuatChiPhiChiTiet } from '../core/types';
import type { DeXuatChiPhiFormValues } from '../core/schema';
import { MOCK_DE_XUAT_CHI_PHI } from '../../../../mocks/tai-chinh';
import { MOCK_TAI_KHOAN } from '../../../../mocks/tai-chinh';
import { MOCK_DANH_MUC_TAI_CHINH } from '../../../../mocks/tai-chinh';
import { getEmployees } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import i18n from '../../../../lib/i18n';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const ts = () => new Date().toISOString();

let db: DeXuatChiPhi[] = JSON.parse(JSON.stringify(MOCK_DE_XUAT_CHI_PHI));

function getTenDanhMuc(id: string): string {
  return MOCK_DANH_MUC_TAI_CHINH.find((d) => d.id === id)?.ten_danh_muc ?? id;
}

function getTenTaiKhoan(id: string | null): string | null {
  if (!id) return null;
  return MOCK_TAI_KHOAN.find((t) => t.id === id)?.ten_tai_khoan ?? null;
}

async function getTenNguoiDeXuat(id: string): Promise<string> {
  try {
    const employees = await getEmployees();
    const emp = employees.find((e) => e.id === id);
    return emp?.ho_ten ?? id;
  } catch {
    return id;
  }
}

export const getAllDeXuatChiPhi = async (): Promise<DeXuatChiPhi[]> => {
  await delay(400);
  return [...db];
};

export const getDeXuatChiPhiById = async (id: string): Promise<DeXuatChiPhi | null> => {
  await delay(200);
  const item = db.find((d) => d.id === id) ?? null;
  return item ? { ...item } : null;
};

export const createDeXuatChiPhi = async (
  data: DeXuatChiPhiFormValues
): Promise<DeXuatChiPhi> => {
  await delay(500);
  const id = `dxcp-${Date.now()}`;
  const chiTietValid = (data.chi_tiet ?? []).filter((r) => r.id_danh_muc && Number(r.so_tien) > 0);
  const chi_tiet: DeXuatChiPhiChiTiet[] = chiTietValid.map((r, i) => ({
    id: `${id}-${i + 1}`,
    id_de_xuat_chi_phi: id,
    id_danh_muc: r.id_danh_muc,
    ten_danh_muc: getTenDanhMuc(r.id_danh_muc),
    so_tien: Number(r.so_tien),
    noi_dung: r.noi_dung ?? undefined,
  }));
  const ten_nguoi_de_xuat = await getTenNguoiDeXuat(data.id_nguoi_de_xuat);
  const newItem: DeXuatChiPhi = {
    id,
    so_phieu: data.so_phieu.trim(),
    ngay: data.ngay,
    loai: data.loai,
    id_tai_khoan: data.id_tai_khoan && data.id_tai_khoan.trim() ? data.id_tai_khoan : null,
    ten_tai_khoan: data.id_tai_khoan ? getTenTaiKhoan(data.id_tai_khoan) : null,
    id_nguoi_de_xuat: data.id_nguoi_de_xuat,
    ten_nguoi_de_xuat,
    trang_thai: data.trang_thai as 0 | 1 | 2,
    ghi_chu: data.ghi_chu ?? null,
    tg_tao: ts(),
    tg_cap_nhat: ts(),
    chi_tiet,
  };
  db = [...db, newItem];
  return newItem;
};

export const updateDeXuatChiPhi = async (
  id: string,
  data: DeXuatChiPhiFormValues
): Promise<DeXuatChiPhi> => {
  await delay(500);
  const index = db.findIndex((d) => d.id === id);
  if (index === -1) throw new Error(i18n.t('deXuatChiPhi.service.notFound'));
  const existing = db[index];
  const chiTietValid = (data.chi_tiet ?? []).filter((r) => r.id_danh_muc && Number(r.so_tien) > 0);
  const chi_tiet: DeXuatChiPhiChiTiet[] = chiTietValid.map((r, i) => ({
    id: `${id}-${i + 1}`,
    id_de_xuat_chi_phi: id,
    id_danh_muc: r.id_danh_muc,
    ten_danh_muc: getTenDanhMuc(r.id_danh_muc),
    so_tien: Number(r.so_tien),
    noi_dung: r.noi_dung ?? undefined,
  }));
  const ten_nguoi_de_xuat = await getTenNguoiDeXuat(data.id_nguoi_de_xuat);
  const updated: DeXuatChiPhi = {
    ...existing,
    so_phieu: data.so_phieu.trim(),
    ngay: data.ngay,
    loai: data.loai,
    id_tai_khoan: data.id_tai_khoan && data.id_tai_khoan.trim() ? data.id_tai_khoan : null,
    ten_tai_khoan: data.id_tai_khoan ? getTenTaiKhoan(data.id_tai_khoan) : null,
    id_nguoi_de_xuat: data.id_nguoi_de_xuat,
    ten_nguoi_de_xuat,
    trang_thai: data.trang_thai as 0 | 1 | 2,
    ghi_chu: data.ghi_chu ?? null,
    tg_cap_nhat: ts(),
    chi_tiet,
  };
  db[index] = updated;
  return updated;
};

export const deleteDeXuatChiPhi = async (id: string): Promise<void> => {
  await delay(400);
  const idx = db.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error(i18n.t('deXuatChiPhi.service.notFound'));
  db = db.filter((d) => d.id !== id);
};

export const deleteDeXuatChiPhiMany = async (ids: string[]): Promise<void> => {
  await delay(500);
  db = db.filter((d) => !ids.includes(d.id));
};

export interface ApproveRejectPayload {
  id_nguoi_duyet: string;
  ten_nguoi_duyet?: string;
  ghi_chu_duyet?: string;
  ly_do_tu_choi?: string;
}

export const approveDeXuatChiPhi = async (
  id: string,
  payload: ApproveRejectPayload
): Promise<DeXuatChiPhi> => {
  await delay(400);
  const index = db.findIndex((d) => d.id === id);
  if (index === -1) throw new Error(i18n.t('deXuatChiPhi.service.notFound'));
  const item = db[index];
  if (item.trang_thai !== 0) throw new Error(i18n.t('deXuatChiPhi.service.notPending'));
  const updated: DeXuatChiPhi = {
    ...item,
    trang_thai: 1,
    id_nguoi_duyet: payload.id_nguoi_duyet,
    ten_nguoi_duyet: payload.ten_nguoi_duyet ?? null,
    ngay_duyet: ts(),
    ghi_chu_duyet: payload.ghi_chu_duyet ?? null,
    ly_do_tu_choi: null,
    tg_cap_nhat: ts(),
  };
  db[index] = updated;
  return updated;
};

export const rejectDeXuatChiPhi = async (
  id: string,
  payload: ApproveRejectPayload
): Promise<DeXuatChiPhi> => {
  await delay(400);
  const index = db.findIndex((d) => d.id === id);
  if (index === -1) throw new Error(i18n.t('deXuatChiPhi.service.notFound'));
  const item = db[index];
  if (item.trang_thai !== 0) throw new Error(i18n.t('deXuatChiPhi.service.notPending'));
  const updated: DeXuatChiPhi = {
    ...item,
    trang_thai: 2,
    id_nguoi_duyet: payload.id_nguoi_duyet,
    ten_nguoi_duyet: payload.ten_nguoi_duyet ?? null,
    ngay_duyet: ts(),
    ghi_chu_duyet: payload.ghi_chu_duyet ?? null,
    ly_do_tu_choi: payload.ly_do_tu_choi ?? null,
    tg_cap_nhat: ts(),
  };
  db[index] = updated;
  return updated;
};
