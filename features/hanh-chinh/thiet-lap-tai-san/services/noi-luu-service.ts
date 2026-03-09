import { AssetStorageLocation } from '../core/types';
import { AssetStorageLocationFormValues } from '../core/schema';
import { MOCK_ASSET_STORAGE_LOCATIONS } from '@/mocks/hanh-chinh';
import { getBranches } from '../../../he-thong/chi-nhanh/services/chi-nhanh-service';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

function normalizeTrangThai(val: unknown): import('../../../../lib/constants').TrangThaiHoatDong {
  if (val === TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG;
  if (val === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG) return TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
  return Number(val) === 0 ? TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
}

let dbNoiLuu: AssetStorageLocation[] = JSON.parse(JSON.stringify(MOCK_ASSET_STORAGE_LOCATIONS)).map((i: AssetStorageLocation) => ({
  ...i,
  trang_thai: normalizeTrangThai(i.trang_thai),
}));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAssetStorageLocations = async (): Promise<AssetStorageLocation[]> => {
  await delay(600);
  return [...dbNoiLuu];
};

export const createAssetStorageLocation = async (
  data: AssetStorageLocationFormValues
): Promise<AssetStorageLocation> => {
  await delay(800);
  const branches = await getBranches();
  const branchName = branches.find((b) => b.id === data.id_chi_nhanh)?.ten_chi_nhanh;
  const now = new Date().toISOString();
  const newItem: AssetStorageLocation = {
    id: `noi-luu-${Date.now()}`,
    ...data,
    ten_chi_nhanh: branchName,
    trang_thai: data.trang_thai,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbNoiLuu = [newItem, ...dbNoiLuu];
  return newItem;
};

export const updateAssetStorageLocation = async (
  id: string,
  data: AssetStorageLocationFormValues
): Promise<AssetStorageLocation> => {
  await delay(800);
  const index = dbNoiLuu.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thietLapTaiSan.noiLuu.service.notFound'));
  const branches = await getBranches();
  const branchName = branches.find((b) => b.id === data.id_chi_nhanh)?.ten_chi_nhanh;
  const updated: AssetStorageLocation = {
    ...dbNoiLuu[index],
    ...data,
    ten_chi_nhanh: branchName,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbNoiLuu[index] = updated;
  return updated;
};

export const updateAssetStorageLocationStatus = async (
  ids: string[],
  status: import('../../../../lib/constants').TrangThaiHoatDong
): Promise<void> => {
  await delay(600);
  dbNoiLuu = dbNoiLuu.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deleteAssetStorageLocations = async (ids: string[]): Promise<void> => {
  await delay(600);
  dbNoiLuu = dbNoiLuu.filter((i) => !ids.includes(i.id));
};
