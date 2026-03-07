import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getLoginDevices,
  logoutDevice,
  logoutDevices,
} from '../services/thiet-bi-dang-nhap-service';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';

export const useLoginDevices = () => {
  return useQuery({
    queryKey: ['loginDevices'],
    queryFn: getLoginDevices,
    staleTime: 1000 * 60 * 2, // 2 phút
  });
};

export const useLogoutDevice = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loginDevices'] });
      toast.success(i18n.t('loginDevices.toast.logoutSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) =>
      toast.error((err as Error).message),
  });
};

export const useLogoutDevices = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutDevices,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['loginDevices'] });
      if (result.length > 0) {
        toast.success(i18n.t('loginDevices.toast.logoutManySuccess', { count: result.length }));
      }
      onSuccess?.();
    },
    onError: (err: unknown) =>
      toast.error((err as Error).message),
  });
};
