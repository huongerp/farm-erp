import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import type { HangMucMauChecklist, MauChecklist, MucMauChecklist } from '../core/types';
import type { ChecklistMauFormValues, HangMucFormValues } from '../core/schema';
import {
  createHangMuc,
  createMau,
  createMuc,
  datDangDungHangMuc,
  deleteHangMuc,
  deleteMau,
  deleteMuc,
  getMauChiTiet,
  getMauList,
  getThietBi,
  sapXepHangMuc,
  sapXepMuc,
  updateHangMuc,
  updateMau,
  updateMuc,
  type HangMucInput,
} from '../services/checklist-mau-service';

const CL_MAU_KEY = 'checklistMau';

const onErr = (err: unknown) => toast.error(err instanceof Error ? err.message : String(err));

/** Invalidate mọi query của module (list + chi tiết + thiết bị dùng chung). */
function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [CL_MAU_KEY] });
}

export function useMauList() {
  return useQuery({ queryKey: [CL_MAU_KEY, 'list'], queryFn: getMauList, staleTime: 30_000 });
}

export function useMauChiTiet(id: string) {
  return useQuery({
    queryKey: [CL_MAU_KEY, 'chiTiet', id],
    queryFn: () => getMauChiTiet(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useThietBi() {
  return useQuery({
    queryKey: [CL_MAU_KEY, 'thietBi'],
    queryFn: getThietBi,
    staleTime: 5 * 60_000,
    gcTime: 24 * 60 * 60_000,
  });
}

// ── Mẫu ───────────────────────────────────────────────────────────────────────

export function useCreateMau(
  onSuccess?: (created: MauChecklist) => void,
  thongBaoKey = 'checklistMau.toast.createSuccess'
) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: ChecklistMauFormValues) => createMau(data),
    onSuccess: (created) => {
      invalidate();
      toast.success(i18n.t(thongBaoKey));
      onSuccess?.(created);
    },
    onError: onErr,
  });
}

export function useUpdateMau(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChecklistMauFormValues }) => updateMau(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('checklistMau.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDeleteMau(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteMau(id),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('checklistMau.toast.deleteSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

// ── Mục ───────────────────────────────────────────────────────────────────────

export function useLuuMuc(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { id: string | null; idMau: string; ten: string; muc: MucMauChecklist[] }) =>
      v.id ? updateMuc(v.id, v.ten) : createMuc(v.idMau, v.ten, v.muc.reduce((m, x) => Math.max(m, x.thu_tu), 0) + 1),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('checklistMau.toast.mucSaved'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useThaoTacMuc() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (args: { action: 'xoa'; id: string } | { action: 'sapXep'; ids: string[] }) => {
      if (args.action === 'xoa') return deleteMuc(args.id);
      return sapXepMuc(args.ids);
    },
    onSuccess: () => invalidate(),
    onError: (err) => {
      invalidate();
      onErr(err);
    },
  });
}

// ── Hạng mục ──────────────────────────────────────────────────────────────────

export function useLuuHangMuc(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      id: string | null;
      idMau: string;
      idMuc: string | null;
      values: HangMucFormValues;
      nhom: HangMucMauChecklist[];
    }) => {
      const input: HangMucInput = {
        id_mau: v.idMau,
        id_muc: v.idMuc,
        doi_tuong: v.values.doi_tuong,
        tieu_chuan: v.values.tieu_chuan || null,
        phuong_phap: v.values.phuong_phap || null,
        quan_trong: v.values.quan_trong,
        id_thiet_bi: v.values.id_thiet_bi,
        dang_dung: v.values.dang_dung,
      };
      return v.id
        ? updateHangMuc(v.id, input)
        : createHangMuc(input, v.nhom.reduce((m, x) => Math.max(m, x.thu_tu), 0) + 1);
    },
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('checklistMau.toast.hangMucSaved'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useThaoTacHangMuc() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (
      args:
        | { action: 'dangDung'; id: string; value: boolean }
        | { action: 'xoa'; id: string }
        | { action: 'sapXep'; ids: string[] }
    ) => {
      if (args.action === 'dangDung') return datDangDungHangMuc(args.id, args.value);
      if (args.action === 'xoa') return deleteHangMuc(args.id);
      return sapXepHangMuc(args.ids);
    },
    onSuccess: () => invalidate(),
    onError: (err) => {
      invalidate();
      onErr(err);
    },
  });
}
