import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTonKhoMatrixSupabase,
  getTonKhoTheoHangHoa,
  getDinhMucTonKho,
  getDinhMucList,
  getDinhMucByHangHoa,
  createDinhMucTonKho,
  updateDinhMucTonKho,
  deleteDinhMucTonKho,
  type TonKhoMatrixScope,
} from '../../phieu-kho/services/ton-kho-service';
import { getLichSuNhapXuatByHangHoa, getLichSuNhapXuatByKho } from '../../phieu-kho/services/phieu-kho-service';
import { useTonKhoViewScope } from './use-ton-kho-view-scope';
import { useKhoList } from '../../danh-sach-kho/hooks/use-kho';

export const TON_KHO_QUERY_KEY = ['tonKho'] as const;
const DINH_MUC_LIST_KEY = [...TON_KHO_QUERY_KEY, 'dinhMucList'] as const;

function tonKhoMatrixQueryKey(scope: TonKhoMatrixScope | 'wait'): readonly unknown[] {
  if (scope === 'wait') return [...TON_KHO_QUERY_KEY, 'matrix', 'wait'];
  if (scope.kind === 'all') return [...TON_KHO_QUERY_KEY, 'matrix', 'all'];
  if (scope.kind === 'none') return [...TON_KHO_QUERY_KEY, 'matrix', 'none'];
  return [...TON_KHO_QUERY_KEY, 'matrix', 'ids', [...scope.ids].sort().join(',')];
}

/**
 * Ma trận tồn kho theo phân quyền chi nhánh — chỉ tải dữ liệu kho được phép (giảm egress).
 * staleTime không đổi: dữ liệu vẫn được invalidate sau nhập/xuất như trước.
 */
export function useAllTonKho() {
  const scope = useTonKhoViewScope();
  const { data: khoList = [], isLoading: khoLoading } = useKhoList();

  const matrixScope = useMemo((): TonKhoMatrixScope | 'wait' => {
    if (scope.isLoading) return 'wait';
    if (scope.viewAll) return { kind: 'all' };
    if (!scope.viewByBranch || scope.allowedBranchIds.length === 0) return { kind: 'none' };
    const allowed = new Set(scope.allowedBranchIds);
    const ids = khoList
      .filter((k) => k.id_chi_nhanh != null && allowed.has(k.id_chi_nhanh))
      .map((k) => k.id);
    return { kind: 'ids', ids };
  }, [scope, khoList]);

  const blocked =
    matrixScope === 'wait' || (matrixScope !== 'wait' && matrixScope.kind === 'ids' && khoLoading);
  const enabled = !blocked;

  const q = useQuery({
    queryKey: tonKhoMatrixQueryKey(matrixScope),
    queryFn: () => {
      if (matrixScope === 'wait') return Promise.resolve([]);
      return getTonKhoMatrixSupabase(matrixScope);
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = blocked || (!q.data && q.isPending);
  const isFetchingOverlay = !blocked && !!q.data && q.isFetching;

  return {
    ...q,
    /** Skeleton toàn trang — chặn phân quyền / lần đầu không có dữ liệu. */
    isLoading,
    /** Đã có ma trận, đang refetch — overlay nhẹ. */
    isFetchingOverlay,
  };
}

export function useDinhMucTonKho() {
  return useQuery({
    queryKey: [...TON_KHO_QUERY_KEY, 'dinhMuc'],
    queryFn: getDinhMucTonKho,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDinhMucList() {
  return useQuery({
    queryKey: DINH_MUC_LIST_KEY,
    queryFn: getDinhMucList,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDinhMucByHangHoa(hang_hoa_id: string | undefined) {
  return useQuery({
    queryKey: [...TON_KHO_QUERY_KEY, 'dinhMucByHangHoa', hang_hoa_id],
    queryFn: () => getDinhMucByHangHoa(hang_hoa_id!),
    enabled: !!hang_hoa_id,
    staleTime: 1000 * 60,
  });
}

export function useTonKhoTheoHangHoa(id_hang_hoa: string | undefined) {
  return useQuery({
    queryKey: [...TON_KHO_QUERY_KEY, 'byHangHoa', id_hang_hoa],
    queryFn: () => getTonKhoTheoHangHoa(id_hang_hoa!),
    enabled: !!id_hang_hoa,
    staleTime: 1000 * 60,
  });
}

export function useLichSuNhapXuatByHangHoa(id_hang_hoa: string | undefined) {
  return useQuery({
    queryKey: ['phieuKho', 'lichSuByHangHoa', id_hang_hoa],
    queryFn: () => getLichSuNhapXuatByHangHoa(id_hang_hoa!),
    enabled: !!id_hang_hoa,
    staleTime: 1000 * 60,
  });
}

export function useLichSuNhapXuatByKho(id_kho: string | undefined) {
  return useQuery({
    queryKey: ['phieuKho', 'lichSuByKho', id_kho],
    queryFn: () => getLichSuNhapXuatByKho(id_kho!),
    enabled: !!id_kho,
    staleTime: 1000 * 60,
  });
}

function invalidateDinhMuc(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: TON_KHO_QUERY_KEY });
  qc.invalidateQueries({ queryKey: DINH_MUC_LIST_KEY });
}

export function useCreateDinhMucTonKho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { kho_id: string; hang_hoa_id: string; ton_toi_thieu: number }) =>
      createDinhMucTonKho(payload),
    onSuccess: () => invalidateDinhMuc(qc),
  });
}

export function useUpdateDinhMucTonKho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ton_toi_thieu }: { id: string; ton_toi_thieu: number }) =>
      updateDinhMucTonKho(id, { ton_toi_thieu }),
    onSuccess: () => invalidateDinhMuc(qc),
  });
}

export function useDeleteDinhMucTonKho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDinhMucTonKho(id),
    onSuccess: () => invalidateDinhMuc(qc),
  });
}
