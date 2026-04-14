import type { DangKyThamGia, TienDoBaiHoc, KetQuaBaiTest } from '../core/types';
import type { DangKyTuDangKyFormValues, GiaoKhoaFormValues } from '../core/schema';
import { NGUONG_DAT_TEST_PERCENT } from '../core/constants';
import { MOCK_DANG_KY_THAM_GIA, MOCK_TIEN_DO_BAI_HOC, MOCK_KET_QUA_BAI_TEST } from '../mocks';
import { getKhoaDaoTaos } from '@/features/nhan-su/khoa-dao-tao/services/khoa-dao-tao-service';
import {
  getChuongByKhoaHoc,
  getBaiHocByChuong,
  getBaiTestByChuong,
  getCauHoiByBaiTest,
} from '@/features/nhan-su/khoa-dao-tao/thiet-lap/services/thiet-lap-khoa-service';
import type { KhoaDaoTao } from '@/features/nhan-su/khoa-dao-tao/core/types';
import type { ChuongKhoaHoc, BaiHoc, BaiTest, CauHoi } from '@/features/nhan-su/khoa-dao-tao/thiet-lap/core/types';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { MOCK_KHOA_DAO_TAO } from '@/mocks/nhan-su';
import i18n from '../../../../lib/i18n';

function getFallbackNhanVienMap(): Map<string, string> {
  const m = new Map<string, string>();
  m.set('emp-000', 'Lê Minh Công');
  m.set('emp-1', 'Nhân viên 1');
  m.set('emp-2', 'Nhân viên 2');
  m.set('emp-002', 'Nhân viên 2');
  return m;
}

/** Fallback: enrich list chỉ từ mock khóa + nhanVienMap (không gọi API). Dùng khi getKhoaDaoTaos/enrichDangKy lỗi. */
function minimalEnrichDangKy(
  items: DangKyThamGia[],
  nhanVienMap: Map<string, string>
): DangKyThamGia[] {
  const khoaById = new Map(MOCK_KHOA_DAO_TAO.map((k) => [k.id, k]));
  return items.map((dk) => {
    const khoa = khoaById.get(dk.id_khoa_hoc);
    return {
      ...dk,
      ten_khoa_hoc: khoa?.ten,
      ma_khoa_hoc: khoa?.ma,
      ten_nhan_vien: nhanVienMap.get(dk.id_nhan_vien),
      id_loai_khoa_hoc: khoa?.id_loai_khoa_hoc,
      so_chuong_da_pass: 0,
      so_chuong_tong: 0,
      so_bai_da_xem: 0,
      so_bai_tong: 0,
    };
  });
}

let dbDangKy: DangKyThamGia[] = JSON.parse(JSON.stringify(MOCK_DANG_KY_THAM_GIA)) as DangKyThamGia[];
let dbTienDo: TienDoBaiHoc[] = JSON.parse(JSON.stringify(MOCK_TIEN_DO_BAI_HOC));
let dbKetQua: KetQuaBaiTest[] = JSON.parse(JSON.stringify(MOCK_KET_QUA_BAI_TEST));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const LIST_FETCH_TIMEOUT_MS = 15000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

/** Đáp án nộp: câu trắc nghiệm = index đáp án chọn (0-based), tự luận = text (chấm sau) */
export interface DapAnNop {
  [idCauHoi: string]: number | string;
}

