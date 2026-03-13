import type { AssetStatus } from '../core/types';
import type { AssetStatusFormValues } from '../core/schema';
import {
  getAssetStatusesSupabase,
  createAssetStatusSupabase,
  updateAssetStatusSupabase,
  updateAssetStatusStatusSupabase,
  deleteAssetStatusesSupabase,
} from './thiet-lap-tai-san-supabase.service';

export const getAssetStatuses = getAssetStatusesSupabase;

export const createAssetStatus = (data: AssetStatusFormValues): Promise<AssetStatus> =>
  createAssetStatusSupabase(data);

export const updateAssetStatus = (id: string, data: AssetStatusFormValues): Promise<AssetStatus> =>
  updateAssetStatusSupabase(id, data);

export const updateAssetStatusStatus = updateAssetStatusStatusSupabase;

export const deleteAssetStatuses = deleteAssetStatusesSupabase;
