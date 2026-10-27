import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '../../../../lib/i18n';
import {
  getLyDoDb,
  getMauDayDb,
  luuLoThuHoachDb,
  luuLyDoDb,
  luuMauDayDb,
  xoaLoThuHoachDb,
  xoaLyDoDb,
  xoaMauDayDb,
} from '../services/danh-muc-dgdv.service';
import { getLoThuHoach } from '../services/danh-gia-dau-vao-service';
import { getEmployeesRef } from '../../../he-thong/nhan-vien/services/nhan-vien-service';
import { taoMapMau } from '../core/bang-tinh';
import type { DgdvLyDoFormValues, LoThuHoachFormValues, MauDayFormValues } from '../core/schema';
import { QUERY_KEY_DGDV } from './use-danh-gia-dau-vao';

const QK_MAU = [...QUERY_KEY_DGDV, 'dm', 'mau'] as const;
const QK_LO = [...QUERY_KEY_DGDV, 'dm', 'lo'] as const;
const QK_LY_DO = [...QUERY_KEY_DGDV, 'dm', 'lyDo'] as const;

const DM_STALE = 1000 * 60 * 10;

/** Đủ màu kể cả đã ngừng dùng (phiếu cũ vẫn trỏ tới) + map id → màu. */
export function useMauDay() {
  const q = useQuery({ queryKey: QK_MAU, queryFn: getMauDayDb, staleTime: DM_STALE });
  const mauTheoId = useMemo(() => taoMapMau(q.data ?? []), [q.data]);
  return { ...q, mauTheoId };
}

export function useLoThuHoach() {
  return useQuery({ queryKey: QK_LO, queryFn: getLoThuHoach, staleTime: DM_STALE });
}

/** Nhân viên rút gọn cho ô chọn tổ trưởng (dùng chung key ['employees','ref'] với module khác). */
export function useNhanVienRef() {
  return useQuery({ queryKey: ['employees', 'ref'], queryFn: getEmployeesRef, staleTime: DM_STALE });
}

export function useLyDoDgdv() {
  return useQuery({ queryKey: QK_LY_DO, queryFn: getLyDoDb, staleTime: DM_STALE });
}

function useLuuDanhMuc<V>(
  key: readonly unknown[],
  luu: (id: string | null, v: V) => Promise<void>,
  onDone?: () => void
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: V }) => luu(id, data),
    onSuccess: () => {
      // Đổi danh mục (tên màu, tên lô) đổi cả nhãn trên phiếu đang cache.
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_DGDV, 'full'] });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY_DGDV, 'khoang'] });
      toast.success(i18n.t('danhGiaDauVao.caiDat.daLuu'));
      onDone?.();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

function useXoaDanhMuc(key: readonly unknown[], xoa: (id: string) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: xoa,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success(i18n.t('danhGiaDauVao.caiDat.daXoa'));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export const useLuuMauDay = (onDone?: () => void) => useLuuDanhMuc<MauDayFormValues>(QK_MAU, luuMauDayDb, onDone);
export const useXoaMauDay = () => useXoaDanhMuc(QK_MAU, xoaMauDayDb);
export const useLuuLoThuHoach = (onDone?: () => void) =>
  useLuuDanhMuc<LoThuHoachFormValues>(QK_LO, luuLoThuHoachDb, onDone);
export const useXoaLoThuHoach = () => useXoaDanhMuc(QK_LO, xoaLoThuHoachDb);
export const useLuuLyDo = (onDone?: () => void) => useLuuDanhMuc<DgdvLyDoFormValues>(QK_LY_DO, luuLyDoDb, onDone);
export const useXoaLyDo = () => useXoaDanhMuc(QK_LY_DO, xoaLyDoDb);
