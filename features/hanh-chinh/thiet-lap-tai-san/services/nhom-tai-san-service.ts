import type { AssetGroup } from '../core/types';
import type { AssetGroupFormValues } from '../core/schema';
import {
  getAssetGroupsSupabase,
  createAssetGroupSupabase,
  updateAssetGroupSupabase,
  updateAssetGroupStatusSupabase,
  deleteAssetGroupsSupabase,
} from './thiet-lap-tai-san-supabase.service';

export const getAssetGroups = getAssetGroupsSupabase;

export const createAssetGroup = (data: AssetGroupFormValues): Promise<AssetGroup> =>
  createAssetGroupSupabase(data);

export const updateAssetGroup = (id: string, data: AssetGroupFormValues): Promise<AssetGroup> =>
  updateAssetGroupSupabase(id, data);

export const updateAssetGroupStatus = updateAssetGroupStatusSupabase;

export const deleteAssetGroups = deleteAssetGroupsSupabase;