async function enrichDangKy(
  items: DangKyThamGia[],
  khoaMap: Map<string, KhoaDaoTao>,
  nhanVienMap: Map<string, string>,
  tienDoByDangKy: Map<string, TienDoBaiHoc[]>,
  ketQuaByDangKy: Map<string, KetQuaBaiTest[]>
): Promise<DangKyThamGia[]> {
  const chuongByKhoa: Map<string, ChuongKhoaHoc[]> = {};
  const baiHocByChuong: Map<string, BaiHoc[]> = {};
  const baiTestByChuong: Map<string, BaiTest[]> = {};

  for (const dk of items) {
    if (!chuongByKhoa.has(dk.id_khoa_hoc)) {
      chuongByKhoa.set(dk.id_khoa_hoc, await getChuongByKhoaHoc(dk.id_khoa_hoc));
    }
  }
  for (const [, chuongs] of chuongByKhoa) {
    for (const ch of chuongs) {
      if (!baiHocByChuong.has(ch.id)) {
        baiHocByChuong.set(ch.id, await getBaiHocByChuong(ch.id));
      }
      if (!baiTestByChuong.has(ch.id)) {
        baiTestByChuong.set(ch.id, await getBaiTestByChuong(ch.id));
      }
    }
  }

  return items.map((dk) => {
    const khoa = khoaMap.get(dk.id_khoa_hoc);
    const chuongs = chuongByKhoa.get(dk.id_khoa_hoc) ?? [];
    const tienDo = tienDoByDangKy.get(dk.id) ?? [];
    const ketQua = ketQuaByDangKy.get(dk.id) ?? [];
    let so_bai_tong = 0;
    let so_bai_da_xem = 0;
    const passedTestIds = new Set(ketQua.filter((k) => k.dat).map((k) => k.id_bai_test));
    let so_chuong_da_pass = 0;
    for (const ch of chuongs) {
      const baiHocs = baiHocByChuong.get(ch.id) ?? [];
      const tests = baiTestByChuong.get(ch.id) ?? [];
      so_bai_tong += baiHocs.length;
      for (const bh of baiHocs) {
        if (tienDo.some((t) => t.id_bai_hoc === bh.id && t.da_xem)) so_bai_da_xem++;
      }
      const testId = tests[0]?.id;
      if (testId && passedTestIds.has(testId)) so_chuong_da_pass++;
    }
    return {
      ...dk,
      ten_khoa_hoc: khoa?.ten,
      ma_khoa_hoc: khoa?.ma,
      ten_nhan_vien: nhanVienMap.get(dk.id_nhan_vien),
      id_loai_khoa_hoc: khoa?.id_loai_khoa_hoc,
      so_chuong_da_pass,
      so_chuong_tong: chuongs.length,
      so_bai_da_xem,
      so_bai_tong,
    };
  });
}

// ---------- Đăng ký ----------
export const getDangKyList = async (params?: {
  id_nhan_vien?: string;
  id_khoa_hoc?: string;
  trang_thai?: number;
}): Promise<DangKyThamGia[]> => {
  try {
    return await withTimeout(doGetDangKyList(params), LIST_FETCH_TIMEOUT_MS, 'getDangKyList');
  } catch (e) {
    console.warn('[dang-ky-dao-tao] getDangKyList failed, returning minimal mock data', e);
    let list = [...dbDangKy];
    if (params?.id_nhan_vien) list = list.filter((d) => d.id_nhan_vien === params.id_nhan_vien);
    if (params?.id_khoa_hoc) list = list.filter((d) => d.id_khoa_hoc === params.id_khoa_hoc);
    if (params?.trang_thai !== undefined) list = list.filter((d) => d.trang_thai === params.trang_thai);
    return minimalEnrichDangKy(list, getFallbackNhanVienMap());
  }
};

async function doGetDangKyList(params?: {
  id_nhan_vien?: string;
  id_khoa_hoc?: string;
  trang_thai?: number;
}): Promise<DangKyThamGia[]> {
  await delay(300);
  let list = [...dbDangKy];
  if (params?.id_nhan_vien) list = list.filter((d) => d.id_nhan_vien === params.id_nhan_vien);
  if (params?.id_khoa_hoc) list = list.filter((d) => d.id_khoa_hoc === params.id_khoa_hoc);
  if (params?.trang_thai !== undefined) list = list.filter((d) => d.trang_thai === params.trang_thai);

  let nhanVienMap: Map<string, string>;
  try {
    const employees = await getEmployeesRef();
    nhanVienMap = new Map(employees.map((e) => [e.id, e.ho_ten ?? e.email ?? e.id]));
  } catch {
    nhanVienMap = getFallbackNhanVienMap();
  }

  try {
    const khoaList = await getKhoaDaoTaos();
    const khoaMap = new Map(khoaList.map((k) => [k.id, k]));
    const tienDoByDangKy = new Map<string, TienDoBaiHoc[]>();
    for (const td of dbTienDo) {
      const arr = tienDoByDangKy.get(td.id_dang_ky) ?? [];
      arr.push(td);
      tienDoByDangKy.set(td.id_dang_ky, arr);
    }
    const ketQuaByDangKy = new Map<string, KetQuaBaiTest[]>();
    for (const kq of dbKetQua) {
      const arr = ketQuaByDangKy.get(kq.id_dang_ky) ?? [];
      arr.push(kq);
      ketQuaByDangKy.set(kq.id_dang_ky, arr);
    }
    return await enrichDangKy(list, khoaMap, nhanVienMap, tienDoByDangKy, ketQuaByDangKy);
  } catch (e) {
    console.warn('[dang-ky-dao-tao] enrich failed, using minimal mock data', e);
    return minimalEnrichDangKy(list, nhanVienMap);
  }
}

