import type { ChuongKhoaHoc, BaiHoc, BaiTest, CauHoi } from '../core/types';
import type { ChuongFormValues, BaiHocFormValues, BaiTestFormValues, CauHoiFormValues } from '../core/schema';
import { MOCK_CHUONG_KHOA_HOC, MOCK_BAI_HOC, MOCK_BAI_TEST, MOCK_CAU_HOI } from '../mocks';
import i18n from '../../../../../lib/i18n';

let dbChuong: ChuongKhoaHoc[] = JSON.parse(JSON.stringify(MOCK_CHUONG_KHOA_HOC));
let dbBaiHoc: BaiHoc[] = JSON.parse(JSON.stringify(MOCK_BAI_HOC));
let dbBaiTest: BaiTest[] = JSON.parse(JSON.stringify(MOCK_BAI_TEST));
let dbCauHoi: CauHoi[] = JSON.parse(JSON.stringify(MOCK_CAU_HOI));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Thống kê số chương, bài học, bài test theo từng khóa học (dùng cho list/detail khóa đào tạo). */
export const getThongKeTheoKhoaHoc = async (): Promise<
  Record<string, { so_chuong: number; so_bai_hoc: number; so_bai_test: number }>
> => {
  await delay(100);
  const result: Record<string, { so_chuong: number; so_bai_hoc: number; so_bai_test: number }> = {};
  const khoaIds = [...new Set(dbChuong.map((c) => c.id_khoa_hoc))];
  for (const idKhoa of khoaIds) {
    const chuongs = dbChuong.filter((c) => c.id_khoa_hoc === idKhoa);
    let so_bai_hoc = 0;
    let so_bai_test = 0;
    for (const ch of chuongs) {
      so_bai_hoc += dbBaiHoc.filter((b) => b.id_chuong === ch.id).length;
      so_bai_test += dbBaiTest.filter((t) => t.id_chuong === ch.id).length;
    }
    result[idKhoa] = { so_chuong: chuongs.length, so_bai_hoc, so_bai_test };
  }
  return result;
};

// ---------- Chương ----------
export const getChuongByKhoaHoc = async (idKhoaHoc: string): Promise<ChuongKhoaHoc[]> => {
  await delay(300);
  return dbChuong.filter((c) => c.id_khoa_hoc === idKhoaHoc).sort((a, b) => a.thu_tu - b.thu_tu);
};

