import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PhieuBaoTriSuaChua } from '../../core/types';
import type { LoaiChiPhi } from '../../../thiet-lap-tai-san/core/types';
import { getHangMucLabel } from '../../core/constants';
import { tinhThongKe, type ThongKePhieu } from '../../core/thong-ke';

/** Bọc `tinhThongKe` (core/thong-ke.ts) với nhãn i18n + danh mục loại chi phí. */
export function usePhieuBaoTriStats(list: PhieuBaoTriSuaChua[], loaiChiPhi: LoaiChiPhi[] = []): ThongKePhieu {
  const { t } = useTranslation();
  return useMemo(() => {
    const tenLoai = new Map(loaiChiPhi.map((l) => [l.id, l.ten]));
    return tinhThongKe(list, {
      tenHangMuc: (id) => tenLoai.get(id) ?? getHangMucLabel(id, t),
      chuaCoChiNhanh: t('baoTriSuaChua.stats.chuaCoChiNhanh'),
      khongCoNhaCungCap: t('baoTriSuaChua.stats.khongCoNhaCungCap'),
    });
  }, [list, loaiChiPhi, t]);
}
