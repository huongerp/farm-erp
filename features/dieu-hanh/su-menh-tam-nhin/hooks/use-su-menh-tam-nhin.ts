import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSuMenhTamNhin,
  updateMissionVision,
  updateValues,
  updateDinhVi,
  updateChiTieuQuyMo,
  updateGiaTriQuyMoTheoNam,
  updatePhanKhucThiPhan,
  updateTamNhinThiPhan,
} from '../services/su-menh-tam-nhin-service';
import type { ChiTieuQuyMo, GiaTriQuyMoTheoNam, PhanKhucThiPhan, TamNhinThiPhanItem } from '../core/types';
import type { DinhViFormValues } from '../core/schema';

const QUERY_KEY = ['su-menh-tam-nhin'];

export function useSuMenhTamNhin() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getSuMenhTamNhin,
  });
}

export function useUpdateMissionVision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMissionVision,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateValues,
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateDinhVi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DinhViFormValues) => updateDinhVi(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateChiTieuQuyMo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChiTieuQuyMo[]) => updateChiTieuQuyMo(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateGiaTriQuyMoTheoNam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GiaTriQuyMoTheoNam[]) => updateGiaTriQuyMoTheoNam(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdatePhanKhucThiPhan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PhanKhucThiPhan[]) => updatePhanKhucThiPhan(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateTamNhinThiPhan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TamNhinThiPhanItem[]) => updateTamNhinThiPhan(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
