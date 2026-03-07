import { AssetGroup } from '../core/types';
import { AssetGroupFormValues } from '../core/schema';
import { MOCK_ASSET_GROUPS } from '@/mocks/hanh-chinh';
import i18n from '../../../../lib/i18n';

let dbNhomTaiSan: AssetGroup[] = JSON.parse(JSON.stringify(MOCK_ASSET_GROUPS));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getAssetGroups = async (): Promise<AssetGroup[]> => {
  await delay(600);
  return [...dbNhomTaiSan];
};

export const createAssetGroup = async (
  data: AssetGroupFormValues
): Promise<AssetGroup> => {
  await delay(800);
  const now = new Date().toISOString();
  const newItem: AssetGroup = {
    id: `nhom-ts-${Date.now()}`,
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    phuong_phap_khau_hao: data.phuong_phap_khau_hao,
    ty_le_khau_hao: data.ty_le_khau_hao ?? null,
    so_nam_su_dung: data.so_nam_su_dung ?? null,
    tg_tao: now,
    tg_cap_nhat: now,
  };
  dbNhomTaiSan = [newItem, ...dbNhomTaiSan];
  return newItem;
};

export const updateAssetGroup = async (
  id: string,
  data: AssetGroupFormValues
): Promise<AssetGroup> => {
  await delay(800);
  const index = dbNhomTaiSan.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(i18n.t('thietLapTaiSan.nhomTaiSan.service.notFound'));
  const updated: AssetGroup = {
    ...dbNhomTaiSan[index],
    ...data,
    trang_thai: data.trang_thai as 0 | 1,
    phuong_phap_khau_hao: data.phuong_phap_khau_hao,
    ty_le_khau_hao: data.ty_le_khau_hao ?? null,
    so_nam_su_dung: data.so_nam_su_dung ?? null,
    tg_cap_nhat: new Date().toISOString(),
  };
  dbNhomTaiSan[index] = updated;
  return updated;
};

export const updateAssetGroupStatus = async (
  ids: string[],
  status: 0 | 1
): Promise<void> => {
  await delay(600);
  dbNhomTaiSan = dbNhomTaiSan.map((i) =>
    ids.includes(i.id) ? { ...i, trang_thai: status, tg_cap_nhat: new Date().toISOString() } : i
  );
};

export const deleteAssetGroups = async (ids: string[]): Promise<void> => {
  await delay(600);
  dbNhomTaiSan = dbNhomTaiSan.filter((i) => !ids.includes(i.id));
};
