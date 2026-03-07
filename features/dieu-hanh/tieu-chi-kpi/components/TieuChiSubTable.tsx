import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Gauge, Edit, Trash2, ExternalLink } from 'lucide-react';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { useTieuChiByHanhDongId } from '../hooks/use-tieu-chi-kpi';
import { useDonViTinhList } from '../hooks/use-don-vi-tinh';
import { useCachTinhDiemList } from '../hooks/use-cach-tinh-diem';
import { LOAI_DO_LUONG_LABEL_KEYS } from '../core/constants';
import type { LoaiDoLuong } from '../core/types';
import type { TieuChiKpi } from '../core/types';

interface Props {
  hanhDongId: string;
  onEdit?: (item: TieuChiKpi) => void;
  onDelete?: (id: string) => void;
}

const TieuChiSubTable: React.FC<Props> = ({
  hanhDongId,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: criteria = [], isLoading } = useTieuChiByHanhDongId(hanhDongId);
  const { data: dvtList = [] } = useDonViTinhList();
  const { data: ctdList = [] } = useCachTinhDiemList();

  const dvtByMa = useMemo(() => {
    const o: Record<string, string> = {};
    dvtList.forEach((d) => {
      o[d.ma] = d.ky_hieu ?? d.ten;
    });
    return o;
  }, [dvtList]);

  const ctdByMa = useMemo(() => {
    const o: Record<string, string> = {};
    ctdList.forEach((c) => {
      o[c.ma] = c.ten;
    });
    return o;
  }, [ctdList]);

  const handleAdd = () => {
    navigate(`/dieu-hanh/tieu-chi-kpi?hanh_dong=${hanhDongId}&add=1`);
  };

  const handleViewAll = () => {
    navigate(`/dieu-hanh/tieu-chi-kpi?hanh_dong=${hanhDongId}`);
  };

  const tableContent = (
    <>
      <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
        <tr>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs w-12">STT</th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-left min-w-[160px]">
            {t('tieuChiKpi.col.ten')}
          </th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-left min-w-[80px]">
            {t('tieuChiKpi.col.donViTinh')}
          </th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-left min-w-[90px]">
            {t('tieuChiKpi.col.loai')}
          </th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-right min-w-[90px]">
            {t('tieuChiKpi.col.mucTieu')}
          </th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-right min-w-[80px]">
            {t('tieuChiKpi.col.tyTrong')}
          </th>
          {(onEdit || onDelete) && (
            <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-right w-20">
              {t('common.actions')}
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {criteria.map((item, idx) => (
          <tr key={item.id} className="hover:bg-muted/30">
            <td className="px-4 py-2.5 text-sm text-muted-foreground">{idx + 1}</td>
            <td className="px-4 py-2.5 text-sm font-medium text-foreground">{item.ten}</td>
            <td className="px-4 py-2.5 text-sm text-muted-foreground">
              {dvtByMa[item.don_vi_tinh] ?? item.don_vi_tinh}
            </td>
            <td className="px-4 py-2.5">
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                  item.loai === 'xuoi'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                {LOAI_DO_LUONG_LABEL_KEYS[item.loai as LoaiDoLuong]
                  ? t(LOAI_DO_LUONG_LABEL_KEYS[item.loai as LoaiDoLuong])
                  : (item.loai ?? '—')}
              </span>
            </td>
            <td className="px-4 py-2.5 text-sm text-right tabular-nums">
              {item.gia_tri_muc_tieu} {dvtByMa[item.don_vi_tinh] ? ` ${dvtByMa[item.don_vi_tinh]}` : ''}
            </td>
            <td className="px-4 py-2.5 text-sm text-right tabular-nums">{item.ty_trong}%</td>
            {(onEdit || onDelete) && (
              <td className="px-4 py-2.5 text-right">
                <div className="flex items-center justify-end gap-0.5">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                      title={t('common.edit')}
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                      title={t('common.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </>
  );

  return (
    <div className="space-y-2">
      <GenericSubTableSection
        title={t('tieuChiKpi.title')}
        icon={<Gauge size={14} className="text-primary" />}
        count={criteria.length}
        addLabel={t('tieuChiKpi.detail.addCriteria')}
        onAdd={handleAdd}
        emptyTitle={t('tieuChiKpi.empty')}
        loading={isLoading}
        loadingText={t('common.loading')}
        maxTableHeight="280px"
      >
        {!isLoading && criteria.length > 0 ? tableContent : undefined}
      </GenericSubTableSection>
      {criteria.length > 0 && (
        <button
          type="button"
          onClick={handleViewAll}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink size={12} />
          {t('tieuChiKpi.detail.viewAll')}
        </button>
      )}
    </div>
  );
};

export default TieuChiSubTable;
