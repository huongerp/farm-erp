/**
 * Số liệu tab Thống kê thu hoạch (dùng chung cho màn hình và trang in): danh sách trong phạm vi
 * xem → trải theo ngày → lọc → pivot, kèm nhãn cột / farm / mô tả bộ lọc đã dịch.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useThuHoachList } from './use-thu-hoach';
import { useThuHoachViewScope } from './use-thu-hoach-view-scope';
import { filterThuHoachListByViewScope } from '../utils/thu-hoach-view-scope-filter';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { DAY_FORM_LABEL_KEY } from '../core/form-mappers';
import { FARM_KHONG_GAN, traiPhangNgay } from '../core/ngay-thu-hoach';
import { pivotThongKe, type CotPivot } from '../core/stats-pivot';
import { locDongNgay, type ThongKeLoc } from '../core/thong-ke-loc';

export function useThongKeThuHoach(loc: ThongKeLoc) {
  const { t } = useTranslation();
  const { data: rawList = [], isLoading, isError, error, refetch } = useThuHoachList();
  const viewScope = useThuHoachViewScope();
  const list = useMemo(() => filterThuHoachListByViewScope(rawList, viewScope), [rawList, viewScope]);
  const { data: branches = [] } = useBranches();

  const dong = useMemo(() => traiPhangNgay(list), [list]);
  const dongLoc = useMemo(() => locDongNgay(dong, loc), [dong, loc]);
  const pivot = useMemo(() => pivotThongKe(dongLoc, loc.cheDo), [dongLoc, loc.cheDo]);

  const branchLabelMap = useMemo(
    () => new Map(branches.map((b) => [String(b.id), b.ten_chi_nhanh])),
    [branches]
  );

  const tenFarm = (fk: string) =>
    fk === FARM_KHONG_GAN ? t('thuHoach.stats.noBranch') : (branchLabelMap.get(fk) ?? pivot.farmLabels.get(fk) ?? fk);

  // Kỳ lọc trải qua nhiều năm thì nhãn tuần / tháng kèm năm cho khỏi nhầm.
  const nhieuNam = new Set(pivot.cot.map((c) => (c.loai === 'thu' ? 0 : c.nam))).size > 1;
  const nhanCot = (c: CotPivot): string => {
    if (c.loai === 'thu') return t(DAY_FORM_LABEL_KEY[c.thu]);
    const ten =
      c.loai === 'tuan' ? `${t('thuHoach.stats.colWeek')} ${c.tuan}` : t('thuHoach.stats.colMonth', { thang: c.thang });
    return nhieuNam ? `${ten}/${c.nam}` : ten;
  };

  const tieuDe = t(`thuHoach.inThongKe.tieuDe.${loc.cheDo}`);

  const moTaLoc = (() => {
    const phan: string[] = [];
    const ky =
      loc.tuNgay || loc.denNgay
        ? `${loc.tuNgay ? formatYmdToDisplay(loc.tuNgay) : '…'} – ${loc.denNgay ? formatYmdToDisplay(loc.denNgay) : '…'}`
        : t('thuHoach.inThongKe.tatCa');
    phan.push(`${t('thuHoach.inThongKe.ky')}: ${ky}`);
    if (loc.nam.length) phan.push(`${t('thuHoach.stats.filterNam')}: ${loc.nam.join(', ')}`);
    if (loc.tuan.length) phan.push(`${t('thuHoach.stats.filterTuan')}: ${loc.tuan.join(', ')}`);
    if (loc.farm.length) phan.push(`${t('thuHoach.stats.filterFarm')}: ${loc.farm.map(tenFarm).join(', ')}`);
    if (loc.tinhTrang.length)
      phan.push(
        `${t('thuHoach.stats.filterTinhTrang')}: ${loc.tinhTrang.map((s) => t(`thuHoach.stats.tinhTrang.${s}`)).join(', ')}`
      );
    return phan.join(' · ');
  })();

  return {
    list,
    rawList,
    branches,
    pivot,
    tenFarm,
    nhanCot,
    tieuDe,
    moTaLoc,
    isLoading: isLoading || viewScope.isLoading,
    isError,
    error,
    refetch,
  };
}
