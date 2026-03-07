import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getChamDiemKpiRecords,
  getChamDiemKpiById,
  getChamDiemKpiByNhanVienPeriod,
  getKpiTheoChucVuByChucVu,
  getKpiTheoChucVuAll,
  saveChamDiemKpi,
  deleteChamDiemKpi,
  getDiemCongTruListForPeriod,
} from '../services/cham-diem-kpi-service';
import type { ChamDiemKpiFormValues } from '../core/schema';

export const CHAM_DIEM_KPI_KEYS = {
  all: ['chamDiemKpi'] as const,
  list: () => [...CHAM_DIEM_KPI_KEYS.all, 'list'] as const,
  detail: (id: string) => [...CHAM_DIEM_KPI_KEYS.all, 'detail', id] as const,
  byPeriod: (idNv: string, nam: number, thang: number) =>
    [...CHAM_DIEM_KPI_KEYS.all, 'byPeriod', idNv, nam, thang] as const,
  kpiTheoChucVu: (idChucVu: string) => [...CHAM_DIEM_KPI_KEYS.all, 'kpiTheoChucVu', idChucVu] as const,
  kpiTheoChucVuAll: () => [...CHAM_DIEM_KPI_KEYS.all, 'kpiTheoChucVuAll'] as const,
  diemCongTruList: (idNv: string, nam: number, thang: number) =>
    [...CHAM_DIEM_KPI_KEYS.all, 'diemCongTru', idNv, nam, thang] as const,
};

export function useChamDiemKpiRecords() {
  return useQuery({
    queryKey: CHAM_DIEM_KPI_KEYS.list(),
    queryFn: getChamDiemKpiRecords,
  });
}

export function useChamDiemKpiById(id: string | null) {
  return useQuery({
    queryKey: CHAM_DIEM_KPI_KEYS.detail(id ?? ''),
    queryFn: () => getChamDiemKpiById(id!),
    enabled: !!id,
  });
}

export function useChamDiemKpiByNhanVienPeriod(
  id_nhan_vien: string | null,
  nam: number,
  thang: number
) {
  return useQuery({
    queryKey: CHAM_DIEM_KPI_KEYS.byPeriod(id_nhan_vien ?? '', nam, thang),
    queryFn: () => getChamDiemKpiByNhanVienPeriod(id_nhan_vien!, nam, thang),
    enabled: !!id_nhan_vien,
  });
}

export function useKpiTheoChucVuByChucVu(id_chuc_vu: string | null) {
  return useQuery({
    queryKey: CHAM_DIEM_KPI_KEYS.kpiTheoChucVu(id_chuc_vu ?? ''),
    queryFn: () => getKpiTheoChucVuByChucVu(id_chuc_vu!),
    enabled: !!id_chuc_vu,
  });
}

export function useKpiTheoChucVuAll() {
  return useQuery({
    queryKey: CHAM_DIEM_KPI_KEYS.kpiTheoChucVuAll(),
    queryFn: getKpiTheoChucVuAll,
  });
}

export function useDiemCongTruListForPeriod(
  id_nhan_vien: string | null,
  nam: number,
  thang: number
) {
  return useQuery({
    queryKey: CHAM_DIEM_KPI_KEYS.diemCongTruList(id_nhan_vien ?? '', nam, thang),
    queryFn: () => getDiemCongTruListForPeriod(id_nhan_vien!, nam, thang),
    enabled: !!id_nhan_vien,
  });
}

export function useSaveChamDiemKpi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, id }: { data: ChamDiemKpiFormValues; id?: string }) =>
      saveChamDiemKpi(data, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAM_DIEM_KPI_KEYS.all });
      toast.success(i18n.t('chamDiemKpi.toast.saveSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useDeleteChamDiemKpi(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => deleteChamDiemKpi(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAM_DIEM_KPI_KEYS.all });
      toast.success(i18n.t('chamDiemKpi.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}
