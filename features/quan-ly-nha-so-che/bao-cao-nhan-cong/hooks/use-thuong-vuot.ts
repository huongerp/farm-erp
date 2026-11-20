import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import { caiDatThuongVuotMacDinh, tongHopThuongThang, viTriKhongThuongVuot, type CaiDatThuongVuot } from '../core/thuong-vuot-thung';
import { fetchBaoCaoNhanCongKemNvForListQuery } from '../services/bao-cao-nhan-cong-db.service';
import {
  chotThang,
  getCaiDatThuongVuot,
  getChotThang,
  getHeSoLoiThang,
  moChotThang,
  type ChotThangInput,
  luuCaiDatThuongVuot,
  luuHeSoLoiThang,
  type LuuHeSoLoi,
} from '../services/thuong-vuot.service';
import { QUERY_KEY_BAO_CAO_NHAN_CONG, useBaoCaoNhanCongTomTat, useViTriSoChe } from './use-bao-cao-nhan-cong';
import { useBaoCaoNhanCongViewScope } from './use-bao-cao-nhan-cong-view-scope';

/** Dưới khoá module → lưu / sửa phiếu invalidate là bảng tháng tính lại. */
export const QUERY_KEY_THUONG_VUOT = [...QUERY_KEY_BAO_CAO_NHAN_CONG, 'thuongVuot'] as const;

/** Một object cố định để `caiDat` không đổi tham chiếu mỗi lần render khi chưa có dữ liệu. */
const CAI_DAT_MAC_DINH = caiDatThuongVuotMacDinh();

/** Cài đặt đơn giá / ngưỡng / hệ số của một nhà sơ chế; chưa chọn nhà → mặc định. */
export function useCaiDatThuongVuot(idChiNhanh: string | null | undefined) {
  const id = idChiNhanh ? String(idChiNhanh) : '';
  const q = useQuery({
    queryKey: [...QUERY_KEY_THUONG_VUOT, 'caiDat', id],
    queryFn: () => getCaiDatThuongVuot(id),
    enabled: id !== '',
    staleTime: 1000 * 60 * 5,
  });
  return { ...q, caiDat: q.data ?? CAI_DAT_MAC_DINH };
}

export function useLuuCaiDatThuongVuot(onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idChiNhanh, caiDat }: { idChiNhanh: string; caiDat: CaiDatThuongVuot }) => luuCaiDatThuongVuot(idChiNhanh, caiDat),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THUONG_VUOT });
      toast.success(i18n.t('baoCaoNhanCong.caiDat.daLuu'));
      onDone?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Tập vị trí (khoá tên) không nhận thưởng vượt — từ danh mục Vị trí. */
export function useViTriKhongThuongVuot(): ReadonlySet<string> {
  const { data } = useViTriSoChe();
  return useMemo(() => viTriKhongThuongVuot(data ?? []), [data]);
}

/** Phiếu (kèm tên từng người) của một nhà sơ chế trong tháng "yyyy-mm". */
export function usePhieuThangThuongVuot(idChiNhanh: string, thang: string, scope: { viewAll: boolean; allowedBranchIds: string[] }, enabled: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEY_THUONG_VUOT, 'phieu', idChiNhanh, thang, scope.viewAll, scope.allowedBranchIds],
    queryFn: () =>
      fetchBaoCaoNhanCongKemNvForListQuery({
        page: 1,
        pageSize: 1000,
        searchTerm: '',
        viewAll: scope.viewAll,
        allowedBranchIds: scope.allowedBranchIds,
        nam: [],
        thang: [thang],
        trangThai: [],
        idChiNhanh: [idChiNhanh],
        sortColumn: 'ngay',
        sortDirection: 'asc',
      }),
    enabled: enabled && idChiNhanh !== '' && /^\d{4}-\d{2}$/.test(thang),
    staleTime: 1000 * 60,
  });
}

export function useHeSoLoiThang(idChiNhanh: string, thang: string, enabled: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEY_THUONG_VUOT, 'ki', idChiNhanh, thang],
    queryFn: () => getHeSoLoiThang(idChiNhanh, thang),
    enabled: enabled && idChiNhanh !== '' && /^\d{4}-\d{2}$/.test(thang),
    staleTime: 1000 * 60,
  });
}

