import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSwotYears,
  getSwotByYear,
  createSwot,
  updateSwot,
} from '../services/swot-service';
import type { SwotFormValues } from '../core/schema';

const QUERY_KEY_YEARS = ['phan-tich-swot', 'years'];
const QUERY_KEY_BY_YEAR = (nam: number) => ['phan-tich-swot', 'by-year', nam];

export function useSwotYears() {
  return useQuery({
    queryKey: QUERY_KEY_YEARS,
    queryFn: getSwotYears,
  });
}

export function useSwotByYear(nam: number | null) {
  return useQuery({
    queryKey: QUERY_KEY_BY_YEAR(nam ?? 0),
    queryFn: () => getSwotByYear(nam!),
    enabled: nam != null,
  });
}

export function useCreateSwot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SwotFormValues) => createSwot(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_YEARS });
      qc.setQueryData(QUERY_KEY_BY_YEAR(data.nam), data);
    },
  });
}

export function useUpdateSwot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      idOrNam,
      payload,
    }: {
      idOrNam: string | number;
      payload: Omit<SwotFormValues, 'nam'>;
    }) => updateSwot(idOrNam, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_YEARS });
      qc.setQueryData(QUERY_KEY_BY_YEAR(data.nam), data);
    },
  });
}
