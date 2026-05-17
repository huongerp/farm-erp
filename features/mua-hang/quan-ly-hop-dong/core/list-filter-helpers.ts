import type { HopDong, HopDongChiTietEnriched, HopDongFilters, ThanhToanFilters } from './types';
import { inNgayRange } from './datePresets';

type HopDongFilterExcept = 'trangThai' | 'nccIds' | 'nguoiTaoIds' | 'date';

export function matchesHopDongFilters(
  item: HopDong,
  f: HopDongFilters,
  except?: HopDongFilterExcept
): boolean {
  if (except !== 'date' && !inNgayRange(item.ngay, f.dateFrom, f.dateTo)) return false;
  if (except !== 'trangThai' && (f.trangThai?.length ?? 0) > 0 && !f.trangThai.includes(item.trang_thai)) {
    return false;
  }
  if (except !== 'nccIds' && (f.nccIds?.length ?? 0) > 0 && !f.nccIds.includes(item.id_nha_cung_cap)) {
    return false;
  }
  if (except !== 'nguoiTaoIds' && (f.nguoiTaoIds?.length ?? 0) > 0) {
    if (!item.id_nguoi_tao || !f.nguoiTaoIds.includes(item.id_nguoi_tao)) return false;
  }
  return true;
}

type ThanhToanFilterExcept = 'chiNhanhIds' | 'nccIds' | 'hopDongIds' | 'nguoiTaoIds' | 'date';

export function matchesThanhToanFilters(
  item: HopDongChiTietEnriched,
  f: ThanhToanFilters,
  except?: ThanhToanFilterExcept
): boolean {
  if (except !== 'date' && !inNgayRange(item.ngay, f.dateFrom, f.dateTo)) return false;
  if (
    except !== 'chiNhanhIds' &&
    (f.chiNhanhIds?.length ?? 0) > 0 &&
    !f.chiNhanhIds.includes(item.id_chi_nhanh ?? '')
  ) {
    return false;
  }
  if (
    except !== 'nccIds' &&
    (f.nccIds?.length ?? 0) > 0 &&
    !f.nccIds.includes(item.id_nha_cung_cap ?? '')
  ) {
    return false;
  }
  if (except !== 'hopDongIds' && (f.hopDongIds?.length ?? 0) > 0 && !f.hopDongIds.includes(item.id_hop_dong)) {
    return false;
  }
  if (except !== 'nguoiTaoIds' && (f.nguoiTaoIds?.length ?? 0) > 0) {
    if (!item.id_nguoi_tao || !f.nguoiTaoIds.includes(item.id_nguoi_tao)) return false;
  }
  return true;
}
