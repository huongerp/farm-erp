import { TrangThaiUngVien } from '../core/types';
import { TrangThaiUngVienFormValues } from '../core/schema';
import { MOCK_TRANG_THAI_UNG_VIEN } from '@/mocks/nhan-su';
import i18n from '../../../../lib/i18n';

let db: TrangThaiUngVien[] = JSON.parse(JSON.stringify(MOCK_TRANG_THAI_UNG_VIEN));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getTrangThaiUngViens = async (): Promise<TrangThaiUngVien[]> => {
  await delay(600);
  return [...db];
};

export const createTrangThaiUngVien = async (
  data: TrangThaiUngVienFormValues
): Promise<TrangThaiUngVien> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: TrangThaiUngVien = {
    id: `ttuv-${Date.now()}`,
    ...data,
    loai_ket_qua: data.loai_ket_qua === '' || data.loai_ket_qua == null ? undefined : data.loai_ket_qua,
    trang_thai: data.trang_thai as 0 | 1,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  db = [newItem, ...db];
  return newItem;
};

export const updateTrangThaiUngVien = async (
  id: string,
  data: TrangThaiUngVienFormValues
): Promise<TrangThaiUngVien> => {
  await delay(800);
  const index = db.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thietLapTuyenDung.trangThaiUngVien.service.notFound'));
  const updated: TrangThaiUngVien = {
    ...db[index],
    ...data,
    loai_ket_qua: data.loai_ket_qua === '' || data.loai_ket_qua == null ? undefined : data.loai_ket_qua,
    trang_thai: data.trang_thai as 0 | 1,
    tg_cap_nhat: new Date().toISOString(),
  };
  db[index] = updated;
  return updated;
};

export const updateTrangThaiUngVienStatus = async (
  ids: string[],
  status: 0 | 1
): Promise<void> => {
  await delay(600);
  db = db.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deleteTrangThaiUngViens = async (ids: string[]): Promise<void> => {
  await delay(600);
  db = db.filter((i) => !ids.includes(i.id));
};
