import { useQuery } from '@tanstack/react-query';
import { fetchPhieuNhapSoLuongByPhamCap } from '../services/phieu-nhap-pham-cap-ref.service';

export const QUERY_KEY_PHIEU_NHAP_PHAM_CAP_REF = ['bcsc', 'phieuNhapPhamCapRef'] as const;

export function usePhieuNhapPhamCapRef(ngay: string | undefined, idChiNhanh: string | undefined) {
  const ngayTrim = ngay?.trim() ?? '';
  const idTrim = idChiNhanh?.trim() ?? '';

  return useQuery({
    queryKey: [...QUERY_KEY_PHIEU_NHAP_PHAM_CAP_REF, ngayTrim, idTrim],
    queryFn: () => fetchPhieuNhapSoLuongByPhamCap(ngayTrim, idTrim),
    enabled: !!ngayTrim && !!idTrim,
    staleTime: 1000 * 60,
  });
}
