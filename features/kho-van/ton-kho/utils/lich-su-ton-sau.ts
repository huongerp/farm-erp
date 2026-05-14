import type { LichSuNhapXuatRow } from '../../phieu-kho/services/phieu-kho-service';

export type LichSuTonSauMode = 'byKho' | 'byProductGlobal' | 'byProductAtKho';

/** Cũ → mới, cùng tie-break với sort lịch sử hiện tại (đảo chiều). */
function compareChronoAsc(a: LichSuNhapXuatRow, b: LichSuNhapXuatRow): number {
  const byNgay = (a.ngay || '').localeCompare(b.ngay || '');
  if (byNgay !== 0) return byNgay;
  const byTg = (a.tg_tao || '').localeCompare(b.tg_tao || '');
  if (byTg !== 0) return byTg;
  const byPhieu = (a.so_phieu || '').localeCompare(b.so_phieu || '');
  if (byPhieu !== 0) return byPhieu;
  return (a.id_chi_tiet || '').localeCompare(b.id_chi_tiet || '');
}

function deltaForWarehouse(row: LichSuNhapXuatRow, idKho: string): number {
  const q = row.so_luong;
  if (row.loai === 'nhập') return row.kho_id === idKho ? q : 0;
  if (row.loai === 'xuất') return row.kho_id === idKho ? -q : 0;
  let d = 0;
  if (row.kho_id === idKho) d -= q;
  if (row.kho_den_id != null && row.kho_den_id === idKho) d += q;
  return d;
}

function deltaGlobalProduct(row: LichSuNhapXuatRow): number {
  if (row.loai === 'nhập') return row.so_luong;
  if (row.loai === 'xuất') return -row.so_luong;
  return 0;
}

/**
 * Tồn ngay sau khi ghi nhận từng dòng chi tiết (luỹ kế theo thời gian tăng dần).
 * `byKho` / `byProductAtKho`: partition theo `id_hang_hoa`, delta theo kho `idKho`.
 * `byProductGlobal`: một chuỗi tổng (chuyển kho = 0 đối với tổng hệ thống).
 */
export function computeTonSauByChiTiet(
  rows: LichSuNhapXuatRow[],
  mode: LichSuTonSauMode,
  idKho?: string
): Map<string, number> {
  const sorted = [...rows].sort(compareChronoAsc);
  const out = new Map<string, number>();

  if (mode === 'byProductGlobal') {
    let total = 0;
    for (const row of sorted) {
      total += deltaGlobalProduct(row);
      out.set(row.id_chi_tiet, total);
    }
    return out;
  }

  if ((mode === 'byKho' || mode === 'byProductAtKho') && idKho) {
    const cumByHang = new Map<string, number>();
    for (const row of sorted) {
      const d = deltaForWarehouse(row, idKho);
      const hid = row.id_hang_hoa;
      const prev = cumByHang.get(hid) ?? 0;
      const next = prev + d;
      cumByHang.set(hid, next);
      out.set(row.id_chi_tiet, next);
    }
    return out;
  }

  return out;
}
