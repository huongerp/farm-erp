import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanyInfo, updateCompanyInfo, getFirstCompanyId } from '../services/thong-tin-cong-ty-service';
import type { CompanyInfoPayload } from '../services/thong-tin-cong-ty-service';
import { useUIStore } from '../../../../store/useStore';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';

export const COMPANY_INFO_QUERY_KEY = ['companyInfo'] as const;

/**
 * Lấy thông tin công ty từ Supabase. Khi có dữ liệu sẽ đồng bộ vào store (setCompanyInfo).
 */
export function useCompanyInfo() {
  const setCompanyInfo = useUIStore((s) => s.setCompanyInfo);
  const query = useQuery({
    queryKey: COMPANY_INFO_QUERY_KEY,
    queryFn: async () => {
      const data = await getCompanyInfo();
      if (data) setCompanyInfo(data);
      return data;
    },
    staleTime: 1000 * 60 * 60 * 4, // 4h — thông tin công ty hầu như không đổi trong phiên.
    gcTime: 1000 * 60 * 60 * 24,
  });
  return query;
}

/**
 * Mutation cập nhật thông tin công ty: ghi Supabase rồi cập nhật store.
 */
export function useUpdateCompanyInfo(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const setCompanyInfo = useUIStore((s) => s.setCompanyInfo);

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CompanyInfoPayload }) => {
      const updated = await updateCompanyInfo(id, data);
      setCompanyInfo(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPANY_INFO_QUERY_KEY });
      toast.success(i18n.t('company.saveSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message ?? i18n.t('company.service.updateError')),
  });
}

/**
 * Lấy id bản ghi công ty đầu tiên (để dùng khi cập nhật).
 */
export function useFirstCompanyId() {
  return useQuery({
    queryKey: [...COMPANY_INFO_QUERY_KEY, 'firstId'],
    queryFn: getFirstCompanyId,
    staleTime: 1000 * 60 * 5,
  });
}
