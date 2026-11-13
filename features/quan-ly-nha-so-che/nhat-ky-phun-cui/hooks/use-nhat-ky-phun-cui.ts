import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { BIEN_THE_SO_CHE } from '../../kho-bien-the/bien-the';
import { getFarmHangHoaRef } from '../../hang-hoa-phan-thuoc/services/farm-hang-hoa-service';
import type { DinhMucFormValues, NhatKyFormValues } from '../core/schema';
import type { NhatKyPhunCuiListServerQuery } from '../services/nhat-ky-phun-cui-list-query';
import {
  deleteNhatKy,
  deleteNhatKyMany,
  doiDangDungDinhMuc,
  getDinhMuc,
  getNhatKyById,
  getNhatKyPage,
  getNhatKyTomTat,
  luuDinhMuc,
  luuNhatKy,
} from '../services/nhat-ky-phun-cui-service';

export const QUERY_KEY_NKPC = ['nhatKyPhunCui'] as const;

const onErr = (err: Error) => toast.error(err.message);

export function useNhatKyPhunCuiPage(query: NhatKyPhunCuiListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPC, 'page', query],
    queryFn: () => getNhatKyPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60,
  });
}

export function useNhatKyPhunCuiTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPC, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getNhatKyTomTat(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNhatKyPhunCuiById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPC, 'byId', id],
    queryFn: () => getNhatKyById(id!),
    enabled: !!id,
  });
}

/** Hàng hoá kho Sơ chế (fp_farm_danh_sach_hang_hoa) — ô chọn thuốc; ref có cache TTL dùng chung với các module kho. */
export function useHangHoaThuoc() {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPC, 'hangHoa'],
    queryFn: () => getFarmHangHoaRef(BIEN_THE_SO_CHE),
    staleTime: 1000 * 60 * 15,
  });
}

/** Định mức thuốc: một NSC, hoặc mọi NSC trong phạm vi xem khi `idChiNhanh` rỗng. */
export function useDinhMucThuoc(
  idChiNhanh: string | null,
  viewAll: boolean,
  allowedBranchIds: string[],
  enabled = true
) {
  return useQuery({
    queryKey: [...QUERY_KEY_NKPC, 'dinhMuc', idChiNhanh ?? '', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getDinhMuc(idChiNhanh, viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY_NKPC });
}

export function useLuuNhatKyPhunCui(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: NhatKyFormValues }) => luuNhatKy(id, data),
    onSuccess: (_r, { id }) => {
      invalidate();
      toast.success(i18n.t(id ? 'nkpc.toast.updateSuccess' : 'nkpc.toast.createSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDeleteNhatKyPhunCui() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteNhatKy,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('nkpc.toast.deleteSuccess'));
    },
    onError: onErr,
  });
}

export function useDeleteNhatKyPhunCuiMany() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: deleteNhatKyMany,
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('nkpc.toast.deleteManySuccess'));
    },
    onError: onErr,
  });
}

export function useLuuDinhMuc(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: DinhMucFormValues }) => luuDinhMuc(id, data),
    onSuccess: (_r, { id }) => {
      invalidate();
      toast.success(i18n.t(id ? 'nkpc.toast.dinhMucUpdateSuccess' : 'nkpc.toast.dinhMucCreateSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDoiDangDungDinhMuc() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, dangDung }: { id: string; dangDung: boolean }) => doiDangDungDinhMuc(id, dangDung),
    onSuccess: (_r, { dangDung }) => {
      invalidate();
      toast.success(i18n.t(dangDung ? 'nkpc.toast.batDungSuccess' : 'nkpc.toast.ngungDungSuccess'));
    },
    onError: onErr,
  });
}
