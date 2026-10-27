import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import EmptyState from '../../../../components/shared/EmptyState';
import ErrorState from '../../../../components/shared/ErrorState';
import LoadingSpinnerWithText from '../../../../components/shared/LoadingSpinnerWithText';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { useBaoCaoNhanCongTheoNgay, useBaoCaoNhanCongTomTat } from '../hooks/use-bao-cao-nhan-cong';
import { useBaoCaoNhanCongViewScope } from '../hooks/use-bao-cao-nhan-cong-view-scope';
import { addCalendarDaysIso } from '../core/form-mappers';
import {
  NHOM_TONG_HOP_NGAY,
  homNayYmd,
  laNgayYmdHopLe,
  tongHopNhanSuTheoNgay,
} from '../core/tong-hop-ngay';

const EMPTY = '—';

const thBase = 'px-3 py-2 font-medium text-right whitespace-nowrap border-b border-border';
const tdNum = 'px-3 py-2 text-right tabular-nums whitespace-nowrap';
/** Cột tên nhà sơ chế dính trái khi cuộn ngang trên điện thoại. */
const colTen = 'sticky left-0 z-[1] text-left min-w-[10rem]';

/** Tab chỉ đọc: số người theo nhóm chuyền của từng nhà sơ chế trong một ngày. */
const TongHopNgayTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const ngayParam = searchParams.get('ngay');
  const ngay = laNgayYmdHopLe(ngayParam) ? ngayParam : homNayYmd();

  const setNgay = (next: string) => {
    if (!laNgayYmdHopLe(next)) return;
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set('ngay', next);
        return p;
      },
      { replace: true }
    );
  };

  const viewScope = useBaoCaoNhanCongViewScope();
  const theoNgayQuery = useBaoCaoNhanCongTheoNgay(
    ngay,
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading
  );
  const { data: tomTatList = [] } = useBaoCaoNhanCongTomTat(
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading
  );

  const { dong, tongCong } = useMemo(
    () => tongHopNhanSuTheoNgay(theoNgayQuery.data ?? [], tomTatList),
    [theoNgayQuery.data, tomTatList]
  );

  const isLoading = viewScope.isLoading || (!theoNgayQuery.data && theoNgayQuery.isPending);

  const renderBody = () => {
    if (isLoading) {
      return <LoadingSpinnerWithText text={t('baoCaoNhanCong.loading')} className="py-10" />;
    }
    if (theoNgayQuery.isError) {
      return <ErrorState onRetry={() => theoNgayQuery.refetch()} />;
    }
    if (dong.length === 0) {
      return <EmptyState title={t('baoCaoNhanCong.tongHop.empty')} />;
    }
    return (
      <div
        className={cn(
          'overflow-x-auto rounded-lg border border-border transition-opacity',
          theoNgayQuery.isFetching && 'opacity-60'
        )}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground">
              <th className={cn(thBase, colTen, 'bg-muted')}>{t('baoCaoNhanCong.tongHop.colNhaSoChe')}</th>
              {NHOM_TONG_HOP_NGAY.map((n) => (
                <th key={n.key} className={thBase}>
                  {t(`baoCaoNhanCong.tongHop.col.${n.key}`)}
                </th>
              ))}
              <th className={cn(thBase, 'font-semibold text-emerald-600 dark:text-emerald-400')}>
                {t('baoCaoNhanCong.tongHop.colTongNs')}
              </th>
            </tr>
          </thead>
          <tbody>
            {dong.map((d) => (
              <tr
                key={d.key}
                className={cn('border-b border-border/60', !d.daBaoCao && 'text-muted-foreground/70')}
              >
                <td className={cn('px-3 py-2', colTen, 'bg-card')}>{d.tenChiNhanh || EMPTY}</td>
                {NHOM_TONG_HOP_NGAY.map((n) => (
                  <td key={n.key} className={tdNum}>
                    {d.daBaoCao ? formatNumberVN(d.soNguoi[n.key]) : EMPTY}
                  </td>
                ))}
                <td
                  className={cn(
                    tdNum,
                    d.daBaoCao ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'italic'
                  )}
                >
                  {d.daBaoCao ? formatNumberVN(d.tongNs) : t('baoCaoNhanCong.tongHop.chuaBaoCao')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/60 font-semibold">
              <td className={cn('px-3 py-2', colTen, 'bg-muted')}>{t('baoCaoNhanCong.tongHop.tongCong')}</td>
              {NHOM_TONG_HOP_NGAY.map((n) => (
                <td key={n.key} className={tdNum}>
                  {formatNumberVN(tongCong[n.key])}
                </td>
              ))}
              <td className={cn(tdNum, 'text-emerald-600 dark:text-emerald-400')}>
                {formatNumberVN(tongCong.tongNs)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="shrink-0 flex flex-col gap-2 px-4 py-3 border-b border-border sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          {t('baoCaoNhanCong.tongHop.title', { ngay: formatYmdToDisplay(ngay) })}
        </h2>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNgay(addCalendarDaysIso(ngay, -1))}
            aria-label={t('baoCaoNhanCong.tongHop.ngayTruoc')}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline ml-1">{t('baoCaoNhanCong.tongHop.ngayTruoc')}</span>
          </Button>
          <div className="relative w-[150px]">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="date"
              value={ngay}
              onChange={(e) => setNgay(e.target.value)}
              aria-label={t('baoCaoNhanCong.tongHop.ngay')}
              className="w-full h-9 pl-8 pr-2 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNgay(addCalendarDaysIso(ngay, 1))}
            aria-label={t('baoCaoNhanCong.tongHop.ngaySau')}
          >
            <span className="hidden sm:inline mr-1">{t('baoCaoNhanCong.tongHop.ngaySau')}</span>
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4">{renderBody()}</div>
    </div>
  );
};

export default TongHopNgayTab;
