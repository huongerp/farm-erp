import { AssetStatus } from '../core/types';
import { AssetStatusFormValues } from '../core/schema';
import { MOCK_ASSET_STATUSES } from '@/mocks/hanh-chinh';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

function normalizeTrangThai(val: unknown): import('../../../../lib/constants').TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return Number(val) === 0 ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

let dbTrangThai: AssetStatus[] = JSON.parse(JSON.stringify(MOCK_ASSET_STATUSES)).map((i: AssetStatus) => ({
  ...i,
  trang_thai: normalizeTrangThai(i.trang_thai),
}));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAssetStatuses = async (): Promise<AssetStatus[]> => {
  await delay(600);
  return [...dbTrangThai];
};

export const createAssetStatus = async (
  data: AssetStatusFormValues
): Promise<AssetStatus> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: AssetStatus = {
    id: `trang-thai-${Date.now()}`,
    ...data,
    trang_thai: data.trang_thai,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbTrangThai = [newItem, ...dbTrangThai];
  return newItem;
};

export const updateAssetStatus = async (
  id: string,
  data: AssetStatusFormValues
): Promise<AssetStatus> => {
  await delay(800);
  const index = dbTrangThai.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thietLapTaiSan.trangThai.service.notFound'));
  const updated: AssetStatus = {
    ...dbTrangThai[index],
    ...data,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbTrangThai[index] = updated;
  return updated;
};

export const updateAssetStatusStatus = async (
  ids: string[],
  status: import('../../../../lib/constants').TrangThaiHoatDong
): Promise<void> => {
  await delay(600);
  dbTrangThai = dbTrangThai.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deleteAssetStatuses = async (ids: string[]): Promise<void> => {
  await delay(600);
  dbTrangThai = dbTrangThai.filter((i) => !ids.includes(i.id));
};
