import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getHopDongs,
  getPhieuThanhLyList,
  createHopDong,
  createHopDongFromProbation,
  updateHopDong,
  deleteHopDongs,
  createPhieuThanhLy,
} from '../services/hop-dong-service';
import type { HopDongFormValues, PhieuThanhLyFormValues } from '../core/types';

const QUERY_KEY = ['hopDong'];
const QUERY_KEY_PHIEU = ['phieuThanhLy'];

export const useHopDongs = () => {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: getHopDongs,
    staleTime: 1000 * 60 * 3,
  });
};

export const usePhieuThanhLyList = () => {
  return useQuery({
    queryKey: QUERY_KEY_PHIEU,
    queryFn: getPhieuThanhLyList,
    staleTime: 1000 * 60 * 3,
  });
};

export const useCreateHopDong = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HopDongFormValues) => createHopDong(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hopDong.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useCreateHopDongFromProbation = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, id_hop_dong_goc }: { data: HopDongFormValues; id_hop_dong_goc: string }) =>
      createHopDongFromProbation(data, id_hop_dong_goc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hopDong.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useUpdateHopDong = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HopDongFormValues> }) =>
      updateHopDong(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(i18n.t('hopDong.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useDeleteHopDongs = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteHopDongs(ids),
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PHIEU });
      toast.success(i18n.t('hopDong.toast.deleteSuccess', { count: ids.length }));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};

export const useCreatePhieuThanhLy = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PhieuThanhLyFormValues) => createPhieuThanhLy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_PHIEU });
      toast.success(i18n.t('hopDong.phieuThanhLy.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
};
