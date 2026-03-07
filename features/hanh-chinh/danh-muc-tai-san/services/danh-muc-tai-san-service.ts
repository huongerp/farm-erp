import { TaiSan } from '../core/types';
import { TaiSanFormValues } from '../core/schema';
import { MOCK_TAI_SAN } from '@/mocks/hanh-chinh';
import { getAssetGroups } from '../../thiet-lap-tai-san/services/nhom-tai-san-service';
import { getAssetStorageLocations } from '../../thiet-lap-tai-san/services/noi-luu-service';
import { getAssetStatuses } from '../../thiet-lap-tai-san/services/trang-thai-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import i18n from '../../../../lib/i18n';

let dbTaiSan: TaiSan[] = JSON.parse(JSON.stringify(MOCK_TAI_SAN));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function enrichTaiSan(items: TaiSan[]): Promise<TaiSan[]> {
  const [groups, locations, statuses, employees] = await Promise.all([
    getAssetGroups(),
    getAssetStorageLocations(),
    getAssetStatuses(),
    getEmployees(),
  ]);
  const groupMap = new Map(groups.map((g) => [g.id, g.ten]));
  const locationMap = new Map(locations.map((l) => [l.id, l.ten_noi_luu]));
  const statusMap = new Map(statuses.map((s) => [s.id, s.ten]));
  const employeeMap = new Map(employees.map((e) => [e.id, { ten: e.ho_ten, ma: e.ma_nhan_vien }]));
  return items.map((item) => ({
    ...item,
    ten_nhom: item.ten_nhom ?? groupMap.get(item.id_nhom),
    ten_noi_luu: item.ten_noi_luu ?? locationMap.get(item.id_noi_luu),
    ten_trang_thai: item.ten_trang_thai ?? statusMap.get(item.id_trang_thai),
    ten_nhan_vien_dang_giu: item.id_nhan_vien_dang_giu
      ? (item.ten_nhan_vien_dang_giu ?? employeeMap.get(item.id_nhan_vien_dang_giu)?.ten)
      : null,
    ma_nhan_vien_dang_giu: item.id_nhan_vien_dang_giu
      ? (item.ma_nhan_vien_dang_giu ?? employeeMap.get(item.id_nhan_vien_dang_giu)?.ma)
      : null,
  }));
}

export const getTaiSanList = async (): Promise<TaiSan[]> => {
  await delay(600);
  return enrichTaiSan([...dbTaiSan]);
};

