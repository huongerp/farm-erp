import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import i18n from '../../../../lib/i18n';
import { formatNumberVN } from '../../../../lib/utils';
import { useAuthStore } from '../../../../store/useStore';
import type { KetQuaQuet } from '../../../../components/shared/QrScannerDialog';
import { docMaTem } from '../../giam-sat-chat-luong/core/qr';
import type { PhieuQcTomTat } from '../../giam-sat-chat-luong/core/types';
import {
  dsPhieuQcDaNop,
  getPhieuQcTomTat,
  getXeDaXepCayHang,
  timPhieuQcTheoMaTem,
} from '../../giam-sat-chat-luong/services/giam-sat-chat-luong-service';
import { danhGiaQuetCayHang } from '../core/quet-cay-hang';
import { themDongHang } from '../services/dang-ky-nhan-hang-service';
import { QUERY_KEY_DKNH } from './use-dang-ky-nhan-hang';

/** Mã chọn tay trong máy quét (không có tem): `PHIEU:<id phiếu QC>`. */
export const TIEN_TO_CHON_TAY = 'PHIEU:';

const tenCayHang = (p: PhieuQcTomTat) =>
  [p.so_phieu, p.ten_hang_hoa, p.ma_cay_hang ? i18n.t('dangKyNhanHang.cayHang.cay', { ma: p.ma_cay_hang }) : null]
    .filter(Boolean)
    .join(' · ');

/**
 * Xếp cây hàng lên xe: quét tem QC (hoặc chọn tay phiếu QC) → kiểm luật
 * (core/quet-cay-hang) → ghi CẢ cây hàng (so_thung_cay thùng).
 */
export function useQuetCayHang(idPhieu: string) {
  const userId = useAuthStore((s) => s.user?.id);
  const qc = useQueryClient();

  const ghiNhan = useCallback(
    async (raw: string): Promise<KetQuaQuet> => {
      const chonTay = raw.startsWith(TIEN_TO_CHON_TAY);
      const maTem = chonTay ? null : docMaTem(raw);
      const phieuQc = chonTay
        ? await getPhieuQcTomTat(raw.slice(TIEN_TO_CHON_TAY.length))
        : maTem
          ? await timPhieuQcTheoMaTem(maTem)
          : null;
      const xe = phieuQc ? ((await getXeDaXepCayHang([phieuQc.id])).get(phieuQc.id) ?? []) : [];
      const xeKhac = xe.filter((x) => x.id_phieu_xe !== idPhieu).map((x) => x.so_xe || x.so_cont || `#${x.id_phieu_xe}`);

      const kq = danhGiaQuetCayHang({
        laTemQc: chonTay || maTem != null,
        phieuQc,
        daCoTrenXeNay: xe.some((x) => x.id_phieu_xe === idPhieu),
        xeKhac,
      });

      if (kq.muc === 'loi') {
        const ma = raw.length > 40 ? `${raw.slice(0, 40)}…` : raw;
        return { ok: false, message: i18n.t(`dangKyNhanHang.cayHang.loi_${kq.lyDo}`, { ma, so: phieuQc?.so_phieu ?? '' }) };
      }
      if (kq.muc === 'da_co') {
        return { ok: false, message: i18n.t('dangKyNhanHang.cayHang.daCo', { ten: tenCayHang(phieuQc!) }) };
      }

      const p = phieuQc!;
      const moi = await themDongHang({
        id_phieu: idPhieu,
        id_phieu_gscl: p.id,
        so_luong: p.so_thung_cay,
        nguon: chonTay ? 'tay' : 'quet',
        ma_tem_quet: maTem,
        id_nguoi_quet: userId ? String(userId) : null,
      });
      if (!moi) return { ok: false, message: i18n.t('dangKyNhanHang.cayHang.daCo', { ten: tenCayHang(p) }) };

      // Trong lúc quét chỉ tải lại bảng cây hàng của phiếu; cả module tải lại khi đóng máy quét.
      void qc.invalidateQueries({ queryKey: [...QUERY_KEY_DKNH, 'chiTiet', idPhieu] });
      const canh = kq.canhBao.map((c) =>
        i18n.t(`dangKyNhanHang.cayHang.canhBao_${c}`, { xe: xeKhac.join(', ') })
      );
      return {
        ok: true,
        canhBao: canh.length > 0,
        message: [
          i18n.t('dangKyNhanHang.cayHang.daGhi', { ten: tenCayHang(p), thung: formatNumberVN(p.so_thung_cay) }),
          ...canh,
        ].join(' — '),
      };
    },
    [qc, idPhieu, userId]
  );

  const lamMoiSauQuet = useCallback(() => qc.invalidateQueries({ queryKey: QUERY_KEY_DKNH }), [qc]);

  return { ghiNhan, lamMoiSauQuet };
}

/** Phiếu QC đã nộp của farm — danh sách chọn tay trong máy quét khi tem hỏng / mất. */
export function usePhieuQcDaNop(idChiNhanh: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY_DKNH, 'phieuQcDaNop', idChiNhanh],
    queryFn: () => dsPhieuQcDaNop(idChiNhanh!),
    enabled: !!idChiNhanh,
    staleTime: 60_000,
  });
}