export const getDangKyById = async (id: string): Promise<DangKyThamGia | null> => {
  await delay(200);
  const list = await getDangKyList({});
  return list.find((d) => d.id === id) ?? null;
};

export const createDangKyTuDangKy = async (
  data: DangKyTuDangKyFormValues,
  id_nhan_vien: string
): Promise<DangKyThamGia> => {
  await delay(400);
  const existing = dbDangKy.find(
    (d) => d.id_khoa_hoc === data.id_khoa_hoc && d.id_nhan_vien === id_nhan_vien && d.trang_thai !== 4
  );
  if (existing) throw new Error(i18n.t('dangKyDaoTao.service.alreadyRegistered'));
  const now = new Date().toISOString();
  const newItem: DangKyThamGia = {
    id: `dk-${Date.now()}`,
    id_khoa_hoc: data.id_khoa_hoc,
    id_nhan_vien,
    loai_dang_ky: 'tu_dang_ky',
    id_nguoi_giao: null,
    trang_thai: 1,
    tg_dang_ky: now,
    tg_cap_nhat: now,
  };
  dbDangKy = [newItem, ...dbDangKy];
  const list = await getDangKyList({});
  return list.find((d) => d.id === newItem.id)!;
};

export const createDangKyGiao = async (
  data: GiaoKhoaFormValues,
  id_nguoi_giao: string
): Promise<DangKyThamGia> => {
  await delay(400);
  const existing = dbDangKy.find(
    (d) =>
      d.id_khoa_hoc === data.id_khoa_hoc &&
      d.id_nhan_vien === data.id_nhan_vien &&
      d.trang_thai !== 4
  );
  if (existing) throw new Error(i18n.t('dangKyDaoTao.service.alreadyAssigned'));
  const now = new Date().toISOString();
  const newItem: DangKyThamGia = {
    id: `dk-${Date.now()}`,
    id_khoa_hoc: data.id_khoa_hoc,
    id_nhan_vien: data.id_nhan_vien,
    loai_dang_ky: 'duoc_giao',
    id_nguoi_giao,
    trang_thai: 1,
    tg_dang_ky: now,
    tg_cap_nhat: now,
  };
  dbDangKy = [newItem, ...dbDangKy];
  const list = await getDangKyList({});
  return list.find((d) => d.id === newItem.id)!;
};

export const updateDangKyTrangThai = async (
  id: string,
  trang_thai: DangKyThamGia['trang_thai']
): Promise<DangKyThamGia> => {
  await delay(300);
  const idx = dbDangKy.findIndex((d) => d.id === id);
  if (idx === -1) throw new Error(i18n.t('dangKyDaoTao.service.notFound'));
  const now = new Date().toISOString();
  dbDangKy[idx] = { ...dbDangKy[idx], trang_thai, tg_cap_nhat: now };
  const list = await getDangKyList({});
  return list.find((d) => d.id === id)!;
};

export const deleteDangKy = async (id: string): Promise<void> => {
  await delay(300);
  dbDangKy = dbDangKy.filter((d) => d.id !== id);
  dbTienDo = dbTienDo.filter((t) => t.id_dang_ky !== id);
  dbKetQua = dbKetQua.filter((k) => k.id_dang_ky !== id);
};

// ---------- Tiến độ ----------
export const getTienDoByDangKy = async (id_dang_ky: string): Promise<TienDoBaiHoc[]> => {
  await delay(200);
  return dbTienDo.filter((t) => t.id_dang_ky === id_dang_ky);
};