export function useLuuHeSoLoiThang() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: LuuHeSoLoi) => luuHeSoLoiThang(p),
    onSuccess: (_d, p) => qc.invalidateQueries({ queryKey: [...QUERY_KEY_THUONG_VUOT, 'ki', p.idChiNhanh, p.thang] }),
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Ảnh chụp tháng đã chốt (null = chưa chốt). */
export function useChotThang(idChiNhanh: string, thang: string, enabled: boolean) {
  return useQuery({
    queryKey: [...QUERY_KEY_THUONG_VUOT, 'chot', idChiNhanh, thang],
    queryFn: () => getChotThang(idChiNhanh, thang),
    enabled: enabled && idChiNhanh !== '' && /^\d{4}-\d{2}$/.test(thang),
    staleTime: 1000 * 60,
  });
}

export function useChotThangMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ChotThangInput) => chotThang(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THUONG_VUOT });
      toast.success(i18n.t('baoCaoNhanCong.vuot.daChot'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMoChotThangMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idChiNhanh, thang }: { idChiNhanh: string; thang: string }) => moChotThang(idChiNhanh, thang),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY_THUONG_VUOT });
      toast.success(i18n.t('baoCaoNhanCong.vuot.daMoChot'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/**
 * Bảng thưởng vượt tháng dùng chung cho tab và trang in: tháng đã chốt → ảnh chụp (kèm đơn giá / ngưỡng
 * lúc chốt); chưa chốt → tính sống từ phiếu × cài đặt × Ki.
 */
export function useBangThuongThang(
  idChiNhanh: string,
  thang: string,
  scope: { viewAll: boolean; allowedBranchIds: string[]; isLoading: boolean }
) {
  const sanSang = !scope.isLoading;
  const { caiDat: caiDatSong, isPending: dangTaiCaiDat } = useCaiDatThuongVuot(idChiNhanh);
  const viTriLoai = useViTriKhongThuongVuot();
  const chotQ = useChotThang(idChiNhanh, thang, sanSang);
  const chot = chotQ.data ?? null;
  const daChot = chot != null;
  // Đã chốt thì không cần tải phiếu / Ki để tính lại.
  const phieuQ = usePhieuThangThuongVuot(idChiNhanh, thang, scope, sanSang && chotQ.isSuccess && !daChot);
  const kiQ = useHeSoLoiThang(idChiNhanh, thang, sanSang && chotQ.isSuccess && !daChot);

  const ds = useMemo(
    () => (chot ? chot.dong : tongHopThuongThang(phieuQ.data ?? [], caiDatSong, viTriLoai, kiQ.data ?? {})),
    [chot, phieuQ.data, caiDatSong, viTriLoai, kiQ.data]
  );
  const caiDat = useMemo(
    () =>
      chot
        ? { ...caiDatSong, donGia: chot.donGia ?? caiDatSong.donGia, nguongPct: chot.nguongPct ?? caiDatSong.nguongPct }
        : caiDatSong,
    [chot, caiDatSong]
  );
  const coNha = idChiNhanh !== '';
  const isLoading =
    coNha && (chotQ.isPending || dangTaiCaiDat || (!daChot && (phieuQ.isPending || kiQ.isPending)));
  const isError = chotQ.isError || phieuQ.isError || kiQ.isError;
  return {
    ds,
    chot,
    caiDat,
    isLoading,
    isError,
    isFetching: chotQ.isFetching || phieuQ.isFetching,
    refetch: () => {
      void chotQ.refetch();
      if (!daChot) {
        void phieuQ.refetch();
        void kiQ.refetch();
      }
    },
  };
}

/** Nhà sơ chế trong phạm vi xem đã từng có phiếu (lấy từ danh sách tóm tắt), sắp theo tên. */
export function useNhaSoCheTrongPhamVi() {
  const scope = useBaoCaoNhanCongViewScope();
  const tomTat = useBaoCaoNhanCongTomTat(scope.viewAll, scope.allowedBranchIds, !scope.isLoading);
  const options = useMemo(() => {
    const theoId = new Map<string, string>();
    for (const r of tomTat.data ?? []) {
      if (r.id_chi_nhanh == null) continue;
      const id = String(r.id_chi_nhanh);
      if (!theoId.has(id)) theoId.set(id, r.ten_chi_nhanh?.trim() || id);
    }
    return [...theoId.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [tomTat.data]);
  return { scope, options, isLoading: scope.isLoading || tomTat.isPending };
}
