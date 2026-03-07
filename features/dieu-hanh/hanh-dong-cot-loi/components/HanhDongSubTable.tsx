import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Zap, Edit, Trash2, ExternalLink } from 'lucide-react';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { useHanhDongByChienLuocId } from '../hooks/use-hanh-dong-cot-loi';
import { useNhomHanhDongList } from '../hooks/use-nhom-hanh-dong';
import { BSC_LABEL_KEYS } from '../core/constants';
import type { BscDimension } from '../core/types';
import type { HanhDongCotLoi } from '../core/types';

interface Props {
  chienLuocId: string;
  isApproved: boolean;
  onEdit?: (item: HanhDongCotLoi) => void;
  onDelete?: (id: string) => void;
}

const HanhDongSubTable: React.FC<Props> = ({
  chienLuocId,
  isApproved,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: actions = [], isLoading } = useHanhDongByChienLuocId(chienLuocId);
  const { data: nhomList = [] } = useNhomHanhDongList();

  const nhomByMa = useMemo(() => {
    const o: Record<string, string> = {};
    nhomList.forEach((n) => {
      o[n.ma] = n.ten;
    });
    return o;
  }, [nhomList]);

  const handleAdd = () => {
    navigate(`/dieu-hanh/hanh-dong-cot-loi?chien_luoc=${chienLuocId}&add=1`);
  };

  const handleViewAll = () => {
    navigate(`/dieu-hanh/hanh-dong-cot-loi?chien_luoc=${chienLuocId}`);
  };

  if (!isApproved) {
    return (
      <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-2 shrink-0">
          <Zap size={14} className="text-primary" />
          <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
            {t('hanhDongCotLoi.title')}
          </h4>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t('hanhDongCotLoi.detail.noAction')}
        </p>
      </div>
    );
  }

  const tableContent = (
    <>
      <thead className="sticky top-0 z-10 bg-muted/95 border-b border-border">
        <tr>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs w-12">STT</th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-left min-w-[160px]">
            {t('hanhDongCotLoi.col.ten')}
          </th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-left min-w-[120px]">
            {t('hanhDongCotLoi.col.bsc')}
          </th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-left min-w-[100px]">
            {t('hanhDongCotLoi.col.nhomHanhDong')}
          </th>
          <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-right min-w-[80px]">
            {t('hanhDongCotLoi.col.tyTrong')}
          </th>
          {(onEdit || onDelete) && (
            <th className="px-4 py-2.5 font-semibold text-muted-foreground text-xs text-right w-20">
              {t('common.actions')}
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {actions.map((item, idx) => (
          <tr key={item.id} className="hover:bg-muted/30">
            <td className="px-4 py-2.5 text-sm text-muted-foreground">{idx + 1}</td>
            <td className="px-4 py-2.5 text-sm font-medium text-foreground">{item.ten}</td>
            <td className="px-4 py-2.5">
              <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {t(BSC_LABEL_KEYS[item.bsc_dimension as BscDimension])}
              </span>
            </td>
            <td className="px-4 py-2.5 text-sm text-foreground">
              {nhomByMa[item.nhom_hanh_dong] ?? item.nhom_hanh_dong}
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
        title={t('hanhDongCotLoi.title')}
        icon={<Zap size={14} className="text-primary" />}
        count={actions.length}
        addLabel={t('hanhDongCotLoi.detail.addAction')}
        onAdd={handleAdd}
        emptyTitle={t('hanhDongCotLoi.empty')}
        loading={isLoading}
        loadingText={t('common.loading')}
        maxTableHeight="280px"
      >
        {!isLoading && actions.length > 0 ? tableContent : undefined}
      </GenericSubTableSection>
      {actions.length > 0 && (
        <button
          type="button"
          onClick={handleViewAll}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          <ExternalLink size={12} />
          {t('hanhDongCotLoi.detail.viewAll')}
        </button>
      )}
    </div>
  );
};

export default HanhDongSubTable;
