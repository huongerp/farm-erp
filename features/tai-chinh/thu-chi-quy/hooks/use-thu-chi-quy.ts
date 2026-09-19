import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { stableListQueryKeyPart } from '../../../../lib/list-query-key';
import {
  getThuChiQuyPage,
  getThuChiQuyById,
  getThuChiQuyByChungTu,
  getPhieuGanNhatCuaToi,
  getQuySoDu,
  getChungTuRefList,
  createThuChiQuy,
  updateThuChiQuy,
  deleteThuChiQuyList,
  khoaThuChiQuy,
  xinMoThuChiQuy,
  xuLyMoThuChiQuy,
} from '../services/thu-chi-quy-service';
import { PAGE_SIZE } from '../core/constants';
import type { ThuChiQuyListServerQuery } from '../services/thu-chi-quy-list-query';
import type { XinMoThuChiQuyExtra, XuLyMoThuChiQuyExtra } from '../services/thu-chi-quy-service';
import type { ThuChiQuyFormValues } from '../core/schema';
import type { ThuChiNguon } from '../core/types';

export const THU_CHI_QUY_QUERY_KEY = ['thuChiQuy'] as const;

interface PayloadExtra {
  tenChiNhanh?: string | null;
  tenHangMuc?: string | null;
  idNguoiTao?: string | null;
  tenNguoiTao?: string | null;
}

/**
 * Một trang sổ quỹ (server-side). `enabled` phải chờ phạm vi xem tải xong,
 * nếu không sẽ nháy dữ liệu sai phạm vi.
 */
export const useThuChiQuyPage = (
  pageIndex: number,
  query: ThuChiQuyListServerQuery,
  enabled = true
) =>
  useQuery({
    queryKey: [...THU_CHI_QUY_QUERY_KEY, 'paged', pageIndex, PAGE_SIZE, stableListQueryKeyPart(query)],
    queryFn: () => getThuChiQuyPage(pageIndex, PAGE_SIZE, query),
    enabled,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

export const useThuChiQuyById = (id: string | null) =>
  useQuery({
    queryKey: [...THU_CHI_QUY_QUERY_KEY, id],
    queryFn: () => getThuChiQuyById(id!),
    enabled: !!id,
  });

/** Phiếu quỹ gắn với một chứng từ nguồn — dùng cho section trong 3 drawer. */
export const useThuChiQuyByChungTu = (loai: ThuChiNguon | null, id: string | null) =>
  useQuery({
    queryKey: [...THU_CHI_QUY_QUERY_KEY, 'byChungTu', loai, id],
    queryFn: () => getThuChiQuyByChungTu(loai!, id!),
    enabled: !!loai && !!id,
    staleTime: 1000 * 60 * 2,
  });

/**
 * Phiếu gần nhất của chính mình — nguồn gợi ý farm + hạng mục cho form tạo mới.
 * Cache ngắn: nhập xong phiếu này thì phiếu sau gợi ý theo phiếu vừa nhập.
 */
export const usePhieuGanNhatCuaToi = (idNguoiTao: string | null) =>
  useQuery({
    queryKey: [...THU_CHI_QUY_QUERY_KEY, 'ganNhatCuaToi', idNguoiTao],
    queryFn: () => getPhieuGanNhatCuaToi(idNguoiTao!),
    enabled: !!idNguoiTao,
    staleTime: 1000 * 30,
  });

/** Danh sách phiếu nguồn để chọn liên kết trong form (theo module đã chọn). */
export const useChungTuRefList = (loai: ThuChiNguon | null, search = '') =>
  useQuery({
    queryKey: [...THU_CHI_QUY_QUERY_KEY, 'chungTuRef', loai, search],
    queryFn: () => getChungTuRefList(loai!, search),
    enabled: !!loai,
    staleTime: 1000 * 60 * 2,
  });

/** Số dư quỹ hiện tại theo chi nhánh (null = mọi chi nhánh). */
export const useQuySoDu = (chiNhanhIds: number[] | null, enabled = true) =>
  useQuery({
    queryKey: [...THU_CHI_QUY_QUERY_KEY, 'soDu', stableListQueryKeyPart(chiNhanhIds)],
    queryFn: () => getQuySoDu(chiNhanhIds),
    enabled,
    staleTime: 1000 * 60 * 5,
  });

/**
 * Sửa/xóa một phiếu làm đổi tồn quỹ của NHIỀU dòng khác ⇒ luôn invalidate theo
 * prefix, không vá cache tại chỗ bằng setQueryData.
 */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: THU_CHI_QUY_QUERY_KEY });
}

export const useCreateThuChiQuy = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, extra }: { data: ThuChiQuyFormValues; extra?: PayloadExtra }) =>
      createThuChiQuy(data, extra),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(i18n.t('thuChiQuy.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useUpdateThuChiQuy = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data, extra }: { id: string; data: ThuChiQuyFormValues; extra?: PayloadExtra }) =>
      updateThuChiQuy(id, data, extra),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(i18n.t('thuChiQuy.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useDeleteThuChiQuy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteThuChiQuyList(ids),
    onSuccess: (_d, ids) => {
      invalidateAll(qc);
      toast.success(i18n.t('thuChiQuy.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

/* ------------------------------------------------------------------ */
/* Khoá / mở khoá                                                      */
/* ------------------------------------------------------------------ */

export const useKhoaThuChiQuy = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => khoaThuChiQuy(id),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(i18n.t('thuChiQuy.toast.khoaSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useXinMoThuChiQuy = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, extra }: { id: string; extra: XinMoThuChiQuyExtra }) => xinMoThuChiQuy(id, extra),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success(i18n.t('thuChiQuy.toast.xinMoSuccess'));
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};

export const useXuLyMoThuChiQuy = (onSuccess?: () => void) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, extra }: { id: string; extra: XuLyMoThuChiQuyExtra }) => xuLyMoThuChiQuy(id, extra),
    onSuccess: (_d, { extra }) => {
      invalidateAll(qc);
      toast.success(
        i18n.t(extra.duyet ? 'thuChiQuy.toast.moSuccess' : 'thuChiQuy.toast.tuChoiMoSuccess')
      );
      onSuccess?.();
    },
    onError: (e: unknown) => toast.error((e as Error).message),
  });
};
