import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPhieuKhoPTById,
  getPhieuKhoPTByDeXuatIds,
  getPhieuKhoPTPage,
  getChiTietPhieuKhoPTPage,
  createPhieuKhoPT,
  updatePhieuKhoPT,
  deletePhieuKhoPT,
  deletePhieuKhoPTMany,
  getNextSoPhieuFarmPt,
  updatePhieuKhoPTTrangThai,
  updatePhieuKhoPTTrangThaiMany,
  importPhieuKhoPT,
} from '../services/phieu-kho-pt-service';
import type { ChiTietPhieuKhoPTListServerQuery, PhieuKhoPTListServerQuery } from '../services/phieu-kho-pt-list-query';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import type { PhieuKhoPTFormValues } from '../core/schema';
import type { LoaiPhieuKhoPT } from '../core/types';
import i18n from '../../../../lib/i18n';
import { FARM_TON_KHO_PT_QUERY_KEY } from '../../ton-kho-phan-thuoc/hooks/use-farm-ton-kho-pt';

const QUERY_KEY = ['phieuKhoPhanThuoc'] as const;
const QUERY_KEY_CHI_TIET = ['phieuKhoPhanThuoc', 'chiTiet'] as const;

const PHIEU_KHO_PT_PAGE_SIZE = 50;
const CHI_TIET_PAGE_SIZE = 100;

/** Phiếu kho đã sinh từ các đề xuất mua hàng — dùng ở module Đề xuất để chặn tạo trùng. */
export const usePhieuKhoPTByDeXuat = (deXuatIds: string[]) => {
  const ids = [...new Set(deXuatIds.filter(Boolean))].sort();
  return useQuery({
    queryKey: [...QUERY_KEY, 'byDeXuat', ids] as const,
    queryFn: () => getPhieuKhoPTByDeXuatIds(ids),
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 2,
  });
};

export const usePhieuKhoPTListPaged = (pageIndex: number, listQuery: PhieuKhoPTListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY, 'paged', pageIndex, PHIEU_KHO_PT_PAGE_SIZE, qPart] as const,
    queryFn: () => getPhieuKhoPTPage(pageIndex, PHIEU_KHO_PT_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
};

export const useChiTietPhieuKhoPTPaged = (pageIndex: number, listQuery: ChiTietPhieuKhoPTListServerQuery) => {
  const qPart = stableListQueryKeyPart(listQuery);
  return useQuery({
    queryKey: [...QUERY_KEY_CHI_TIET, 'paged', pageIndex, CHI_TIET_PAGE_SIZE, qPart] as const,
    queryFn: () => getChiTietPhieuKhoPTPage(pageIndex, CHI_TIET_PAGE_SIZE, listQuery),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
};

export const usePhieuKhoPTById = (id: string | undefined) => {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => getPhieuKhoPTById(id!),
    enabled: !!id,
  });
};

export const useNextSoPhieuFarmPtQuery = (loai: LoaiPhieuKhoPT | undefined, enabled: boolean) => {
  return useQuery({
    queryKey: ['phieuKhoPhanThuoc', 'nextSoPhieu', loai],
    queryFn: () => getNextSoPhieuFarmPt(loai!),
    enabled: enabled && !!loai,
    staleTime: 0,
  });
};

export const useCreatePhieuKhoPT = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PhieuKhoPTFormValues) => createPhieuKhoPT(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      // Badge "Đã tạo phiếu kho" ở module Đề xuất mua hàng đọc từ query này.
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'byDeXuat'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.createSuccess'));
      // Tồn âm chỉ cảnh báo — phiếu đã lưu.
      if (result.canhBaoTon) toast.warning(result.canhBaoTon, { duration: 8000 });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/** Import Excel: lỗi từng dòng trả về trong `errors` (ImportDialog hiển thị) — không toast lỗi ở đây. */
export const useImportPhieuKhoPT = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, nguoiTao }: { rows: Record<string, unknown>[]; nguoiTao: { id: number | null; ten: string | null } }) =>
      importPhieuKhoPT(rows, nguoiTao),
    onSuccess: (result) => {
      if (result.created === 0) return;
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
    },
  });
};

export const useUpdatePhieuKhoPT = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuKhoPTFormValues }) => updatePhieuKhoPT(id, data),
    onSuccess: (result) => {
      qc.setQueryData([...QUERY_KEY, result.phieu.id], result.phieu);
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.updateSuccess'));
      if (result.canhBaoTon) toast.warning(result.canhBaoTon, { duration: 8000 });
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useDeletePhieuKhoPT = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuKhoPT,
    onSuccess: (_void, id) => {
      qc.removeQueries({ queryKey: [...QUERY_KEY, id] });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'byDeXuat'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export const useUpdatePhieuKhoPTTrangThai = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      trang_thai,
      ghi_chu,
      id_nguoi_duyet,
      ten_nguoi_duyet_hien_thi,
    }: {
      id: string;
      trang_thai: import('../core/types').TrangThaiPhieuKhoPT;
      ghi_chu?: string;
      id_nguoi_duyet?: number | null;
      ten_nguoi_duyet_hien_thi?: string;
    }) =>
      updatePhieuKhoPTTrangThai(id, trang_thai, {
        ghi_chu,
        id_nguoi_duyet,
        ten_nguoi_duyet_hien_thi,
      }),
    onSuccess: async (_void, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      try {
        const fresh = await getPhieuKhoPTById(id);
        if (fresh) {
          qc.setQueryData([...QUERY_KEY, id], fresh);
        }
      } catch {
        qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      }
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

/**
 * Duyệt hàng loạt. Không refetch từng phiếu như bản lẻ (N request thừa) — chỉ bỏ cache chi tiết.
 * Lỗi một phần không làm hỏng cả lô: service trả danh sách thành công/thất bại để toast báo rõ.
 */
export const useUpdatePhieuKhoPTTrangThaiMany = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      trang_thai,
      ghi_chu,
      id_nguoi_duyet,
      ten_nguoi_duyet_hien_thi,
    }: {
      ids: string[];
      trang_thai: import('../core/types').TrangThaiPhieuKhoPT;
      ghi_chu?: string;
      id_nguoi_duyet?: number | null;
      ten_nguoi_duyet_hien_thi?: string;
    }) =>
      updatePhieuKhoPTTrangThaiMany(ids, trang_thai, {
        ghi_chu,
        id_nguoi_duyet,
        ten_nguoi_duyet_hien_thi,
      }),
    onSuccess: (result, { ids }) => {
      result.okIds.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });

      if (result.failed.length === 0) {
        toast.success(
          i18n.t('phieuKhoPhanThuoc.toast.bulkApproveSuccess', { count: result.okIds.length })
        );
      } else {
        toast.warning(
          i18n.t('phieuKhoPhanThuoc.toast.bulkApprovePartial', {
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

export const useDeletePhieuKhoPTMany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhieuKhoPTMany,
    onSuccess: (_void, ids) => {
      ids.forEach((id) => qc.removeQueries({ queryKey: [...QUERY_KEY, id] }));
      qc.invalidateQueries({ queryKey: QUERY_KEY_CHI_TIET });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_CHI_TIET, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'paged'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, 'byDeXuat'] });
      qc.invalidateQueries({ queryKey: FARM_TON_KHO_PT_QUERY_KEY });
      toast.success(i18n.t('phieuKhoPhanThuoc.toast.deleteSuccess'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
};

export { QUERY_KEY as PHIEU_KHO_PT_QUERY_KEY, QUERY_KEY_CHI_TIET as PHIEU_KHO_PT_CHI_TIET_QUERY_KEY };
