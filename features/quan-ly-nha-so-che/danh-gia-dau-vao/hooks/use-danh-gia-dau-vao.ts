import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import type { DgdvListServerQuery } from '../services/danh-gia-dau-vao-list-query';
import { fetchAllDgdvForListQuery, getDgdvById, getDgdvPage, getDgdvTheoTuan } from '../services/danh-gia-dau-vao-service';
import {
  createDgdvDb,
  deleteDgdvManyDb,
  deleteDongDb,
  getDgdvTomTatDb,
  luuDutDayDb,
  luuGhiChuLoDb,
  updateDgdvDb,
  updateDgdvTrangThaiManyDb,
  upsertDongDb,
} from '../services/danh-gia-dau-vao-db.service';
import type { DgdvFormValues } from '../core/schema';
import type { DgdvPhieuDayDu, TrangThaiDgdvPhieu } from '../core/types';
import { cacTuanTrongKhoang } from '../utils/khoang-ngay';
import {
  apDutDayVaoPhieu,
  apGhiChuLoVaoPhieu,
  apOVaoPhieu,
  apVaoDuLieuCache,
  laORong,
  type DgdvGiaTriO,
  type DgdvKhoaO,
} from '../utils/cap-nhat-luoi';

export const QUERY_KEY_DGDV = ['danhGiaDauVao'] as const;

export { fetchAllDgdvForListQuery };

/** Một trang danh sách — lọc / sắp xếp / phân trang ở PostgREST. */
export function useDgdvPage(query: DgdvListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DGDV, 'page', query],
    queryFn: () => getDgdvPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2,
  });
}

/** Tóm tắt toàn bộ phiếu trong phạm vi: chip lọc, gợi ý chi nhánh, chặn trùng tuần. */
export function useDgdvTomTat(viewAll: boolean, allowedBranchIds: string[], enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DGDV, 'tomTat', viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getDgdvTomTatDb(viewAll, allowedBranchIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDgdvById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_DGDV, 'full', id],
    queryFn: () => getDgdvById(id!),
    enabled: !!id,
  });
}

/** Phiếu đầy đủ của mọi tuần phủ khoảng ngày (một chi nhánh hoặc cả phạm vi khi `idChiNhanh` rỗng). */
export function useDgdvTheoKhoang(
  tu: string,
  den: string,
  idChiNhanh: string | null,
  viewAll: boolean,
  allowedBranchIds: string[],
  enabled = true
) {
  return useQuery({
    queryKey: [...QUERY_KEY_DGDV, 'khoang', tu, den, idChiNhanh, viewAll, [...allowedBranchIds].sort().join(',')],
    queryFn: () => getDgdvTheoTuan(cacTuanTrongKhoang(tu, den), idChiNhanh, viewAll, allowedBranchIds),
    enabled: enabled && !!tu && !!den,
    staleTime: 1000 * 30,
  });
}

/** Thêm / sửa phiếu (đầu phiếu + cột dây + lô). */
export function useLuuDgdv(onSuccess?: (id: string) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string | null; data: DgdvFormValues }) => {
      if (id) {
        await updateDgdvDb(id, data);
        return id;
      }
      return createDgdvDb(data);
    },
    onSuccess: (id, { id: idCu }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DGDV });
      toast.success(i18n.t(idCu ? 'danhGiaDauVao.toast.updateSuccess' : 'danhGiaDauVao.toast.createSuccess'));
      onSuccess?.(id);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDgdvMany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDgdvManyDb,
    onSuccess: (_v, ids) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DGDV });
      toast.success(i18n.t(ids.length > 1 ? 'danhGiaDauVao.toast.deleteManySuccess' : 'danhGiaDauVao.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Khoá / mở khoá (một hoặc nhiều phiếu) — một UPDATE ... IN. */
export function useUpdateDgdvTrangThai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, trang_thai }: { ids: string[]; trang_thai: TrangThaiDgdvPhieu }) =>
      updateDgdvTrangThaiManyDb(ids, trang_thai),
    onSuccess: (_v, { ids }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_DGDV });
      toast.success(i18n.t('danhGiaDauVao.toast.trangThaiUpdated', { count: ids.length }));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ---- Tự lưu lưới -------------------------------------------------------------------

/** Áp thay đổi vào mọi phiếu đang cache (bảng đánh giá + chi tiết) — số tự cộng ngay. */
function apVaoCache(qc: QueryClient, fn: (p: DgdvPhieuDayDu) => DgdvPhieuDayDu) {
  qc.setQueriesData({ queryKey: [...QUERY_KEY_DGDV, 'khoang'] }, (d: unknown) => apVaoDuLieuCache(d, fn));
  qc.setQueriesData({ queryKey: [...QUERY_KEY_DGDV, 'full'] }, (d: unknown) => apVaoDuLieuCache(d, fn));
  // Tổng thu cả tuần ở danh sách: đánh dấu cũ, tải lại khi quay về danh sách.
  qc.invalidateQueries({ queryKey: [...QUERY_KEY_DGDV, 'page'], refetchType: 'none' });
}

/** Lưu một ô lưới: ô trống hết → xoá dòng; còn lại upsert theo khoá ô. */
export function useLuuODgdv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ khoa, gt }: { khoa: DgdvKhoaO; gt: DgdvGiaTriO }) => {
      if (laORong(gt)) {
        await deleteDongDb(khoa);
        return { khoa, dong: null };
      }
      const dong = await upsertDongDb({
        ...khoa,
        ...gt,
        danh_gia: gt.danh_gia?.trim() || null,
        ly_do_loi: gt.ly_do_loi?.trim() || null,
      });
      return { khoa, dong };
    },
    onSuccess: ({ khoa, dong }) => apVaoCache(qc, (p) => apOVaoPhieu(p, khoa, dong)),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useLuuDutDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ idPhieuLo, ngay, dutDay }: { idPhieuLo: string; ngay: string; dutDay: number }) => ({
      idPhieuLo,
      ngay,
      row: await luuDutDayDb(idPhieuLo, ngay, dutDay),
    }),
    onSuccess: ({ idPhieuLo, ngay, row }) => apVaoCache(qc, (p) => apDutDayVaoPhieu(p, idPhieuLo, ngay, row)),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useLuuGhiChuLo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ idPhieuLo, ghiChu }: { idPhieuLo: string; ghiChu: string | null }) => {
      await luuGhiChuLoDb(idPhieuLo, ghiChu);
      return { idPhieuLo, ghiChu };
    },
    onSuccess: ({ idPhieuLo, ghiChu }) => apVaoCache(qc, (p) => apGhiChuLoVaoPhieu(p, idPhieuLo, ghiChu)),
    onError: (err: Error) => toast.error(err.message),
  });
}
