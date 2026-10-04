import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  datBatLich,
  getKetNoiGoogle,
  getLichDongBo,
  ngatKetNoiGoogle,
  xoaLichDongBo,
} from '../services/ket-noi-google-service';

const KEY = ['ket-noi-google'] as const;

/** Trạng thái lịch đổi liên tục theo worker — không cache lâu như danh mục. */
export function useKetNoiGoogle() {
  return useQuery({ queryKey: KEY, queryFn: getKetNoiGoogle, staleTime: 30_000 });
}

export function useLichDongBoCuaNhanVien(nhanVienId: number | null) {
  return useQuery({
    queryKey: [...KEY, 'lich', nhanVienId],
    queryFn: () => getLichDongBo(nhanVienId as number),
    enabled: nhanVienId != null,
    staleTime: 15_000,
  });
}

function useLamMoiSauKhi() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

const baoLoi = (e: unknown) => toast.error(e instanceof Error ? e.message : i18n.t('ketNoiGoogle.actionError'));

export function useDatBatLich() {
  const lamMoi = useLamMoiSauKhi();
  return useMutation({
    mutationFn: ({ id, bat }: { id: number; bat: boolean }) => datBatLich(id, bat),
    onSuccess: (_, v) => {
      toast.success(i18n.t(v.bat ? 'ketNoiGoogle.resumed' : 'ketNoiGoogle.paused'));
      void lamMoi();
    },
    onError: baoLoi,
  });
}

export function useXoaLichDongBo() {
  const lamMoi = useLamMoiSauKhi();
  return useMutation({
    mutationFn: (id: number) => xoaLichDongBo(id),
    onSuccess: () => {
      toast.success(i18n.t('ketNoiGoogle.scheduleDeleted'));
      void lamMoi();
    },
    onError: baoLoi,
  });
}

export function useNgatKetNoiGoogle() {
  const lamMoi = useLamMoiSauKhi();
  return useMutation({
    mutationFn: (nhanVienId: number) => ngatKetNoiGoogle(nhanVienId),
    onSuccess: () => {
      toast.success(i18n.t('ketNoiGoogle.disconnected'));
      void lamMoi();
    },
    onError: baoLoi,
  });
}
