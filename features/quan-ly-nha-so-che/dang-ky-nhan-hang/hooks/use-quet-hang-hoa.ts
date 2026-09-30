import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import i18n from '../../../../lib/i18n';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { useAuthStore } from '../../../../store/useStore';
import { taoMapMaHangHoa } from '../core/qr';
import type { KetQuaQuet } from '../components/QrScannerDialog';
import { getTongMotHang, themDongHang } from '../services/dang-ky-nhan-hang-service';
import { QUERY_KEY_DKNH } from './use-dang-ky-nhan-hang';

/**
 * Ghi nhận một thùng từ mã QR: tra `ma_hang_hoa` → thêm 1 dòng (số lượng 1, nguồn quét).
 * "Thùng thứ N" đọc lại tổng thật từ DB ngay sau khi ghi — không dựa vào danh sách trên
 * máy (có thể chưa tải lại kịp khi quét nhanh, hoặc người khác cũng đang quét cùng phiếu).
 */
export function useQuetHangHoa(idPhieu: string) {
  const { data: hangHoaList = [] } = useHangHoaRefQuery();
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();
  const mapMa = useMemo(() => taoMapMaHangHoa(hangHoaList), [hangHoaList]);

  const timTheoMa = useCallback((ma: string) => mapMa.get(ma) ?? null, [mapMa]);

  const ghiNhan = useCallback(
    async (ma: string): Promise<KetQuaQuet> => {
      const hh = mapMa.get(ma);
      if (!hh) return { ok: false, message: i18n.t('dangKyNhanHang.qr.khongTimThay', { ma }) };
      await themDongHang([
        {
          id_phieu: idPhieu,
          id_hang_hoa: hh.id,
          ma_hang_hoa: hh.ma_hang,
          so_luong: 1,
          nguon: 'quet',
          id_nguoi_quet: userId ? String(userId) : null,
        },
      ]);
      const n = await getTongMotHang(idPhieu, hh.id);
      // Trong lúc quét chỉ tải lại bảng hàng của phiếu — tải lại cả module mỗi thùng làm
      // máy quét khựng. Danh sách / thống kê tải lại khi đóng máy quét (lamMoiSauQuet).
      void qc.invalidateQueries({ queryKey: [...QUERY_KEY_DKNH, 'chiTiet', idPhieu] });
      return { ok: true, message: i18n.t('dangKyNhanHang.qr.daGhiNhan', { ten: hh.ten_hang || hh.ma_hang, n }) };
    },
    [mapMa, qc, idPhieu, userId]
  );

  const lamMoiSauQuet = useCallback(() => qc.invalidateQueries({ queryKey: QUERY_KEY_DKNH }), [qc]);

  return { ghiNhan, timTheoMa, hangHoaList, lamMoiSauQuet };
}
