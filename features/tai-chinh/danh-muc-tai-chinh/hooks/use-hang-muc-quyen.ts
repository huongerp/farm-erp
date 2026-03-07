import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuyenByHangMuc, setQuyenHangMuc, getAllQuyen } from '../services/hang-muc-quyen-service';
import { getPositions } from '../../../he-thong/chuc-vu/services/chuc-vu-service';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';

export interface QuyenForListMap {
  byHangMuc: Record<string, { quan_ly: string[]; de_xuat: string[] }>;
  chucVuNames: Record<string, string>;
}

export const useQuyenForList = () => {
  const quyenQuery = useQuery({
    queryKey: ['hang-muc-quyen-all'],
    queryFn: getAllQuyen,
  });
  const positionsQuery = useQuery({
    queryKey: ['chuc-vu-positions'],
    queryFn: getPositions,
  });

  const quyenMap: QuyenForListMap | null =
    quyenQuery.data && positionsQuery.data
      ? (() => {
          const byHangMuc: Record<string, { quan_ly: string[]; de_xuat: string[] }> = {};
          for (const q of quyenQuery.data) {
            if (!byHangMuc[q.id_hang_muc]) byHangMuc[q.id_hang_muc] = { quan_ly: [], de_xuat: [] };
            if (q.loai_quyen === 'quan_ly') byHangMuc[q.id_hang_muc].quan_ly.push(q.id_chuc_vu);
            else byHangMuc[q.id_hang_muc].de_xuat.push(q.id_chuc_vu);
          }
          const chucVuNames: Record<string, string> = {};
          for (const p of positionsQuery.data) chucVuNames[p.id] = p.ten_chuc_vu ?? p.id;
          return { byHangMuc, chucVuNames };
        })()
      : null;

  return {
    quyenMap,
    isLoading: quyenQuery.isLoading || positionsQuery.isLoading,
    refetch: () => {
      quyenQuery.refetch();
      positionsQuery.refetch();
    },
  };
};

export const useQuyenByHangMuc = (idHangMuc: string | null) => {
  return useQuery({
    queryKey: ['hang-muc-quyen', idHangMuc],
    queryFn: () => getQuyenByHangMuc(idHangMuc!),
    enabled: !!idHangMuc,
  });
};

export const useSetQuyenHangMuc = (
  idHangMuc: string | null,
  loaiQuyen: 'quan_ly' | 'de_xuat',
  onSuccess?: () => void
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idChucVuList: string[]) =>
      setQuyenHangMuc(idHangMuc!, loaiQuyen, idChucVuList),
    onSuccess: () => {
      if (idHangMuc) {
        queryClient.invalidateQueries({ queryKey: ['hang-muc-quyen', idHangMuc] });
      }
      queryClient.invalidateQueries({ queryKey: ['hang-muc-quyen-all'] });
      toast.success(i18n.t('danhMucTaiChinh.quyen.saveSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
