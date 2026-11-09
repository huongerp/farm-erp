/**
 * Hooks Phiếu checklist công đoạn — React Query. Đổi trạng thái qua RPC rpc_cl_*
 * (bọc trong `useHanhDongPhieu`); lưu kết quả dòng là UPDATE thường (trigger khoá quyền).
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { useAuthStore } from '../../../../store/useStore';
import type { DongPhieuChecklist } from '../core/types';
import type { PhieuChecklistListItem } from '../core/list-types';
import type { TaoPhieuFormValues } from '../core/schema';
import type { ChecklistBanGiaoListServerQuery } from '../services/checklist-ban-giao-list-query';
import {
  chuyenPhieu,
  createPhieu,
  deletePhieu,
  getDongByPhieu,
  getLichSuByPhieu,
  getMauChoChon,
  getPhieuById,
  getPhieuPage,
  getPhieuTomTat,
  huyPhieu,
  moLaiPhieu,
  nhanPhieu,
  traLaiPhieu,
  updateDongKiemTra,
  updateDongThucHien,
  updatePhieuKetLuan,
  updatePhieuThongTin,
  type LuuDongKiemTraInput,
  type LuuDongThucHienInput,
  type PhieuKetLuanInput,
  type PhieuThongTinInput,
} from '../services/checklist-ban-giao-service';

export const QUERY_KEY_CL = ['checklistBanGiao'] as const;

const onErr = (err: Error) => toast.error(err.message);

export function useChecklistBanGiaoPage(query: ChecklistBanGiaoListServerQuery, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_CL, 'page', query],
    queryFn: () => getPhieuPage(query),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
}

export function usePhieuById(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_CL, 'byId', id],
    queryFn: () => getPhieuById(id!),
    enabled: !!id,
  });
}

export function useDongByPhieu(idPhieu: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_CL, 'dong', idPhieu],
    queryFn: () => getDongByPhieu(idPhieu!),
    enabled: !!idPhieu && enabled,
  });
}

export function useLichSuByPhieu(idPhieu: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_CL, 'lichSu', idPhieu],
    queryFn: () => getLichSuByPhieu(idPhieu!),
    enabled: !!idPhieu && enabled,
  });
}

/** Toàn bộ phiếu vài cột — chip lọc trạng thái / mẫu (đếm trên toàn bộ). */
export function usePhieuTomTat(enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_CL, 'tomTat'],
    queryFn: getPhieuTomTat,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/** Mẫu đang dùng để tạo phiếu (loai ban_giao). */
export function useMauChoChon(enabled = true) {
  return useQuery({
    queryKey: [...QUERY_KEY_CL, 'mauChoChon'],
    queryFn: getMauChoChon,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEY_CL });
}

export function useCreatePhieu(onSuccess?: (phieu: PhieuChecklistListItem) => void) {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: TaoPhieuFormValues) => createPhieu(data),
    onSuccess: (row) => {
      invalidate();
      // Mồi sẵn cache chi tiết: vừa tạo xong, pageList chưa kịp có dòng mới nên nếu chỉ dựa vào
      // usePhieuById thì drawer phải chờ thêm một vòng mạng (hoặc không mở nếu query lỗi).
      qc.setQueryData([...QUERY_KEY_CL, 'byId', row.id], row);
      toast.success(i18n.t('checklistBanGiao.toast.taoSuccess'));
      onSuccess?.(row);
    },
    onError: onErr,
  });
}

/** Khoá query danh sách dòng của một phiếu — dùng cho cập nhật optimistic. */
const khoaDong = (idPhieu: string) => [...QUERY_KEY_CL, 'dong', idPhieu] as const;

/** Ghi đè một dòng trong cache danh sách dòng (giữ nguyên thứ tự). */
function suaDongTrongCache(
  qc: QueryClient,
  idPhieu: string,
  idDong: string,
  patch: Partial<DongPhieuChecklist>
): DongPhieuChecklist[] | undefined {
  const key = khoaDong(idPhieu);
  const cu = qc.getQueryData<DongPhieuChecklist[]>(key);
  if (!cu) return undefined;
  qc.setQueryData(
    key,
    cu.map((d) => (d.id === idDong ? { ...d, ...patch } : d))
  );
  return cu;
}

