import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import type { DangKyThamQuanFormValues } from '../core/schema';
import type { DangKyThamQuanListServerQuery } from '../services/dang-ky-tham-quan-list-query';
import {
  capNhatAnh,
  checkIn,
  checkOut,
  deleteDkTq,
  deleteDkTqMany,
  getDkTqById,
  getDkTqPage,
  getDkTqTomTat,
  getGoiYKhach,
  hoanTacCheckIn,
  hoanTacCheckOut,
  huyDkTq,
  khoiPhucDkTq,
  luuDkTq,
} from '../services/dang-ky-tham-quan-service';

export const QUERY_KEY_DKTQ = ['dangKyThamQuan'] as const;

const onErr = (err: Error) => toast.error(err.message);

export function useDangKyThamQuanPage(query: DangKyThamQuanListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKTQ, 'page', query],
    queryFn: () => getDkTqPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}

export function useDangKyThamQuanTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKTQ, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getDkTqTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/** Giá trị cũ của bảng khách — gợi ý quốc tịch / khu vực / đơn vị / người giới thiệu (chỉ khi mở form). */
export function useGoiYKhach(enabled: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKTQ, 'goiYKhach'],
    queryFn: getGoiYKhach,
    enabled,
    staleTime: 1000 * 60 * 10,
  });
}

export function useDangKyThamQuanById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKTQ, 'byId', id],
    queryFn: () => getDkTqById(id!),
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY_DKTQ });
}

export function useLuuDangKyThamQuan(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: DangKyThamQuanFormValues }) => luuDkTq(id, data),
    onSuccess: (_r, { id }) => {
      invalidate();
      toast.success(i18n.t(id ? 'dangKyThamQuan.toast.updateSuccess' : 'dangKyThamQuan.toast.createSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDeleteDangKyThamQuan() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteDkTq,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyThamQuan.toast.deleteSuccess'));
    },
    onError: onErr,
  });
}

export function useDeleteDangKyThamQuanMany() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteDkTqMany,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyThamQuan.toast.deleteManySuccess'));
    },
    onError: onErr,
  });
}

export type HanhDongTrangThai = 'checkIn' | 'checkOut' | 'hoanTacCheckIn' | 'hoanTacCheckOut' | 'huy' | 'khoiPhuc';

/** Mọi bước chuyển trạng thái qua một mutation. */
export function useChuyenTrangThaiDangKyThamQuan(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (
      args:
        | { action: 'checkIn' | 'checkOut'; id: string; thoiDiem: string }
        | { action: Exclude<HanhDongTrangThai, 'checkIn' | 'checkOut'>; id: string }
    ) => {
      const idNguoi = user?.id ? String(user.id) : null;
      switch (args.action) {
        case 'checkIn':
          return checkIn({ id: args.id, thoiDiem: args.thoiDiem, idNguoi });
        case 'checkOut':
          return checkOut({ id: args.id, thoiDiem: args.thoiDiem, idNguoi });
        case 'hoanTacCheckIn':
          return hoanTacCheckIn(args.id);
        case 'hoanTacCheckOut':
          return hoanTacCheckOut(args.id);
        case 'huy':
          return huyDkTq(args.id);
        case 'khoiPhuc':
          return khoiPhucDkTq(args.id);
      }
    },
    onSuccess: (_r, args) => {
      invalidate();
      toast.success(i18n.t(`dangKyThamQuan.toast.${args.action}Success`));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useCapNhatAnhDangKyThamQuan(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, urls }: { id: string; urls: string[] }) => capNhatAnh(id, urls),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyThamQuan.toast.anhSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}
