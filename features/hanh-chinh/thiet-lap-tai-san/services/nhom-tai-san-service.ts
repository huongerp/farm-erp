import type { AssetGroup } from '../core/types';
import type { AssetGroupFormValues } from '../core/schema';
import {
  getAssetGroupsDb,
  createAssetGroupDb,
  updateAssetGroupDb,
  updateAssetGroupStatusDb,
  deleteAssetGroupsDb,
} from './thiet-lap-tai-san-db.service';

export const getAssetGroups = getAssetGroupsDb;

export const createAssetGroup = (data: AssetGroupFormValues): Promise<AssetGroup> =>
  createAssetGroupDb(data);

export const updateAssetGroup = (id: string, data: AssetGroupFormValues): Promise<AssetGroup> =>
  updateAssetGroupDb(id, data);

export const updateAssetGroupStatus = updateAssetGroupStatusDb;

export const deleteAssetGroups = deleteAssetGroupsDb;
