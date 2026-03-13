import type { LoaiChiPhi } from '../core/types';
import type { LoaiChiPhiFormValues } from '../core/schema';
import {
  getLoaiChiPhiListSupabase,
  createLoaiChiPhiSupabase,
  updateLoaiChiPhiSupabase,
  updateLoaiChiPhiStatusSupabase,
  deleteLoaiChiPhiListSupabase,
} from './thiet-lap-tai-san-supabase.service';

export const getLoaiChiPhiList = getLoaiChiPhiListSupabase;

export const createLoaiChiPhi = (data: LoaiChiPhiFormValues): Promise<LoaiChiPhi> =>
  createLoaiChiPhiSupabase(data);

export const updateLoaiChiPhi = (id: string, data: LoaiChiPhiFormValues): Promise<LoaiChiPhi> =>
  updateLoaiChiPhiSupabase(id, data);

export const updateLoaiChiPhiStatus = updateLoaiChiPhiStatusSupabase;

export const deleteLoaiChiPhiList = deleteLoaiChiPhiListSupabase;
