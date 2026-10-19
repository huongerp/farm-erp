import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getDonDatHangPage,
  getChiTietDonDatHangPage,
  getDonDatHangById,
  getDonDatHangByPhieuDeXuat,
  createDonDatHang,
  updateDonDatHang,
  updateDonDatHangTrangThai,
  updateDonDatHangTrangThaiMany,
  deleteDonDatHang,
  deleteDonDatHangMany,
  getPhanLoaiDonDatHangChiTiet,
  getNextSoPoFormatted,
} from '../services/don-dat-hang-service';
import type { DonDatHangListServerQuery } from '../services/don-dat-hang-list-query';
import type { DonDatHangFormValues } from '../core/schema';
import type { DonDatHang } from '../core/types';
import i18n from '../../../../lib/i18n';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import type { BranchListScope } from '../../../../lib/branch-scope-query';
import { donDatHangTrongPhamVi } from '../utils/don-dat-hang-view-scope-filter';

const QUERY_KEY = ['donDatHang'] as const;
const PHAN_LOAI_CHI_TIET_QUERY_KEY = [...QUERY_KEY, 'phanLoaiChiTiet'] as const;
/** Section đơn hàng trong drawer phiếu đề xuất vật tư — mutation đơn phải làm mới. */
const BY_PHIEU_DE_XUAT_QUERY_KEY = [...QUERY_KEY, 'byPhieuDeXuat'] as const;

/** Số PO tiếp theo khi tạo mới (format PO-YYYY-NNNNN). Chỉ gọi khi mở form tạo đơn (enabled = true). Có thể sửa mã trên form. */
export const useNextSoPoDonDatHang = (enabled: boolean) => {
  return useQuery({
    queryKey: [...QUERY_KEY, 'nextSoPo'],
    queryFn: getNextSoPoFormatted,
    enabled,
    staleTime: 0,
  });
};

export const usePhanLoaiDonDatHangChiTiet = () => {
  return useQuery({
    queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY,
    queryFn: getPhanLoaiDonDatHangChiTiet,
    staleTime: 1000 * 60 * 15,
  });
};

const DON_DAT_HANG_PAGE_SIZE = 50;
const CHI_TIET_DON_DAT_HANG_PAGE_SIZE = 100;

/** Danh sách đơn đặt hàng theo trang (server-side). `pageIndex` 0-based. */
export const useDonDatHangListPaged = (pageIndex: number, listQuery: DonDatHangListServerQuery, enabled = true) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'paged', pageIndex, DON_DAT_HANG_PAGE_SIZE, qPart] as const,
    queryFn: () => getDonDatHangPage(pageIndex, DON_DAT_HANG_PAGE_SIZE, listQuery),
    enabled,
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });
};

/** Chi tiết phẳng (mỗi dòng = một dòng hàng trên đơn), server-side. `pageIndex` 0-based. */
export const useChiTietDonDatHangListPaged = (
  pageIndex: number,
  listQuery: DonDatHangListServerQuery,
  enabled = true
) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'chiTietPaged', pageIndex, CHI_TIET_DON_DAT_HANG_PAGE_SIZE, qPart] as const,
    queryFn: () => getChiTietDonDatHangPage(pageIndex, CHI_TIET_DON_DAT_HANG_PAGE_SIZE, listQuery),
    enabled,
    staleTime: 1000 * 60 * 15,
    placeholderData: keepPreviousData,
  });
};

/**
 * Một đơn theo id (drawer, form sửa, trang in). Đơn ngoài phạm vi xem → null (như không tìm thấy).
 * queryKey giữ [donDatHang, id] để mutation setQueryData vẫn khớp; phạm vi áp ở `select`.
 */
export const useDonDatHangById = (
  id: string | undefined,
  phamVi: { scope: BranchListScope; isLoading: boolean }
) => {
  const { scope, isLoading: scopeLoading } = phamVi;
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getDonDatHangById(id!),
    enabled: !!id && !scopeLoading,
    select: (don) => (don && donDatHangTrongPhamVi(don, scope) ? don : null),
  });
};

