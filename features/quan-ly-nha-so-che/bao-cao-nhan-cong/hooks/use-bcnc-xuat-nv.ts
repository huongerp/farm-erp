import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { formatDbError } from '../../../../lib/db-errors';
import { BCNC_XUAT_NV_TOI_DA, type BaoCaoNhanCongListServerQuery } from '../services/bao-cao-nhan-cong-list-query';
import { fetchBaoCaoNhanCongKemNvForListQuery } from '../services/bao-cao-nhan-cong-db.service';
import { xuatExcelChiTietNv, type KieuXuatNv } from '../utils/export-bao-cao-nhan-cong-nv';

/**
 * Xuất Excel chi tiết nhân viên (kèm ma trận theo dõi vị trí) cho mọi phiếu khớp bộ lọc danh sách,
 * tối đa `BCNC_XUAT_NV_TOI_DA` phiếu.
 */
export function useBcncXuatNv() {
  const { t } = useTranslation();
  const [dangXuat, setDangXuat] = useState(false);

  /** `tongSo` = tổng phiếu khớp lọc (đã có từ trang danh sách). Trả true khi đã tải file. */
  const xuat = useCallback(
    async (kieu: KieuXuatNv, query: BaoCaoNhanCongListServerQuery, tongSo: number): Promise<boolean> => {
      if (tongSo === 0) {
        toast.warning(t('baoCaoNhanCong.noExportData'));
        return false;
      }
      if (tongSo > BCNC_XUAT_NV_TOI_DA) {
        toast.warning(t('baoCaoNhanCong.xuat.quaNhieu', { n: tongSo, max: BCNC_XUAT_NV_TOI_DA }));
        return false;
      }
      setDangXuat(true);
      try {
        const dsPhieu = await fetchBaoCaoNhanCongKemNvForListQuery(query);
        const soDong = await xuatExcelChiTietNv(dsPhieu, kieu, t);
        if (soDong === 0) {
          toast.warning(t('baoCaoNhanCong.xuat.khongCoTen'));
          return false;
        }
        toast.success(t('baoCaoNhanCong.xuat.daXuat', { dong: soDong, phieu: dsPhieu.length }));
        return true;
      } catch (err) {
        toast.error(formatDbError(err));
        return false;
      } finally {
        setDangXuat(false);
      }
    },
    [t]
  );

  return { dangXuat, xuat };
}
