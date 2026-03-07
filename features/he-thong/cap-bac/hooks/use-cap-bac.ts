import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJobLevels, createJobLevel, updateJobLevel, deleteJobLevels, updateJobLevelStatus } from "../services/cap-bac-service";
import { JobLevelFormValues } from "../core/schema";
import { toast } from "sonner";
import i18n from '../../../../lib/i18n';

export const useJobLevels = () => {
  return useQuery({
    queryKey: ['job-levels'],
    queryFn: getJobLevels,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateJobLevel = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJobLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-levels'] });
      toast.success(i18n.t('jobLevel.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(err.message)
  });
};

export const useUpdateJobLevel = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: JobLevelFormValues }) => updateJobLevel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-levels'] });
      toast.success(i18n.t('jobLevel.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => toast.error(err.message)
  });
};

export const useUpdateStatusJobLevel = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ ids, status }: { ids: string[], status: import('../../../../lib/constants').TrangThai }) => updateJobLevelStatus(ids, status),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['job-levels'] });
        toast.success(i18n.t('jobLevel.toast.statusUpdate', { count: variables.ids.length }));
      },
      onError: (err: any) => toast.error(err.message)
    });
};

export const useDeleteJobLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteJobLevels(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['job-levels'] });
      toast.success(i18n.t('jobLevel.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: any) => toast.error(err.message)
  });
};