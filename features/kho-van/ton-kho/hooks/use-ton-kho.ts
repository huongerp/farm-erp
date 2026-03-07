import { useQuery } from '@tanstack/react-query';
import { getAllTonKho, getTonKhoTheoHangHoa } from '../../phieu-kho/services/ton-kho-service';
import { getLichSuNhapXuatByHangHoa, getLichSuNhapXuatByKho } from '../../phieu-kho/services/phieu-kho-service';

export const TON_KHO_QUERY_KEY = ['tonKho'] as const;

export function useAllTonKho() {
  return useQuery({
    queryKey: TON_KHO_QUERY_KEY,
    queryFn: getAllTonKho,
    staleTime: 1000 * 60 * 2,
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
