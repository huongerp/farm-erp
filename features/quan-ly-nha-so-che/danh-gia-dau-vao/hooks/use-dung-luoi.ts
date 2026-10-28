import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { congPhieuTheoNgay, dungLuoiKhoangNgay, kiemTraSoLuongLoi, type DgdvKhoiNgay } from '../core/bang-tinh';
import type { DgdvPhieuDayDu } from '../core/types';
import { khoaCanhBao } from '../utils/cap-nhat-luoi';
import { useMauDay } from './use-danh-muc-dgdv';

/**
 * Mô hình lưới cho khoảng ngày (core/bang-tinh) + tập ô cảnh báo SL lỗi > số lượng.
 * Mỗi phiếu là một chuyến của một ngày; `gopChuyen` = cộng các chuyến cùng ngày + chi nhánh thành lưới tổng.
 */
export function useDungLuoi(dsPhieu: DgdvPhieuDayDu[], tu: string, den: string, gopChuyen = false) {
  const { t } = useTranslation();
  const { mauTheoId, isLoading: dangTaiMau } = useMauDay();
  const nhanXeDoi = t('danhGiaDauVao.luoi.xeDoi');

  const dsKhoi: DgdvKhoiNgay[] = useMemo(
    () => (tu && den ? dungLuoiKhoangNgay(dsPhieu, tu, den, mauTheoId, { nhanXeDoi, gopChuyen }) : []),
    [dsPhieu, tu, den, mauTheoId, nhanXeDoi, gopChuyen]
  );

  // Lưới gộp dùng id lô / cột ảo + stt dòng đánh lại → soi trên phiếu đã cộng để khoá khớp ô hiển thị.
  const canhBao = useMemo(() => {
    const ds = gopChuyen ? congPhieuTheoNgay(dsPhieu) : dsPhieu;
    return new Set(ds.flatMap((p) => kiemTraSoLuongLoi(p).map((c) => khoaCanhBao(c.id_phieu_lo, c.id_cot, c.ngay, c.stt_dong))));
  }, [dsPhieu, gopChuyen]);

  return { dsKhoi, canhBao, dangTaiMau };
}