export const createTaiSan = async (data: TaiSanFormValues): Promise<TaiSan> => {
  await delay(800);
  const [groups, locations, statuses, employees] = await Promise.all([
    getAssetGroups(),
    getAssetStorageLocations(),
    getAssetStatuses(),
    getEmployees(),
  ]);
  const ten_nhom = groups.find((g) => g.id === data.id_nhom)?.ten;
  const ten_noi_luu = locations.find((l) => l.id === data.id_noi_luu)?.ten_noi_luu;
  const ten_trang_thai = statuses.find((s) => s.id === data.id_trang_thai)?.ten;
  let ten_nhan_vien_dang_giu: string | null = null;
  let ma_nhan_vien_dang_giu: string | null = null;
  if (data.id_nhan_vien_dang_giu) {
    const emp = employees.find((e) => e.id === data.id_nhan_vien_dang_giu);
    ten_nhan_vien_dang_giu = emp?.ho_ten ?? null;
    ma_nhan_vien_dang_giu = emp?.ma_nhan_vien ?? null;
  }
  const now = new Date().toISOString();
  const ngayBatDauTrich = data.ngay_bat_dau_trich_khau_hao?.trim() || data.ngay_nhap;
  const nguyenGia = data.nguyen_gia ?? null;
  const newItem: TaiSan = {
    id: `ts-${Date.now()}`,
    ma_tai_san: data.ma_tai_san.trim(),
    ten_tai_san: data.ten_tai_san.trim(),
    id_nhom: data.id_nhom,
    ten_nhom,
    id_noi_luu: data.id_noi_luu,
    ten_noi_luu,
    id_trang_thai: data.id_trang_thai,
    ten_trang_thai,
    id_nhan_vien_dang_giu: data.id_nhan_vien_dang_giu || null,
    ten_nhan_vien_dang_giu,
    ma_nhan_vien_dang_giu,
    ngay_nhap: data.ngay_nhap,
    nguyen_gia: nguyenGia,
    ngay_bat_dau_trich_khau_hao: ngayBatDauTrich,
    gia_tri_con_lai: nguyenGia,
    khau_hao_luy_ke: 0,
    hinh_anh: data.hinh_anh?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbTaiSan = [newItem, ...dbTaiSan];
  return newItem;
};

export const updateTaiSan = async (id: string, data: TaiSanFormValues): Promise<TaiSan> => {
  await delay(800);
  const index = dbTaiSan.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  const [groups, locations, statuses, employees] = await Promise.all([
    getAssetGroups(),
    getAssetStorageLocations(),
    getAssetStatuses(),
    getEmployees(),
  ]);
  const ten_nhom = groups.find((g) => g.id === data.id_nhom)?.ten;
  const ten_noi_luu = locations.find((l) => l.id === data.id_noi_luu)?.ten_noi_luu;
  const ten_trang_thai = statuses.find((s) => s.id === data.id_trang_thai)?.ten;
  let ten_nhan_vien_dang_giu: string | null = null;
  let ma_nhan_vien_dang_giu: string | null = null;
  if (data.id_nhan_vien_dang_giu) {
    const emp = employees.find((e) => e.id === data.id_nhan_vien_dang_giu);
    ten_nhan_vien_dang_giu = emp?.ho_ten ?? null;
    ma_nhan_vien_dang_giu = emp?.ma_nhan_vien ?? null;
  }
  const ngayBatDauTrich = data.ngay_bat_dau_trich_khau_hao?.trim() || data.ngay_nhap;
  const updated: TaiSan = {
    ...dbTaiSan[index],
    ma_tai_san: data.ma_tai_san.trim(),
    ten_tai_san: data.ten_tai_san.trim(),
    id_nhom: data.id_nhom,
    ten_nhom,
    id_noi_luu: data.id_noi_luu,
    ten_noi_luu,
    id_trang_thai: data.id_trang_thai,
    ten_trang_thai,
    id_nhan_vien_dang_giu: data.id_nhan_vien_dang_giu || null,
    ten_nhan_vien_dang_giu,
    ma_nhan_vien_dang_giu,
    ngay_nhap: data.ngay_nhap,
    nguyen_gia: data.nguyen_gia ?? null,
    ngay_bat_dau_trich_khau_hao: ngayBatDauTrich,
    hinh_anh: data.hinh_anh?.trim() || null,
    ghi_chu: data.ghi_chu?.trim() || null,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbTaiSan[index] = updated;
  return updated;
};

/** Cập nhật giá trị còn lại và khấu hao lũy kế (chỉ gọi từ module Khấu hao khi chốt kỳ) */
export const updateTaiSanKhauHao = async (
  id: string,
  payload: { gia_tri_con_lai: number | null; khau_hao_luy_ke: number }
): Promise<TaiSan> => {
  await delay(400);
  const index = dbTaiSan.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  const updated: TaiSan = {
    ...dbTaiSan[index],
    gia_tri_con_lai: payload.gia_tri_con_lai,
    khau_hao_luy_ke: payload.khau_hao_luy_ke,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbTaiSan[index] = updated;
  return updated;
};

/** Cập nhật chỉ nơi lưu và/hoặc người đang giữ (dùng khi thực hiện phiếu cấp phát/thu hồi/luân chuyển) */
export const updateTaiSanLocationAndHolder = async (
  id: string,
  payload: { id_noi_luu?: string; id_nhan_vien_dang_giu?: string | null }
): Promise<TaiSan> => {
  await delay(400);
  const index = dbTaiSan.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  const [locations, employees] = await Promise.all([
    getAssetStorageLocations(),
    getEmployees(),
  ]);
  const ten_noi_luu = payload.id_noi_luu != null
    ? locations.find((l) => l.id === payload.id_noi_luu)?.ten_noi_luu
    : undefined;
  let ten_nhan_vien_dang_giu: string | null | undefined = undefined;
  let ma_nhan_vien_dang_giu: string | null | undefined = undefined;
  if (payload.id_nhan_vien_dang_giu !== undefined) {
    if (payload.id_nhan_vien_dang_giu) {
      const emp = employees.find((e) => e.id === payload.id_nhan_vien_dang_giu);
      ten_nhan_vien_dang_giu = emp?.ho_ten ?? null;
      ma_nhan_vien_dang_giu = emp?.ma_nhan_vien ?? null;
    } else {
      ten_nhan_vien_dang_giu = null;
      ma_nhan_vien_dang_giu = null;
    }
  }
  const now = new Date().toISOString();
  const updated: TaiSan = {
    ...dbTaiSan[index],
    ...(payload.id_noi_luu != null && { id_noi_luu: payload.id_noi_luu, ten_noi_luu: ten_noi_luu ?? dbTaiSan[index].ten_noi_luu }),
    ...(payload.id_nhan_vien_dang_giu !== undefined && {
      id_nhan_vien_dang_giu: payload.id_nhan_vien_dang_giu || null,
      ten_nhan_vien_dang_giu: ten_nhan_vien_dang_giu ?? null,
      ma_nhan_vien_dang_giu: ma_nhan_vien_dang_giu ?? null,
    }),
    tg_cap_nhat: now,
  };
  dbTaiSan[index] = updated;
  return updated;
};

/** Cập nhật sổ theo kết quả kiểm kê: đồng bộ nơi lưu, người giữ, trạng thái từ thực tế kiểm. */
export const updateTaiSanFromKiemKe = async (
  id: string,
  payload: { id_noi_luu?: string | null; id_nhan_vien_dang_giu?: string | null; id_trang_thai?: string | null }
): Promise<TaiSan> => {
  await delay(400);
  const index = dbTaiSan.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('danhSachTaiSan.service.notFound'));
  const [locations, employees, statuses] = await Promise.all([
    getAssetStorageLocations(),
    getEmployees(),
    getAssetStatuses(),
  ]);
  const ten_noi_luu = payload.id_noi_luu != null
    ? (payload.id_noi_luu ? locations.find((l) => l.id === payload.id_noi_luu)?.ten_noi_luu ?? null : null)
    : undefined;
  let ten_nhan_vien_dang_giu: string | null | undefined = undefined;
  let ma_nhan_vien_dang_giu: string | null | undefined = undefined;
  if (payload.id_nhan_vien_dang_giu !== undefined) {
    if (payload.id_nhan_vien_dang_giu) {
      const emp = employees.find((e) => e.id === payload.id_nhan_vien_dang_giu);
      ten_nhan_vien_dang_giu = emp?.ho_ten ?? null;
      ma_nhan_vien_dang_giu = emp?.ma_nhan_vien ?? null;
    } else {
      ten_nhan_vien_dang_giu = null;
      ma_nhan_vien_dang_giu = null;
    }
  }
  const ten_trang_thai = payload.id_trang_thai != null
    ? (payload.id_trang_thai ? statuses.find((s) => s.id === payload.id_trang_thai)?.ten ?? null : null)
    : undefined;
  const now = new Date().toISOString();
  const updated: TaiSan = {
    ...dbTaiSan[index],
    ...(payload.id_noi_luu !== undefined && { id_noi_luu: payload.id_noi_luu || dbTaiSan[index].id_noi_luu, ten_noi_luu: ten_noi_luu ?? dbTaiSan[index].ten_noi_luu }),
    ...(payload.id_nhan_vien_dang_giu !== undefined && {
      id_nhan_vien_dang_giu: payload.id_nhan_vien_dang_giu || null,
      ten_nhan_vien_dang_giu: ten_nhan_vien_dang_giu ?? null,
      ma_nhan_vien_dang_giu: ma_nhan_vien_dang_giu ?? null,
    }),
    ...(payload.id_trang_thai !== undefined && { id_trang_thai: payload.id_trang_thai || dbTaiSan[index].id_trang_thai, ten_trang_thai: ten_trang_thai ?? dbTaiSan[index].ten_trang_thai }),
    tg_cap_nhat: now,
  };
  dbTaiSan[index] = updated;
  return updated;
};

export const updateTaiSanStatus = async (ids: string[], status: 0 | 1): Promise<void> => {
  await delay(600);
  dbTaiSan = dbTaiSan.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deleteTaiSan = async (ids: string[]): Promise<void> => {
  await delay(600);
  dbTaiSan = dbTaiSan.filter((i) => !ids.includes(i.id));
};
