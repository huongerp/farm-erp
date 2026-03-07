
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHistory, exportData, restoreData, deleteHistory } from "../services/sao-luu-service";
import { ExportFormat, RestoreMode } from "../core/types";
import { toast } from "sonner";

export const useExportHistory = () => {
  return useQuery({
    queryKey: ['export-history'],
    queryFn: getHistory,
    staleTime: 1000 * 60,
  });
};

export const useExportData = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collections, format, ghi_chu }: { collections: string[]; format: ExportFormat; ghi_chu?: string }) =>
      exportData(collections, format, ghi_chu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
      toast.success('Đã xuất dữ liệu thành công!');
      onSuccess?.();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
  });
};

export const useRestoreData = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fileName, fileContent, collections, mode, ghi_chu }: {
      fileName: string;
      fileContent: string | import('../core/types').BackupPayload;
      collections: string[];
      mode: RestoreMode;
      ghi_chu?: string;
    }) => restoreData(fileName, fileContent, collections, mode, ghi_chu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
      toast.success('Khôi phục dữ liệu thành công!');
      onSuccess?.();
    },
    onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
  });
};

export const useDeleteHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteHistory(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['export-history'] });
      toast.success('Đã xóa bản ghi');
    },
  });
};
