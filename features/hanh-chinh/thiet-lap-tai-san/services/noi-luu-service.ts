import type { AssetStorageLocation } from '../core/types';
import type { AssetStorageLocationFormValues } from '../core/schema';
import {
  getAssetStorageLocationsSupabase,
  createAssetStorageLocationSupabase,
  updateAssetStorageLocationSupabase,
  updateAssetStorageLocationStatusSupabase,
  deleteAssetStorageLocationsSupabase,
} from './noi-luu-supabase.service';

export const getAssetStorageLocations = getAssetStorageLocationsSupabase;

export const createAssetStorageLocation = (
  data: AssetStorageLocationFormValues
): Promise<AssetStorageLocation> => createAssetStorageLocationSupabase(data);

export const updateAssetStorageLocation = (
  id: string,
  data: AssetStorageLocationFormValues
): Promise<AssetStorageLocation> => updateAssetStorageLocationSupabase(id, data);

export const updateAssetStorageLocationStatus = updateAssetStorageLocationStatusSupabase;

export const deleteAssetStorageLocations = deleteAssetStorageLocationsSupabase;
