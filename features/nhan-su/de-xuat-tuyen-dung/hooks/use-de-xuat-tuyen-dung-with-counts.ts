import { useMemo } from 'react';
import { useDeXuatTuyenDungs } from './use-de-xuat-tuyen-dung';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import { useTrangThaiUngViens } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-trang-thai-ung-vien';
import type { DeXuatTuyenDungWithCounts } from '../core/types';
import type { LoaiKetQuaTrangThai } from '@/features/nhan-su/thiet-lap-tuyen-dung/core/types';

/**
 * Đề xuất tuyển dụng kèm số liệu tính từ ứng viên + trạng thái ứng viên:
 * - so_luong_onboard: số ứng viên đang ở trạng thái "đã tuyển / đang làm"
 * - so_luong_da_nghi: số ứng viên đã tuyển nhưng đã nghỉ
 * - so_luong_con_lai: so_luong - so_luong_onboard
 */
export function useDeXuatTuyenDungWithCounts() {
  const { data: list = [], isLoading: loadingDx, isError: errorDx } = useDeXuatTuyenDungs();
  const { data: ungViens = [], isLoading: loadingUv } = useUngViens();
  const { data: trangThaiList = [], isLoading: loadingTt } = useTrangThaiUngViens();

  const enrichedList = useMemo((): DeXuatTuyenDungWithCounts[] => {
    const byTrangThai = new Map<string, LoaiKetQuaTrangThai | null | undefined>();
    trangThaiList.forEach((t) => byTrangThai.set(t.id, t.loai_ket_qua ?? null));

    return list.map((dx) => {
      const candidates = ungViens.filter((u) => u.id_de_xuat_tuyen_dung === dx.id);
      let onboard = 0;
      let nghi = 0;
      candidates.forEach((u) => {
        const loai = byTrangThai.get(u.id_trang_thai_ung_vien);
        if (loai === 'onboard') onboard += 1;
        else if (loai === 'nghi') nghi += 1;
      });
      const so_luong_con_lai = Math.max(0, (dx.so_luong ?? 0) - onboard);
      return {
        ...dx,
        so_luong_onboard: onboard,
        so_luong_da_nghi: nghi,
        so_luong_con_lai,
      };
    });
  }, [list, ungViens, trangThaiList]);

  const isLoading = loadingDx || loadingUv || loadingTt;
  const isError = errorDx;

  return {
    data: enrichedList,
    isLoading,
    isError,
    /** Raw list (không có counts) khi cần ref sau mutation */
    rawList: list,
  };
}
