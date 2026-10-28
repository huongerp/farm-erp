import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import type { DgdvListServerQuery } from '../services/danh-gia-dau-vao-list-query';
import { fetchAllDgdvForListQuery, getDgdvById, getDgdvPage, getDgdvTheoKhoangNgay } from '../services/danh-gia-dau-vao-service';
import {
  createDgdvDb,
  deleteDgdvManyDb,
  deleteDongDb,
  getDgdvTomTatDb,
  getPhieuChuyenTruocDb,
  layChuyenKeTiep,
  luuDutDayDb,
  updateDgdvDb,
  updateDgdvTrangThaiManyDb,
  upsertDongDb,
} from '../services/danh-gia-dau-vao-db.service';
import type { DgdvFormValues } from '../core/schema';
import type { DgdvPhieuDayDu, TrangThaiDgdvPhieu } from '../core/types';
import {
  keHoachLuuDong,
  keHoachXoaDong,
  type DgdvDongInput,
  type DgdvDongPhang,
  type DgdvThaoTacGhi,
} from '../core/chi-tiet-dong';

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

/** Tóm tắt toàn bộ phiếu trong phạm vi: chip lọc, gợi ý chi nhánh, chặn trùng chuyến. */
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

/** Phiếu đầy đủ (mọi chuyến) có ngày trong khoảng (một chi nhánh hoặc cả phạm vi khi `idChiNhanh` rỗng). */
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
    queryFn: () => getDgdvTheoKhoangNgay(tu, den, idChiNhanh, viewAll, allowedBranchIds),
    enabled: enabled && !!tu && !!den,
    staleTime: 1000 * 30,
  });
}

/** Số chuyến kế tiếp của (ngày, chi nhánh) — gợi ý khi tạo phiếu. Chưa đủ ngày / chi nhánh → không gọi. */
export function useDgdvChuyenKeTiep(ngay: string | null | undefined, idChiNhanh: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_DGDV, 'chuyenKeTiep', ngay ?? '', idChiNhanh ?? ''],
    queryFn: () => layChuyenKeTiep(ngay!, idChiNhanh!),
    enabled: enabled && !!ngay && !!idChiNhanh,
    staleTime: 1000 * 10,
  });
}

/** Chép dây & lô từ chuyến trước: gọi khi bấm nút (không tự tải), xem `getPhieuChuyenTruocDb`. */
export function useLayPhieuChuyenTruoc() {
  return useMutation({
    mutationFn: ({ ngay, chuyen, idChiNhanh, boQuaId }: { ngay: string; chuyen: number; idChiNhanh: string; boQuaId: string | null }) =>
      getPhieuChuyenTruocDb(ngay, chuyen, idChiNhanh, boQuaId),
    onError: (err: Error) => toast.error(err.message),
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

// ---- Dòng chi tiết đánh giá ------------------------------------------------------------

async function chayThaoTac(ops: DgdvThaoTacGhi[]): Promise<void> {
  // Tuần tự: xoá dòng cũ trước khi ghi dòng mới (đổi lô / dây / ngày).
  for (const op of ops) {
    if (op.op === 'xoaDong') await deleteDongDb(op.khoa);
    else if (op.op === 'ghiDong') await upsertDongDb({ ...op.khoa, ...op.gt });
    else await luuDutDayDb(op.id_phieu_lo, op.ngay, op.dutDay);
  }
}

function lamMoiSauGhiDong(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: [...QUERY_KEY_DGDV, 'full'] });
  qc.invalidateQueries({ queryKey: [...QUERY_KEY_DGDV, 'khoang'] });
  qc.invalidateQueries({ queryKey: [...QUERY_KEY_DGDV, 'tongNgayDay'] });
  qc.invalidateQueries({ queryKey: [...QUERY_KEY_DGDV, 'tongChuyen'] });
  // Tổng thu của chuyến ở danh sách: đánh dấu cũ, tải lại khi quay về danh sách.
  qc.invalidateQueries({ queryKey: [...QUERY_KEY_DGDV, 'page'], refetchType: 'none' });
}

/** Thêm (cu = null) / sửa một dòng chi tiết — kế hoạch ghi ở core/chi-tiet-dong. */
export function useLuuDongDgdv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ phieu, cu, moi }: { phieu: DgdvPhieuDayDu; cu: DgdvDongPhang | null; moi: DgdvDongInput }) =>
      chayThaoTac(keHoachLuuDong(phieu, cu, moi)),
    onSuccess: (_v, { cu }) => {
      lamMoiSauGhiDong(qc);
      toast.success(i18n.t(cu ? 'danhGiaDauVao.chiTiet.daSua' : 'danhGiaDauVao.chiTiet.daThem'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/**
 * Lưu cả một lô («Nhập theo lô»): chạy các bước của `keHoachLuuCaLo` (core/chi-tiet-dong) qua đúng đường ghi
 * từng dòng như `useLuuDongDgdv` — xoá / ghi ô, đặt đứt dây.
 */
export function useLuuCaLoDgdv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ops: DgdvThaoTacGhi[]) => chayThaoTac(ops),
    onSuccess: (_v, ops) => {
      lamMoiSauGhiDong(qc);
      toast.success(i18n.t('danhGiaDauVao.nhapLo.daLuu', { n: ops.length }));
    },
    onError: (err: Error) => {
      // Ghi dở giữa chừng: tải lại để bảng nhập thấy đúng số đã vào DB.
      lamMoiSauGhiDong(qc);
      toast.error(err.message);
    },
  });
}

export function useXoaDongDgdv() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cu: DgdvDongPhang) => chayThaoTac(keHoachXoaDong(cu)),
    onSuccess: () => {
      lamMoiSauGhiDong(qc);
      toast.success(i18n.t('danhGiaDauVao.chiTiet.daXoa'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
