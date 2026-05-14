/**
 * React Query hooks cho dữ liệu tham chiếu tối thiểu (giảm egress).
 * Query key tách biệt khỏi danh sách đầy đủ (employees, hangHoa, …).
 */
import { useQuery } from '@tanstack/react-query';
import { getEmployeesRef } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { getHangHoaRef } from '@/features/kho-van/danh-sach-hang-hoa/services/hang-hoa-service';
import { getDoiTacRef } from '@/features/kho-van/danh-sach-doi-tac/services/doi-tac-service';
import type { LoaiDoiTac } from '@/features/kho-van/danh-sach-doi-tac/core/types';
import { getKhoRef } from '@/features/kho-van/danh-sach-kho/services/kho-service';
import { listPhieuDeXuatSoPhieuMinimalSupabase } from '@/features/kho-van/phieu-de-xuat-vat-tu/services/phieu-de-xuat-vat-tu-supabase.service';
import { listDonDatHangSoPoMinimalSupabase } from '@/features/mua-hang/don-dat-hang/services/don-dat-hang-supabase.service';

const STALE_REF_MS = 30 * 60 * 1000;

export const EMPLOYEES_REF_QUERY_KEY = ['employees', 'ref'] as const;
export const HANG_HOA_REF_QUERY_KEY = ['hangHoa', 'ref'] as const;
export const DOI_TAC_REF_QUERY_KEY = ['doiTac', 'ref'] as const;
export const KHO_REF_QUERY_KEY = ['kho', 'ref'] as const;
export const PHIEU_DE_XUAT_SO_PHIEU_QUERY_KEY = ['phieuDeXuatVatTu', 'soPhieuMinimal'] as const;
export const DON_DAT_HANG_SO_PO_QUERY_KEY = ['donDatHang', 'soPoMinimal'] as const;

export function useEmployeesRefQuery() {
  return useQuery({
    queryKey: EMPLOYEES_REF_QUERY_KEY,
    queryFn: getEmployeesRef,
    staleTime: STALE_REF_MS,
  });
}

export function useHangHoaRefQuery() {
  return useQuery({
    queryKey: HANG_HOA_REF_QUERY_KEY,
    queryFn: getHangHoaRef,
    staleTime: STALE_REF_MS,
  });
}

export function useDoiTacRefQuery(loai?: LoaiDoiTac) {
  return useQuery({
    queryKey: [...DOI_TAC_REF_QUERY_KEY, loai ?? 'all'] as const,
    queryFn: () => getDoiTacRef(loai),
    staleTime: STALE_REF_MS,
  });
}

export function useKhoRefQuery() {
  return useQuery({
    queryKey: KHO_REF_QUERY_KEY,
    queryFn: getKhoRef,
    staleTime: STALE_REF_MS,
  });
}

/** Dropdown liên kết đơn đặt hàng ↔ phiếu đề xuất (3 cột). */
export function usePhieuDeXuatSoPhieuMinimalQuery() {
  return useQuery({
    queryKey: PHIEU_DE_XUAT_SO_PHIEU_QUERY_KEY,
    queryFn: () => listPhieuDeXuatSoPhieuMinimalSupabase(),
    staleTime: STALE_REF_MS,
  });
}

/** Dropdown liên kết phiếu nhập kho ↔ đơn đặt hàng (id + số PO + ngày). */
export function useDonDatHangSoPoMinimalQuery() {
  return useQuery({
    queryKey: DON_DAT_HANG_SO_PO_QUERY_KEY,
    queryFn: () => listDonDatHangSoPoMinimalSupabase(),
    staleTime: STALE_REF_MS,
  });
}
