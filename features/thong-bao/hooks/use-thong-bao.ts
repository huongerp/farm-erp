/**
 * React Query cho thông báo.
 *
 * Hai điểm khác mặt bằng chung của repo, đều có lý do:
 *  - Đây là chỗ DUY NHẤT dùng `refetchInterval`. PostgREST không có realtime
 *    (lib/db.ts dùng postgrest-js thuần, không websocket) nên badge phải tự hỏi
 *    lại. Push mới là kênh tức thời; polling chỉ để đồng bộ khi tab đang mở.
 *  - Tách hẳn query đếm badge khỏi query danh sách. Query đếm gọi với
 *    `head: true` nên gần như không tốn băng thông, còn danh sách chỉ tải khi
 *    người dùng mở panel. Repo tối ưu egress rất kỹ (docs/EGRESS_OPTIMIZATION.md).
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../lib/i18n';
import { useAuthStore } from '../../../store/useStore';
import {
  demChuaDoc,
  demChuaDocTheoModule,
  layDanhSach,
  danhDauDaDoc,
  xoaMot,
  hoanTacXoa,
  docTatCa,
  xoaTatCa,
  layCaiDat,
  luuCaiDat,
  layTuyChon,
  luuTuyChon,
  layThietBi,
  xoaThietBi,
  type BoLocThongBao,
} from '../services/thong-bao-service';
import type { DemTheoModule, ThongBao, TrangThongBao, TuyChonThongBao } from '../core/types';
import {
  suaTrang,
  danhDauDaDoc as danhDauDaDocTrongCache,
  boKhoiDanhSach,
  giamDemTheoModule,
} from '../core/cap-nhat-cache';

export const THONG_BAO_KEY = ['thongBao'] as const;
export const THONG_BAO_DEM_KEY = [...THONG_BAO_KEY, 'dem'] as const;
export const THONG_BAO_CAI_DAT_KEY = [...THONG_BAO_KEY, 'caiDat'] as const;
export const THONG_BAO_THIET_BI_KEY = [...THONG_BAO_KEY, 'thietBi'] as const;

/** Nhịp hỏi lại badge khi tab đang mở. Đủ nhanh để thấy kịp, đủ chậm để không tốn egress. */
const NHIP_DEM_MS = 60_000;

export function useDemChuaDoc() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: THONG_BAO_DEM_KEY,
    queryFn: demChuaDoc,
    enabled: user != null,
    refetchInterval: NHIP_DEM_MS,
    // Người dùng quay lại tab sau vài giờ cần thấy số đúng ngay, không chờ hết nhịp.
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
}

export function useDemTheoModule(moOn: boolean) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: [...THONG_BAO_DEM_KEY, 'theoModule'],
    queryFn: demChuaDocTheoModule,
    enabled: user != null && moOn,
    staleTime: 60_000,
  });
}

/** Khoá query danh sách — dùng chung để prefetch và useQuery trỏ cùng một chỗ. */
export function khoaDanhSach(loc: BoLocThongBao) {
  return [
    ...THONG_BAO_KEY,
    'ds',
    loc.moduleId ?? null,
    loc.chiChuaDoc ?? false,
    loc.trang ?? 0,
    loc.soDong ?? 20,
  ] as const;
}

/** Danh sách chỉ tải khi panel mở (`moOn`) — đóng panel là ngừng tốn băng thông. */
export function useDanhSachThongBao(loc: BoLocThongBao, moOn: boolean) {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: khoaDanhSach(loc),
    queryFn: () => layDanhSach(loc),
    enabled: user != null && moOn,
    staleTime: 60_000,
    // Đổi tab hay đổi module thì giữ danh sách cũ trên màn hình trong lúc tải
    // bản mới, thay vì chớp về khung rỗng rồi hiện lại.
    placeholderData: keepPreviousData,
  });
}

/**
 * Nạp sẵn nội dung panel khi con trỏ vừa chạm vào chuông.
 *
 * Người dùng mất vài trăm mili-giây từ lúc rê chuột tới lúc bấm; dùng quãng đó
 * để tải trước thì panel mở ra là đã có dữ liệu, không phải nhìn vòng quay.
 */
export function napSanNoiDungChuong(queryClient: QueryClient): void {
  const loc: BoLocThongBao = { moduleId: null, chiChuaDoc: false, soDong: 5 };
  void queryClient.prefetchQuery({
    queryKey: khoaDanhSach(loc),
    queryFn: () => layDanhSach(loc),
    staleTime: 60_000,
  });
  void queryClient.prefetchQuery({
    queryKey: [...THONG_BAO_DEM_KEY, 'theoModule'],
    queryFn: demChuaDocTheoModule,
    staleTime: 60_000,
  });
}

function dungLamMoi(queryClient: QueryClient) {
  return () => {
    void queryClient.invalidateQueries({ queryKey: THONG_BAO_KEY });
  };
}

/** Ảnh chụp cache trước khi sửa lạc quan, để trả lại nguyên trạng khi hỏng. */
type AnhChup = Array<[readonly unknown[], unknown]>;

function chupCache(queryClient: QueryClient): AnhChup {
  return queryClient.getQueriesData({ queryKey: THONG_BAO_KEY });
}

