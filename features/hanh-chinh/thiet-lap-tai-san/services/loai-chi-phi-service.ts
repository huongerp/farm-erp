import type { LoaiChiPhi } from '../core/types';
import type { LoaiChiPhiFormValues } from '../core/schema';
import {
  getLoaiChiPhiListDb,
  createLoaiChiPhiDb,
  updateLoaiChiPhiDb,
  updateLoaiChiPhiStatusDb,
  deleteLoaiChiPhiListDb,
} from './thiet-lap-tai-san-db.service';

export const getLoaiChiPhiList = getLoaiChiPhiListDb;

export const createLoaiChiPhi = (data: LoaiChiPhiFormValues): Promise<LoaiChiPhi> =>
  createLoaiChiPhiDb(data);

export const updateLoaiChiPhi = (id: string, data: LoaiChiPhiFormValues): Promise<LoaiChiPhi> =>
  updateLoaiChiPhiDb(id, data);

export const updateLoaiChiPhiStatus = updateLoaiChiPhiStatusDb;

export const deleteLoaiChiPhiList = deleteLoaiChiPhiListDb;
