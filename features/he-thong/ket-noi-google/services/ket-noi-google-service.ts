/**
 * Quản trị kết nối Google qua RPC SECURITY DEFINER (docs/migrations/016-quan-tri-ket-noi-google.sql).
 * Bảng kết nối/lịch khoá với người dùng app; mỗi RPC tự kiểm quyền module 'he-thong/ket-noi-google'
 * và không trả cột token.
 */
import { db } from '../../../../lib/db';
import { throwDbError } from '../../../../lib/db-errors';
import type { KetNoiGoogle, LichDongBoQt } from '../core/types';

export async function getKetNoiGoogle(): Promise<KetNoiGoogle[]> {
  const { data, error } = await db.rpc('rpc_qt_ket_noi_google_ds');
  if (error) throwDbError(error, { resource: 'rpc_qt_ket_noi_google_ds' });
  return ((data ?? []) as Omit<KetNoiGoogle, 'id'>[]).map((r) => ({ ...r, id: String(r.nhan_vien_id) }));
}

export async function getLichDongBo(nhanVienId: number): Promise<LichDongBoQt[]> {
  const { data, error } = await db.rpc('rpc_qt_lich_dong_bo_ds', { p_nhan_vien_id: nhanVienId });
  if (error) throwDbError(error, { resource: 'rpc_qt_lich_dong_bo_ds' });
  return (data ?? []) as LichDongBoQt[];
}

export async function datBatLich(id: number, bat: boolean): Promise<void> {
  const { error } = await db.rpc('rpc_qt_lich_dong_bo_bat', { p_id: id, p_bat: bat });
  if (error) throwDbError(error, { resource: 'rpc_qt_lich_dong_bo_bat' });
}

export async function xoaLichDongBo(id: number): Promise<void> {
  const { error } = await db.rpc('rpc_qt_lich_dong_bo_xoa', { p_id: id });
  if (error) throwDbError(error, { resource: 'rpc_qt_lich_dong_bo_xoa' });
}

export async function ngatKetNoiGoogle(nhanVienId: number): Promise<void> {
  const { error } = await db.rpc('rpc_qt_ket_noi_google_ngat', { p_nhan_vien_id: nhanVienId });
  if (error) throwDbError(error, { resource: 'rpc_qt_ket_noi_google_ngat' });
}