export const markBaiHocDaXem = async (
  id_dang_ky: string,
  id_bai_hoc: string
): Promise<TienDoBaiHoc> => {
  await delay(300);
  const existing = dbTienDo.find(
    (t) => t.id_dang_ky === id_dang_ky && t.id_bai_hoc === id_bai_hoc
  );
  const now = new Date().toISOString();
  if (existing) {
    existing.da_xem = true;
    existing.tg_xem_xong = now;
    return existing;
  }
  const newItem: TienDoBaiHoc = {
    id: `td-${Date.now()}`,
    id_dang_ky,
    id_bai_hoc,
    da_xem: true,
    tg_xem_xong: now,
  };
  dbTienDo = [...dbTienDo, newItem];
  return newItem;
};

// ---------- Kết quả test ----------
export const getKetQuaByDangKy = async (id_dang_ky: string): Promise<KetQuaBaiTest[]> => {
  await delay(200);
  return dbKetQua.filter((k) => k.id_dang_ky === id_dang_ky);
};

export const submitBaiTest = async (
  id_dang_ky: string,
  id_bai_test: string,
  dapAn: DapAnNop
): Promise<KetQuaBaiTest> => {
  await delay(400);
  const cauHoiList = await getCauHoiByBaiTest(id_bai_test);
  let totalTracNghiem = 0;
  let correctTracNghiem = 0;
  for (const cq of cauHoiList) {
    if (cq.loai === 'trac_nghiem' && cq.dap_an_options?.length) {
      totalTracNghiem++;
      const userVal = dapAn[cq.id];
      const selectedIndex = typeof userVal === 'number' ? userVal : -1;
      const correctIndex = cq.dap_an_options.findIndex((o) => o.dung === true);
      if (selectedIndex === correctIndex && correctIndex >= 0) correctTracNghiem++;
    }
  }
  const percent =
    totalTracNghiem > 0 ? Math.round((correctTracNghiem / totalTracNghiem) * 100) : 0;
  const dat = percent >= NGUONG_DAT_TEST_PERCENT;
  const now = new Date().toISOString();
  const existingIdx = dbKetQua.findIndex(
    (k) => k.id_dang_ky === id_dang_ky && k.id_bai_test === id_bai_test
  );
  const newResult: KetQuaBaiTest = {
    id: existingIdx >= 0 ? dbKetQua[existingIdx].id : `kq-${Date.now()}`,
    id_dang_ky,
    id_bai_test,
    diem: percent,
    dat,
    tg_lam: now,
  };
  if (existingIdx >= 0) {
    dbKetQua[existingIdx] = newResult;
  } else {
    dbKetQua = [...dbKetQua, newResult];
  }
  return newResult;
};

// ---------- Khóa mở đăng ký (theo quyền chức vụ) ----------
export const getKhoaMoDangKy = async (
  id_chuc_vu_user: string[] | undefined
): Promise<KhoaDaoTao[]> => {
  const all = await getKhoaDaoTaos();
  return all.filter((k) => {
    if (k.trang_thai !== 1) return false;
    const allowed = k.id_chuc_vu_xem ?? [];
    if (allowed.length === 0) return true;
    return id_chuc_vu_user?.some((cv) => allowed.includes(cv)) ?? true;
  });
};

// ---------- Logic mở khóa ----------
export async function canAccessLesson(
  id_dang_ky: string,
  id_bai_hoc: string
): Promise<boolean> {
  const tienDo = await getTienDoByDangKy(id_dang_ky);
  const dangKy = await getDangKyById(id_dang_ky);
  if (!dangKy) return false;
  const chuongs = await getChuongByKhoaHoc(dangKy.id_khoa_hoc);
  let foundInChapter: ChuongKhoaHoc | null = null;
  let lessonIndex = -1;
  for (const ch of chuongs) {
    const baiHocs = await getBaiHocByChuong(ch.id);
    const idx = baiHocs.findIndex((b) => b.id === id_bai_hoc);
    if (idx >= 0) {
      foundInChapter = ch;
      lessonIndex = idx;
      break;
    }
  }
  if (!foundInChapter || lessonIndex < 0) return false;
  if (lessonIndex === 0) return true;
  const baiHocs = await getBaiHocByChuong(foundInChapter.id);
  const prevBai = baiHocs[lessonIndex - 1];
  return tienDo.some((t) => t.id_bai_hoc === prevBai?.id && t.da_xem);
}

