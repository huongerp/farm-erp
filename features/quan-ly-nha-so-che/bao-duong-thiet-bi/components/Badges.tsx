import React from 'react';
import { useTranslation } from 'react-i18next';
import { getStatusBadgeClass, type StatusBadgeSemantic } from '../../../../lib/status-badge';
import { soNgayConLai, tinhTrangHan, TINH_TRANG_HAN_SEMANTIC } from '../core/han';
import { cn } from '../../../../lib/utils';
import type { KetQuaBaoDuong } from '../core/types';

type TFunc = ReturnType<typeof useTranslation>['t'];

const badgeCls = (semantic: StatusBadgeSemantic) =>
  cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border whitespace-nowrap', getStatusBadgeClass(semantic));

/** Nhãn tình trạng hạn — dùng chung cho badge và ô tìm kiếm (gõ "quá hạn" vẫn ra). */
export function tinhTrangHanLabel(han: string | null, homNay: string, t: TFunc): string {
  const tt = tinhTrangHan(han, homNay);
  if (tt === 'qua_han') return t('baoDuongThietBi.tinhTrang.quaHan', { n: Math.abs(soNgayConLai(han!, homNay)) });
  if (tt === 'sap_toi') {
    const con = soNgayConLai(han!, homNay);
    return con === 0 ? t('baoDuongThietBi.tinhTrang.denHan') : t('baoDuongThietBi.tinhTrang.sapToi', { n: con });
  }
  if (tt === 'con_han') return t('baoDuongThietBi.tinhTrang.conHan');
  return t('baoDuongThietBi.tinhTrang.chuaLenLich');
}

/** Badge tình trạng hạn: "Quá hạn 3 ngày" / "Còn 2 ngày" / "Còn hạn" / "Chưa lên lịch". */
export const TinhTrangHanBadge: React.FC<{ han: string | null; homNay: string }> = ({ han, homNay }) => {
  const { t } = useTranslation();
  return <span className={badgeCls(TINH_TRANG_HAN_SEMANTIC[tinhTrangHan(han, homNay)])}>{tinhTrangHanLabel(han, homNay, t)}</span>;
};

const KQ_SEMANTIC: Record<KetQuaBaoDuong, StatusBadgeSemantic> = {
  hoan_thanh: 'success',
  can_theo_doi: 'pending',
  can_sua_chua: 'rejected',
};

/** Badge kết quả một lần bảo dưỡng. */
export const KetQuaBadge: React.FC<{ ketQua: KetQuaBaoDuong }> = ({ ketQua }) => {
  const { t } = useTranslation();
  return <span className={badgeCls(KQ_SEMANTIC[ketQua])}>{t(`baoDuongThietBi.ketQua.${ketQua}`)}</span>;
};
