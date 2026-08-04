import { db, fetchAllRows } from '../../../../lib/db';
import { getKhoRef } from '../../../kho-van/danh-sach-kho/services/kho-service';
import { normalizePhamCapKey } from '../core/pham-cap';

const VIEW_PHIEU_KHO_CHI_TIET_FLAT = 'v_phieu_kho_chi_tiet_flat';

interface PhieuNhapPhamCapRow {
  pham_cap: string | null;
  so_luong: number | string | null;
}

/** Tổng số lượng phiếu nhập kho theo phẩm cấp — cùng ngày + chi nhánh (mọi trạng thái). */
export async function fetchPhieuNhapSoLuongByPhamCap(
  ngay: string,
  idChiNhanh: string
): Promise<Record<string, number>> {
  const ngayTrim = ngay?.trim();
  const idTrim = idChiNhanh?.trim();
  if (!ngayTrim || !idTrim) return {};

  const khoIds = (await getKhoRef())
    .filter((k) => k.id_chi_nhanh != null && String(k.id_chi_nhanh) === idTrim)
    .map((k) => Number(k.id))
    .filter((id) => !Number.isNaN(id));

  if (khoIds.length === 0) return {};

  const rows = await fetchAllRows<PhieuNhapPhamCapRow>((from, to) =>
    db
      .from(VIEW_PHIEU_KHO_CHI_TIET_FLAT)
      .select('pham_cap, so_luong')
      .eq('ngay', ngayTrim)
      .eq('loai', 'nhập')
      .in('kho_id', khoIds)
      .range(from, to)
  );

  const map: Record<string, number> = {};
  for (const row of rows) {
    const key = normalizePhamCapKey(row.pham_cap);
    if (!key) continue;
    map[key] = (map[key] ?? 0) + (Number(row.so_luong) || 0);
  }
  return map;
}
