import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import type { NhatKyBaoDuong, ThietBi, ViecBaoDuong } from '../core/types';
import type { ThietBiFormValues } from '../core/schema';
import {
  createNhatKy,
  createThietBi,
  createViec,
  deleteThietBi,
  deleteViec,
  getNhatKyTheoViec,
  getTaiSanRef,
  getThietBiById,
  getThietBiList,
  getViecDangDung,
  getViecTheoThietBi,
  sapXepViec,
  updateThietBi,
  updateViec,
  type NhatKyInput,
  type ViecInput,
} from '../services/bao-duong-thiet-bi-service';

const BD_KEY = 'baoDuongThietBi';

const onErr = (err: unknown) => toast.error(err instanceof Error ? err.message : String(err));

/** Invalidate mọi query của module (lịch + thiết bị + drawer + tài sản). */
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [BD_KEY] });
}

// ── Query ─────────────────────────────────────────────────────────────────────

export function useThietBiList() {
  return useQuery({ queryKey: [BD_KEY, 'thietBi'], queryFn: getThietBiList, staleTime: 30_000 });
}

export function useViecDangDung() {
  return useQuery({ queryKey: [BD_KEY, 'viec'], queryFn: getViecDangDung, staleTime: 30_000 });
}

export function useTaiSanRef() {
  return useQuery({
    queryKey: [BD_KEY, 'taiSan'],
    queryFn: getTaiSanRef,
    staleTime: 30 * 60_000,
    gcTime: 24 * 60 * 60_000,
  });
}

export interface ThietBiChiTiet {
  thietBi: ThietBi | null;
  viec: ViecBaoDuong[];
  nhatKy: NhatKyBaoDuong[];
}

export function useThietBiChiTiet(id: string) {
  return useQuery({
    queryKey: [BD_KEY, 'chiTiet', id],
    queryFn: async () => {
      const [thietBi, viec] = await Promise.all([getThietBiById(id), getViecTheoThietBi(id)]);
      const nhatKy = viec.length > 0 ? await getNhatKyTheoViec(viec.map((v) => v.id)) : [];
      return { thietBi, viec, nhatKy };
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Thiết bị ──────────────────────────────────────────────────────────────────

export function useCreateThietBi(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: ThietBiFormValues) => createThietBi(data),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('baoDuongThietBi.toast.daTaoThietBi'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useUpdateThietBi(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThietBiFormValues }) => updateThietBi(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('baoDuongThietBi.toast.daCapNhatThietBi'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDeleteThietBi(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteThietBi(id),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('baoDuongThietBi.toast.daXoaThietBi'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

// ── Việc ──────────────────────────────────────────────────────────────────────

export function useLuuViec(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (args: {
      id: string | null;
      idThietBi: string;
      values: Omit<ViecInput, 'id_thiet_bi'>;
      nhom: ViecBaoDuong[];
    }) => {
      if (args.id) return updateViec(args.id, args.values);
      const thuTu = args.nhom.reduce((m, x) => Math.max(m, x.thu_tu), 0) + 1;
      return createViec({ ...args.values, id_thiet_bi: args.idThietBi }, thuTu);
    },
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('baoDuongThietBi.toast.daLuuViec'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useThaoTacViec() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (args: { action: 'xoa'; id: string } | { action: 'sapXep'; ids: string[] }) => {
      if (args.action === 'xoa') return deleteViec(args.id);
      return sapXepViec(args.ids);
    },
    onSuccess: () => invalidate(),
    onError: (err) => {
      invalidate();
      onErr(err);
    },
  });
}

// ── Nhật ký ───────────────────────────────────────────────────────────────────

export function useCreateNhatKy(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: NhatKyInput) => createNhatKy(data),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('baoDuongThietBi.toast.daGhiNhan'));
      onSuccess?.();
    },
    onError: onErr,
  });
}