export const createChuong = async (idKhoaHoc: string, data: ChuongFormValues): Promise<ChuongKhoaHoc> => {
  await delay(400);
  const now = new Date().toISOString();
  const maxThuTu = dbChuong.filter((c) => c.id_khoa_hoc === idKhoaHoc).reduce((max, c) => Math.max(max, c.thu_tu), -1);
  const newItem: ChuongKhoaHoc = {
    id: `ch-${Date.now()}`,
    id_khoa_hoc: idKhoaHoc,
    ten: data.ten,
    mo_ta: data.mo_ta ?? null,
    thu_tu: maxThuTu + 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbChuong = [...dbChuong, newItem];
  return newItem;
};

export const updateChuong = async (id: string, data: Partial<ChuongFormValues>): Promise<ChuongKhoaHoc> => {
  await delay(300);
  const idx = dbChuong.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(i18n.t('thietLapKhoa.service.chuongNotFound'));
  const now = new Date().toISOString();
  dbChuong[idx] = { ...dbChuong[idx], ...data, tg_cap_nhat: now };
  return dbChuong[idx];
};

export const deleteChuong = async (id: string): Promise<void> => {
  await delay(300);
  const testIdsToRemove = dbBaiTest.filter((t) => t.id_chuong === id).map((t) => t.id);
  dbChuong = dbChuong.filter((c) => c.id !== id);
  dbBaiHoc = dbBaiHoc.filter((b) => b.id_chuong !== id);
  dbBaiTest = dbBaiTest.filter((t) => t.id_chuong !== id);
  dbCauHoi = dbCauHoi.filter((q) => !testIdsToRemove.includes(q.id_bai_test));
};

export const reorderChuong = async (idKhoaHoc: string, orderedIds: string[]): Promise<void> => {
  await delay(300);
  orderedIds.forEach((id, i) => {
    const idx = dbChuong.findIndex((c) => c.id === id && c.id_khoa_hoc === idKhoaHoc);
    if (idx !== -1) dbChuong[idx] = { ...dbChuong[idx], thu_tu: i };
  });
};

// ---------- Bài học ----------
export const getBaiHocByChuong = async (idChuong: string): Promise<BaiHoc[]> => {
  await delay(300);
  return dbBaiHoc.filter((b) => b.id_chuong === idChuong).sort((a, b) => a.thu_tu - b.thu_tu);
};

export const createBaiHoc = async (idChuong: string, data: BaiHocFormValues): Promise<BaiHoc> => {
  await delay(400);
  const now = new Date().toISOString();
  const maxThuTu = dbBaiHoc.filter((b) => b.id_chuong === idChuong).reduce((max, b) => Math.max(max, b.thu_tu), -1);
  const newItem: BaiHoc = {
    id: `bh-${Date.now()}`,
    id_chuong: idChuong,
    ten: data.ten,
    mo_ta: data.mo_ta ?? null,
    thu_tu: maxThuTu + 1,
    video_youtube_url: data.video_youtube_url?.trim() || null,
    tai_lieu_links: (data.tai_lieu_links ?? []).filter((l) => typeof l === 'string' && l.trim() !== ''),
    tai_lieu_files: data.tai_lieu_files ?? [],
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbBaiHoc = [...dbBaiHoc, newItem];
  return newItem;
};

export const updateBaiHoc = async (id: string, data: Partial<BaiHocFormValues>): Promise<BaiHoc> => {
  await delay(300);
  const idx = dbBaiHoc.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error(i18n.t('thietLapKhoa.service.baiHocNotFound'));
  const now = new Date().toISOString();
  const updated = { ...dbBaiHoc[idx] };
  if (data.ten != null) updated.ten = data.ten;
  if (data.mo_ta !== undefined) updated.mo_ta = data.mo_ta ?? null;
  if (data.video_youtube_url !== undefined) updated.video_youtube_url = data.video_youtube_url?.trim() || null;
  if (data.tai_lieu_links !== undefined) updated.tai_lieu_links = data.tai_lieu_links.filter((l) => typeof l === 'string' && l.trim() !== '');
  if (data.tai_lieu_files !== undefined) updated.tai_lieu_files = data.tai_lieu_files;
  updated.tg_cap_nhat = now;
  dbBaiHoc[idx] = updated;
  return updated;
};

export const deleteBaiHoc = async (id: string): Promise<void> => {
  await delay(300);
  dbBaiHoc = dbBaiHoc.filter((b) => b.id !== id);
};

export const reorderBaiHoc = async (idChuong: string, orderedIds: string[]): Promise<void> => {
  await delay(300);
  orderedIds.forEach((id, i) => {
    const idx = dbBaiHoc.findIndex((b) => b.id === id && b.id_chuong === idChuong);
    if (idx !== -1) dbBaiHoc[idx] = { ...dbBaiHoc[idx], thu_tu: i };
  });
};

// ---------- Bài test ----------
export const getBaiTestByChuong = async (idChuong: string): Promise<BaiTest[]> => {
  await delay(300);
  return dbBaiTest.filter((t) => t.id_chuong === idChuong).sort((a, b) => a.thu_tu - b.thu_tu);
};

export const createBaiTest = async (idChuong: string, data: BaiTestFormValues): Promise<BaiTest> => {
  await delay(400);
  const now = new Date().toISOString();
  const maxThuTu = dbBaiTest.filter((t) => t.id_chuong === idChuong).reduce((max, t) => Math.max(max, t.thu_tu), -1);
  const newItem: BaiTest = {
    id: `bt-${Date.now()}`,
    id_chuong: idChuong,
    ten: data.ten,
    mo_ta: data.mo_ta ?? null,
    thu_tu: maxThuTu + 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbBaiTest = [...dbBaiTest, newItem];
  return newItem;
};

export const updateBaiTest = async (id: string, data: Partial<BaiTestFormValues>): Promise<BaiTest> => {
  await delay(300);
  const idx = dbBaiTest.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(i18n.t('thietLapKhoa.service.baiTestNotFound'));
  const now = new Date().toISOString();
  dbBaiTest[idx] = { ...dbBaiTest[idx], ...data, tg_cap_nhat: now };
  return dbBaiTest[idx];
};

export const deleteBaiTest = async (id: string): Promise<void> => {
  await delay(300);
  dbBaiTest = dbBaiTest.filter((t) => t.id !== id);
  dbCauHoi = dbCauHoi.filter((q) => q.id_bai_test !== id);
};

export const reorderBaiTest = async (idChuong: string, orderedIds: string[]): Promise<void> => {
  await delay(300);
  orderedIds.forEach((id, i) => {
    const idx = dbBaiTest.findIndex((t) => t.id === id && t.id_chuong === idChuong);
    if (idx !== -1) dbBaiTest[idx] = { ...dbBaiTest[idx], thu_tu: i };
  });
};

// ---------- Câu hỏi ----------
export const getCauHoiByBaiTest = async (idBaiTest: string): Promise<CauHoi[]> => {
  await delay(300);
  return dbCauHoi.filter((q) => q.id_bai_test === idBaiTest).sort((a, b) => a.thu_tu - b.thu_tu);
};

export const createCauHoi = async (idBaiTest: string, data: CauHoiFormValues): Promise<CauHoi> => {
  await delay(400);
  const now = new Date().toISOString();
  const maxThuTu = dbCauHoi.filter((q) => q.id_bai_test === idBaiTest).reduce((max, q) => Math.max(max, q.thu_tu), -1);
  const newItem: CauHoi = {
    id: `cq-${Date.now()}`,
    id_bai_test: idBaiTest,
    noi_dung: data.noi_dung,
    loai: data.loai,
    thu_tu: maxThuTu + 1,
    dap_an_options: data.dap_an_options,
    goi_y_cham: data.goi_y_cham ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbCauHoi = [...dbCauHoi, newItem];
  return newItem;
};

export const updateCauHoi = async (id: string, data: Partial<CauHoiFormValues>): Promise<CauHoi> => {
  await delay(300);
  const idx = dbCauHoi.findIndex((q) => q.id === id);
  if (idx === -1) throw new Error(i18n.t('thietLapKhoa.service.cauHoiNotFound'));
  const now = new Date().toISOString();
  dbCauHoi[idx] = { ...dbCauHoi[idx], ...data, tg_cap_nhat: now };
  return dbCauHoi[idx];
};

export const deleteCauHoi = async (id: string): Promise<void> => {
  await delay(300);
  dbCauHoi = dbCauHoi.filter((q) => q.id !== id);
};

export const reorderCauHoi = async (idBaiTest: string, orderedIds: string[]): Promise<void> => {
  await delay(300);
  orderedIds.forEach((id, i) => {
    const idx = dbCauHoi.findIndex((q) => q.id === id && q.id_bai_test === idBaiTest);
    if (idx !== -1) dbCauHoi[idx] = { ...dbCauHoi[idx], thu_tu: i };
  });
};