export async function canAccessChapter(
  id_dang_ky: string,
  id_chuong: string
): Promise<boolean> {
  const dangKy = await getDangKyById(id_dang_ky);
  if (!dangKy) return false;
  const chuongs = await getChuongByKhoaHoc(dangKy.id_khoa_hoc);
  const chapterIndex = chuongs.findIndex((c) => c.id === id_chuong);
  if (chapterIndex <= 0) return true;
  const prevCh = chuongs[chapterIndex - 1];
  const tests = await getBaiTestByChuong(prevCh.id);
  const testId = tests[0]?.id;
  if (!testId) return true;
  const ketQua = await getKetQuaByDangKy(id_dang_ky);
  return ketQua.some((k) => k.id_bai_test === testId && k.dat);
}

/** Đồng bộ: tính quyền truy cập từ dữ liệu đã load (dùng trong UI). */
export function computeAccessFromData(
  chuongs: { id: string }[],
  baiHocsByChuong: Map<string, { id: string }[]>,
  baiTestsByChuong: Map<string, { id: string }[]>,
  tienDo: TienDoBaiHoc[],
  ketQua: KetQuaBaiTest[]
): {
  canAccessLesson: (idBaiHoc: string) => boolean;
  canAccessChapter: (idChuong: string) => boolean;
  canAccessTest: (idBaiTest: string) => boolean;
  isLessonViewed: (idBaiHoc: string) => boolean;
  isTestPassed: (idBaiTest: string) => boolean;
} {
  const viewed = new Set(tienDo.filter((t) => t.da_xem).map((t) => t.id_bai_hoc));
  const passed = new Set(ketQua.filter((k) => k.dat).map((k) => k.id_bai_test));

  const canAccessChapter = (idChuong: string): boolean => {
    const idx = chuongs.findIndex((c) => c.id === idChuong);
    if (idx <= 0) return true;
    const prevCh = chuongs[idx - 1];
    const tests = baiTestsByChuong.get(prevCh.id) ?? [];
    const testId = tests[0]?.id;
    return !testId || passed.has(testId);
  };

  const canAccessLesson = (idBaiHoc: string): boolean => {
    for (const ch of chuongs) {
      const baiHocs = baiHocsByChuong.get(ch.id) ?? [];
      const i = baiHocs.findIndex((b) => b.id === idBaiHoc);
      if (i < 0) continue;
      if (!canAccessChapter(ch.id)) return false;
      if (i === 0) return true;
      const prev = baiHocs[i - 1];
      return viewed.has(prev.id);
    }
    return false;
  };

  const canAccessTest = (idBaiTest: string): boolean => {
    for (const ch of chuongs) {
      const tests = baiTestsByChuong.get(ch.id) ?? [];
      if (!tests.some((t) => t.id === idBaiTest)) continue;
      if (!canAccessChapter(ch.id)) return false;
      const baiHocs = baiHocsByChuong.get(ch.id) ?? [];
      return baiHocs.every((b) => viewed.has(b.id));
    }
    return false;
  };

  return {
    canAccessLesson,
    canAccessChapter,
    canAccessTest,
    isLessonViewed: (id) => viewed.has(id),
    isTestPassed: (id) => passed.has(id),
  };
}

export async function canAccessTest(
  id_dang_ky: string,
  id_bai_test: string
): Promise<boolean> {
  const dangKy = await getDangKyById(id_dang_ky);
  if (!dangKy) return false;
  const chuongs = await getChuongByKhoaHoc(dangKy.id_khoa_hoc);
  let id_chuong = '';
  for (const ch of chuongs) {
    const tests = await getBaiTestByChuong(ch.id);
    if (tests.some((t) => t.id === id_bai_test)) {
      id_chuong = ch.id;
      break;
    }
  }
  if (!id_chuong) return false;
  const baiHocs = await getBaiHocByChuong(id_chuong);
  const tienDo = await getTienDoByDangKy(id_dang_ky);
  for (const bh of baiHocs) {
    if (!tienDo.some((t) => t.id_bai_hoc === bh.id && t.da_xem)) return false;
  }
  return true;
}
