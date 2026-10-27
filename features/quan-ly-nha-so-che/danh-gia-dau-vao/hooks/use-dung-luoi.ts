import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { dungLuoiKhoangNgay, kiemTraSoLuongLoi, type DgdvKhoiNgay } from '../core/bang-tinh';
import type { DgdvPhieuDayDu } from '../core/types';
import { khoaCanhBao } from '../utils/cap-nhat-luoi';
import { useMauDay } from './use-danh-muc-dgdv';

/** Mô hình lưới cho khoảng ngày (core/bang-tinh) + tập ô cảnh báo SL lỗi > số lượng. */
export function useDungLuoi(dsPhieu: DgdvPhieuDayDu[], tu: string, den: string) {
  const { t } = useTranslation();
  const { mauTheoId, isLoading: dangTaiMau } = useMauDay();
  const nhanXeDoi = t('danhGiaDauVao.luoi.xeDoi');

  const dsKhoi: DgdvKhoiNgay[] = useMemo(
    () => (tu && den ? dungLuoiKhoangNgay(dsPhieu, tu, den, mauTheoId, { nhanXeDoi }) : []),
    [dsPhieu, tu, den, mauTheoId, nhanXeDoi]
  );

  const canhBao = useMemo(
    () => new Set(dsPhieu.flatMap((p) => kiemTraSoLuongLoi(p).map((c) => khoaCanhBao(c.id_phieu_lo, c.id_cot, c.ngay, c.stt_dong)))),
    [dsPhieu]
  );

  return { dsKhoi, canhBao, dangTaiMau };
}
