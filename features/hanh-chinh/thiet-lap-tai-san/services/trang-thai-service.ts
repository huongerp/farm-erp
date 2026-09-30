import type { AssetStatus } from '../core/types';
import type { AssetStatusFormValues } from '../core/schema';
import {
  getAssetStatusesDb,
  createAssetStatusDb,
  updateAssetStatusDb,
  updateAssetStatusStatusDb,
  deleteAssetStatusesDb,
} from './thiet-lap-tai-san-db.service';

export const getAssetStatuses = getAssetStatusesDb;

export const createAssetStatus = (data: AssetStatusFormValues): Promise<AssetStatus> =>
  createAssetStatusDb(data);

export const updateAssetStatus = (id: string, data: AssetStatusFormValues): Promise<AssetStatus> =>
  updateAssetStatusDb(id, data);

export const updateAssetStatusStatus = updateAssetStatusStatusDb;

export const deleteAssetStatuses = deleteAssetStatusesDb;
