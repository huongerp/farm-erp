import { db } from '../../../../lib/db';
import { throwSupabaseError } from '../../../../lib/supabase-errors';
import type { SinhNhatNhanVien } from '../utils/sinh-nhat';

/** RPC `rpc_sinh_nhat_nhan_vien` (docs/vps-10-rpc-sinh-nhat-nhan-vien.sql) — ngày/tháng sinh, không năm. */
export async function getSinhNhatNhanVien(): Promise<SinhNhatNhanVien[]> {
  const { data, error } = await db.rpc('rpc_sinh_nhat_nhan_vien');
  if (error) throwSupabaseError(error, { resource: 'sinh nhật nhân viên' });
  return ((data ?? []) as Array<{ id: number; ho_va_ten: string | null; hinh_anh: string | null; ngay: number; thang: number }>).map(
    (r) => ({
      id: String(r.id),
      ho_ten: r.ho_va_ten ?? '',
      anh_dai_dien: r.hinh_anh,
      ngay: r.ngay,
      thang: r.thang,
    })
  );
}