export function useUpdateThongTin(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuThongTinInput }) => updatePhieuThongTin(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('checklistBanGiao.toast.capNhatSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useUpdateKetLuan(onSuccess?: () => void) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuKetLuanInput }) => updatePhieuKetLuan(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('checklistBanGiao.toast.capNhatSuccess'));
      onSuccess?.();
    },
    onError: onErr,
  });
}

export function useDeletePhieu() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deletePhieu(id),
    onSuccess: () => {
      invalidate();
      toast.success(i18n.t('checklistBanGiao.toast.xoaSuccess'));
    },
    onError: onErr,
  });
}

/**
 * Lưu ô tích cột khâu làm — không toast riêng (bảng tự báo).
 * Cập nhật optimistic vào cache dòng để ô tích đổi ngay, KHÔNG refetch cả cây query (refetch
 * toàn bộ làm drawer nhảy vị trí cuộn). Lỗi thì trả lại dữ liệu cũ rồi mới đồng bộ server.
 */
export function useLuuDongThucHien() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<LuuDongThucHienInput, 'idPhieu'> & { idPhieu: string }) =>
      updateDongThucHien(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: khoaDong(input.idPhieu) });
      const truoc = suaDongTrongCache(qc, input.idPhieu, input.idDong, {
        kq_thuc_hien: input.kq_thuc_hien,
        tinh_trang_khac_phuc: input.tinh_trang_khac_phuc,
        nguoi_xu_ly: input.nguoi_xu_ly,
        ghi_chu: input.ghi_chu,
      });
      return { truoc };
    },
    // Chỉ làm mới phần đếm ở danh sách / tóm tắt; giữ nguyên cache dòng đang xem.
    onSuccess: (_data, input, ctx) => {
      // Chưa có cache dòng để sửa optimistic → buộc tải lại dòng của phiếu này.
      if (ctx?.truoc === undefined) qc.invalidateQueries({ queryKey: khoaDong(input.idPhieu) });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CL, predicate: (q) => q.queryKey[1] !== 'dong' });
    },
    onError: (err: Error, input, ctx) => {
      if (ctx?.truoc) qc.setQueryData(khoaDong(input.idPhieu), ctx.truoc);
      else qc.invalidateQueries({ queryKey: khoaDong(input.idPhieu) });
      onErr(err);
    },
  });
}

/** Lưu ô tích cột kiểm tra lại. */
export function useLuuDongKiemTra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<LuuDongKiemTraInput, 'idPhieu'> & { idPhieu: string }) =>
      updateDongKiemTra(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: khoaDong(input.idPhieu) });
      const truoc = suaDongTrongCache(qc, input.idPhieu, input.idDong, {
        kq_kiem_tra: input.kq_kiem_tra,
        ghi_chu_kiem_tra: input.ghi_chu_kiem_tra,
      });
      return { truoc };
    },
    onSuccess: (_data, input, ctx) => {
      if (ctx?.truoc === undefined) qc.invalidateQueries({ queryKey: khoaDong(input.idPhieu) });
      qc.invalidateQueries({ queryKey: QUERY_KEY_CL, predicate: (q) => q.queryKey[1] !== 'dong' });
    },
    onError: (err: Error, input, ctx) => {
      if (ctx?.truoc) qc.setQueryData(khoaDong(input.idPhieu), ctx.truoc);
      else qc.invalidateQueries({ queryKey: khoaDong(input.idPhieu) });
      onErr(err);
    },
  });
}

export type HanhDongPhieu = 'chuyen' | 'nhan' | 'traLai' | 'huy' | 'moLai';

export function useHanhDongPhieu() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ action, id, lyDo }: { action: HanhDongPhieu; id: string; lyDo?: string }) => {
      if (action === 'chuyen') return chuyenPhieu(id);
      if (action === 'nhan') return nhanPhieu(id);
      if (action === 'traLai') return traLaiPhieu(id, lyDo ?? '');
      if (action === 'huy') return huyPhieu(id, lyDo);
      return moLaiPhieu(id, lyDo ?? '');
    },
    onSuccess: (_r, { action }) => {
      invalidate();
      toast.success(i18n.t(`checklistBanGiao.toast.${action}Success`));
    },
    onError: (err: Error) => {
      invalidate();
      onErr(err);
    },
  });
}

/** NguoiDungCl cho máy trạng thái — id nhân viên = id user, chức vụ = id_chuc_vu. */
export function useNguoiDungCl() {
  const user = useAuthStore((s) => s.user);
  return { idNhanVien: user?.id ?? null, chucVuId: user?.id_chuc_vu ?? null };
}