/** Đơn lập từ một phiếu đề xuất vật tư, lọc theo phạm vi xem đơn (như useDonDatHangById). */
export const useDonDatHangByPhieuDeXuat = (
  idPhieuDeXuat: string | null,
  phamVi: { scope: BranchListScope; isLoading: boolean }
) => {
  const { scope, isLoading: scopeLoading } = phamVi;
  return useQuery({
    queryKey: [...BY_PHIEU_DE_XUAT_QUERY_KEY, idPhieuDeXuat],
    queryFn: () => getDonDatHangByPhieuDeXuat(idPhieuDeXuat!),
    enabled: !!idPhieuDeXuat && !scopeLoading,
    staleTime: 1000 * 60 * 2,
    select: (list) => list.filter((don) => donDatHangTrongPhamVi(don, scope)),
  });
};

export const useCreateDonDatHang = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DonDatHangFormValues) => createDonDatHang(data),
    onSuccess: (created) => {
      qc.setQueryData(QUERY_KEY, (old: DonDatHang[] | undefined) => (old ? [created, ...old] : [created]));
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: BY_PHIEU_DE_XUAT_QUERY_KEY });
      qc.invalidateQueries({ queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdateDonDatHang = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DonDatHangFormValues }) =>
      updateDonDatHang(id, data),
    onSuccess: (updated) => {
      qc.setQueryData(QUERY_KEY, (old: DonDatHang[] | undefined) =>
        old?.map((d) => (d.id === updated.id ? updated : d)) ?? [updated]
      );
      qc.setQueryData([...QUERY_KEY, updated.id], updated);
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: BY_PHIEU_DE_XUAT_QUERY_KEY });
      qc.invalidateQueries({ queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/** Duyệt / chuyển trạng thái PO — chỉ đổi trang_thai + ghi_chu, không đụng chi_tiet. */
export const useUpdateDonDatHangTrangThai = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      trangThai,
      ghiChu,
      notePrefix,
    }: {
      id: string;
      trangThai: DonDatHang['trang_thai'];
      ghiChu?: string;
      notePrefix?: string;
    }) => updateDonDatHangTrangThai(id, trangThai, { ghi_chu: ghiChu, notePrefix }),
    onSuccess: async (_void, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: BY_PHIEU_DE_XUAT_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/**
 * Duyệt / hủy hàng loạt. Lỗi một phần không làm hỏng cả lô: service trả danh sách thành công /
 * thất bại để toast báo rõ số đơn đã chạy.
 */
export const useUpdateDonDatHangTrangThaiMany = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      trangThai,
      ghiChu,
      notePrefix,
    }: {
      ids: string[];
      trangThai: DonDatHang['trang_thai'];
      ghiChu?: string;
      notePrefix?: string;
    }) => updateDonDatHangTrangThaiMany(ids, trangThai, { ghi_chu: ghiChu, notePrefix }),
    onSuccess: (result, { ids }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      result.okIds.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: BY_PHIEU_DE_XUAT_QUERY_KEY });

      if (result.failed.length === 0) {
        toast.success(i18n.t('donDatHang.toast.bulkApproveSuccess', { count: result.okIds.length }));
      } else {
        toast.warning(
          i18n.t('donDatHang.toast.bulkApprovePartial', {
            ok: result.okIds.length,
            total: ids.length,
            failed: result.failed.length,
          })
        );
        toast.error(result.failed[0].message);
      }
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDonDatHang = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDonDatHang,
    onSuccess: (_void, id) => {
      qc.setQueryData(QUERY_KEY, (old: DonDatHang[] | undefined) => old?.filter((d) => d.id !== id) ?? []);
      qc.removeQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: BY_PHIEU_DE_XUAT_QUERY_KEY });
      qc.invalidateQueries({ queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeleteDonDatHangMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDonDatHangMany,
    onSuccess: (_void, ids) => {
      const set = new Set(ids);
      qc.setQueryData(QUERY_KEY, (old: DonDatHang[] | undefined) => old?.filter((d) => !set.has(d.id)) ?? []);
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'chiTietPaged'] });
      qc.invalidateQueries({ queryKey: BY_PHIEU_DE_XUAT_QUERY_KEY });
      qc.invalidateQueries({ queryKey: PHAN_LOAI_CHI_TIET_QUERY_KEY });
      toast.success(i18n.t('donDatHang.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