function traLaiCache(queryClient: QueryClient, anh: AnhChup | undefined): void {
  anh?.forEach(([khoa, duLieu]) => queryClient.setQueryData(khoa, duLieu));
}

/** Sửa một thông báo trong MỌI query danh sách đang nằm trong cache. */
function suaTrongDanhSach(
  queryClient: QueryClient,
  id: string,
  sua: (tb: ThongBao) => ThongBao | null
): ThongBao | undefined {
  let truoc: ThongBao | undefined;

  queryClient.setQueriesData<TrangThongBao>({ queryKey: [...THONG_BAO_KEY, 'ds'] }, (cu) => {
    if (!cu) return cu;
    const kq = suaTrang(cu, id, sua);
    if (kq.truoc) truoc = kq.truoc;
    return kq.trang;
  });

  return truoc;
}

function giamDem(queryClient: QueryClient, moduleId: string | undefined): void {
  queryClient.setQueryData<number>(THONG_BAO_DEM_KEY, (cu) => Math.max(0, (cu ?? 0) - 1));
  if (!moduleId) return;
  queryClient.setQueryData<DemTheoModule>([...THONG_BAO_DEM_KEY, 'theoModule'], (cu) =>
    cu ? giamDemTheoModule(cu, moduleId) : cu
  );
}

/**
 * Đánh dấu đã đọc: sửa cache NGAY rồi mới gọi server.
 *
 * Trước đây phải chờ request xong rồi mới invalidate và tải lại, nên bấm xong
 * còn thấy dấu chưa đọc thêm một nhịp. Hỏng thì trả lại nguyên trạng.
 */
export function useDanhDauDaDoc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: danhDauDaDoc,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: THONG_BAO_KEY });
      const anh = chupCache(queryClient);
      const truoc = suaTrongDanhSach(queryClient, id, danhDauDaDocTrongCache);
      if (truoc && !truoc.daDoc) giamDem(queryClient, truoc.moduleId);
      return { anh };
    },
    onError: (err: unknown, _id, ctx) => {
      traLaiCache(queryClient, ctx?.anh);
      toast.error((err as Error).message);
    },
    onSettled: dungLamMoi(queryClient),
  });
}

/**
 * Xoá lẻ không hỏi lại — thay vào đó cho hoàn tác bằng toast. Hỏi xác nhận mỗi
 * lần xoá một dòng sẽ khiến việc dọn chuông trở nên nặng nề.
 */
export function useXoaMotThongBao() {
  const queryClient = useQueryClient();
  const lamMoi = dungLamMoi(queryClient);
  return useMutation({
    mutationFn: xoaMot,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: THONG_BAO_KEY });
      const anh = chupCache(queryClient);
      const truoc = suaTrongDanhSach(queryClient, id, boKhoiDanhSach);
      if (truoc && !truoc.daDoc) giamDem(queryClient, truoc.moduleId);
      return { anh };
    },
    onError: (err: unknown, _id, ctx) => {
      traLaiCache(queryClient, ctx?.anh);
      toast.error((err as Error).message);
    },
    onSuccess: (_kq, id) => {
      toast.success(i18n.t('notification.toast.removed'), {
        action: {
          label: i18n.t('notification.undo'),
          onClick: () => {
            void hoanTacXoa(id).then(lamMoi);
          },
        },
      });
    },
    onSettled: lamMoi,
  });
}

export function useDocTatCa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string | null) => docTatCa(moduleId),
    onSuccess: (so) => {
      dungLamMoi(queryClient)();
      toast.success(i18n.t('notification.toast.markedAllRead', { count: so }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useXoaTatCa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string | null) => xoaTatCa(moduleId),
    onSuccess: (so) => {
      dungLamMoi(queryClient)();
      toast.success(i18n.t('notification.toast.clearedAll', { count: so }));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

// --- Cài đặt -----------------------------------------------------------------

export function useCaiDatThongBao() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: THONG_BAO_CAI_DAT_KEY,
    queryFn: async () => ({ caiDat: await layCaiDat(), tuyChon: await layTuyChon() }),
    enabled: user != null,
    staleTime: 5 * 60_000,
  });
}

export function useLuuCaiDatThongBao() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (v: { moduleId: string; loaiSuKien: string; trongApp: boolean; push: boolean }) =>
      luuCaiDat(Number(user?.id ?? 0), v.moduleId, v.loaiSuKien, { trongApp: v.trongApp, push: v.push }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: THONG_BAO_CAI_DAT_KEY });
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useLuuTuyChonThongBao() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: (v: TuyChonThongBao) => luuTuyChon(Number(user?.id ?? 0), v),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: THONG_BAO_CAI_DAT_KEY });
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}

export function useThietBiPush() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: THONG_BAO_THIET_BI_KEY,
    queryFn: layThietBi,
    enabled: user != null,
    staleTime: 60_000,
  });
}

export function useXoaThietBiPush() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: xoaThietBi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: THONG_BAO_THIET_BI_KEY });
      toast.success(i18n.t('notification.toast.deviceRemoved'));
    },
    onError: (err: unknown) => toast.error((err as Error).message),
  });
}
