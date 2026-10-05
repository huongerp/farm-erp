import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import type { DangKyNhanHangFormValues } from '../core/schema';
import type { DangKyNhanHangListServerQuery } from '../services/dang-ky-nhan-hang-list-query';
import {
  capNhatAnh,
  checkIn,
  checkOut,
  createDkNh,
  deleteDkNh,
  deleteDkNhMany,
  fetchAllDkNhForListQuery,
  getChiTiet,
  getDkNhById,
  getDkNhPage,
  getDkNhTomTat,
  getTongHangHoaTheoPhieu,
  hoanTacCheckIn,
  hoanTacCheckOut,
  hoanTacDongCuoi,
  huyDkNh,
  khoiPhucDkNh,
  updateDkNh,
  xoaDongHang,
  type CheckInOutInput,
} from '../services/dang-ky-nhan-hang-service';

export const QUERY_KEY_DKNH = ['dangKyNhanHang'] as const;

const onErr = (err: Error) => toast.error(err.message);

export function useDangKyNhanHangPage(query: DangKyNhanHangListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKNH, 'page', query],
    queryFn: () => getDkNhPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}

export function useDangKyNhanHangTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKNH, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getDkNhTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDangKyNhanHangById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKNH, 'byId', id],
    queryFn: () => getDkNhById(id!),
    enabled: !!id,
  });
}

export function useDangKyNhanHangChiTiet(idPhieu: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKNH, 'chiTiet', idPhieu],
    queryFn: () => getChiTiet(idPhieu!),
    enabled: !!idPhieu,
  });
}

/** Tab Thống kê: phiếu trong khoảng ngày + tổng hàng hoá của các phiếu đó. */
export function useDangKyNhanHangThongKe(query: DangKyNhanHangListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKNH, 'thongKe', query],
    queryFn: async () => {
      const phieu = await fetchAllDkNhForListQuery(query);
      const tong = await getTongHangHoaTheoPhieu(phieu.map((p) => p.id));
      return { phieu, tong };
    },
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY_DKNH });
}

export function useCreateDangKyNhanHang(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (data: DangKyNhanHangFormValues) => createDkNh(data, user?.id ? String(user.id) : null),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyNhanHang.toast.createSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useUpdateDangKyNhanHang(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DangKyNhanHangFormValues }) => updateDkNh(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyNhanHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDeleteDangKyNhanHang() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteDkNh,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyNhanHang.toast.deleteSuccess'));
    },
    onError: onErr,
  });
}

export function useDeleteDangKyNhanHangMany() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteDkNhMany,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyNhanHang.toast.deleteManySuccess'));
    },
    onError: onErr,
  });
}

export type HanhDongTrangThai = 'checkIn' | 'checkOut' | 'hoanTacCheckIn' | 'hoanTacCheckOut' | 'huy' | 'khoiPhuc';

/** Mọi bước chuyển trạng thái (check in/out, hoàn tác, huỷ, khôi phục) qua một mutation. */
export function useChuyenTrangThaiDangKyNhanHang(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (
      args:
        | { action: 'checkIn' | 'checkOut'; input: Omit<CheckInOutInput, 'idNguoi'> }
        | { action: Exclude<HanhDongTrangThai, 'checkIn' | 'checkOut'>; id: string }
    ) => {
      const idNguoi = user?.id ? String(user.id) : null;
      switch (args.action) {
        case 'checkIn':
          return checkIn({ ...args.input, idNguoi });
        case 'checkOut':
          return checkOut({ ...args.input, idNguoi });
        case 'hoanTacCheckIn':
          return hoanTacCheckIn(args.id);
        case 'hoanTacCheckOut':
          return hoanTacCheckOut(args.id);
        case 'huy':
          return huyDkNh(args.id);
        case 'khoiPhuc':
          return khoiPhucDkNh(args.id);
      }
    },
    onSuccess: (_r, args) => {
      invalidate();
      toast.success(i18n.t(`dangKyNhanHang.toast.${args.action}Success`));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useCapNhatAnhDangKyNhanHang(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, urls }: { id: string; urls: string[] }) => capNhatAnh(id, urls),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyNhanHang.toast.anhSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useXoaDongHang() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (ids: string[]) => xoaDongHang(ids),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('dangKyNhanHang.toast.xoaDongSuccess'));
    },
    onError: onErr,
  });
}

export function useHoanTacDongCuoi() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (idPhieu: string) => hoanTacDongCuoi(idPhieu),
    onSuccess: (ok) => {
      invalidate();
      if (ok) toast.success(i18n.t('dangKyNhanHang.toast.hoanTacDongSuccess'));
      else toast.info(i18n.t('dangKyNhanHang.hangHoa.empty'));
    },
    onError: onErr,
  });
}
