import type { AssetStorageLocation } from '../core/types';
import type { AssetStorageLocationFormValues } from '../core/schema';
import {
  getAssetStorageLocationsDb,
  createAssetStorageLocationDb,
  updateAssetStorageLocationDb,
  updateAssetStorageLocationStatusDb,
  deleteAssetStorageLocationsDb,
} from './noi-luu-db.service';

export const getAssetStorageLocations = getAssetStorageLocationsDb;

export const createAssetStorageLocation = (
  data: AssetStorageLocationFormValues
): Promise<AssetStorageLocation> => createAssetStorageLocationDb(data);

export const updateAssetStorageLocation = (
  id: string,
  data: AssetStorageLocationFormValues
): Promise<AssetStorageLocation> => updateAssetStorageLocationDb(id, data);

export const updateAssetStorageLocationStatus = updateAssetStorageLocationStatusDb;

export const deleteAssetStorageLocations = deleteAssetStorageLocationsDb;
