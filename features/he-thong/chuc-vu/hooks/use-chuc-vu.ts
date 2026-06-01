import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPositions, createPosition, updatePosition, deletePositions, updatePositionStatus } from "../services/chuc-vu-service";
import { PositionFormValues } from "../core/schema";
import { toast } from "sonner";
import i18n from '../../../../lib/i18n';

export const usePositions = () => {
  return useQuery({
    queryKey: ['positions'],
    queryFn: getPositions,
    staleTime: 1000 * 60 * 60 * 4,
    gcTime: 1000 * 60 * 60 * 24,
  });
};

export const useCreatePosition = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success(i18n.t('position.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
  });
};

export const useUpdatePosition = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: PositionFormValues }) => updatePosition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success(i18n.t('position.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
  });
};

export const useUpdateStatusPosition = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ ids, status }: { ids: string[], status: import('../../../../lib/constants').TrangThaiHoatDong }) => updatePositionStatus(ids, status),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['positions'] });
        toast.success(i18n.t('position.toast.statusUpdate', { count: variables.ids.length }));
      },
      onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
    });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deletePositions(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      toast.success(i18n.t('position.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: any) => toast.error(err.message)
  });
};