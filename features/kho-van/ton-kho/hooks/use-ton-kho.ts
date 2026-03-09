import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllTonKho,
  getTonKhoTheoHangHoa,
  getDinhMucTonKho,
  getDinhMucList,
  getDinhMucByHangHoa,
  createDinhMucTonKho,
  updateDinhMucTonKho,
  deleteDinhMucTonKho,
} from '../../phieu-kho/services/ton-kho-service';
import { getLichSuNhapXuatByHangHoa, getLichSuNhapXuatByKho } from '../../phieu-kho/services/phieu-kho-service';

export const TON_KHO_QUERY_KEY = ['tonKho'] as const;
const DINH_MUC_LIST_KEY = [...TON_KHO_QUERY_KEY, 'dinhMucList'] as const;

export function useAllTonKho() {
  return useQuery({
    queryKey: TON_KHO_QUERY_KEY,
    queryFn: getAllTonKho,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDinhMucTonKho() {
  return useQuery({
    queryKey: [...TON_KHO_QUERY_KEY, 'dinhMuc'],
    queryFn: getDinhMucTonKho,
    staleTime: 1000 * 60 * 2,
  });
}

export function useDinhMucList() {
  return useQuery({
    queryKey: DINH_MUC_LIST_KEY,
    queryFn: getDinhMucList,
    staleTime: 1000 * 60 * 2,
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
