import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  List,
  FileText,
  ArrowUpFromLine,
  Plus,
  Folder,
  Calendar,
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { FarmDanhMuc } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import EmptyState from '../../../../components/shared/EmptyState';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: FarmDanhMuc;
  allDanhMuc: FarmDanhMuc[];
  onClose: () => void;
  onEdit?: (item: FarmDanhMuc) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parent: FarmDanhMuc) => void;
}

const DanhMucDetail: React.FC<Props> = ({
  data,
  allDanhMuc,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
}) => {
  const { t } = useTranslation();
  const isParent = data.id_cha === null;
  const parentItem = data.id_cha
    ? allDanhMuc.find((d) => d.id === data.id_cha)
    : null;

  const children = useMemo(
    () =>
      allDanhMuc
        .filter((d) => d.id_cha === data.id)
        .sort((a, b) => a.thu_tu - b.thu_tu),
    [allDanhMuc, data.id]
  );

  const toolbarActions: DetailToolbarAction[] = useMemo(
    () =>
      isParent && onAddChild
        ? [
            {
              label: t('farmHangHoaPhanThuoc.danhMuc.detail.addChild'),
              icon: <Plus size={16} />,
              onClick: () => onAddChild(data),
              variant: 'primary' as const,
            },
          ]
        : [],
    [isParent, onAddChild, data, t]
  );

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {onEdit && (
          <Button
            onClick={() => {
              onEdit(data);
              onClose();
            }}
            className="bg-primary text-white shadow-lg hover:bg-primary/90"
          >
            <Edit size={16} className="mr-2" /> {BTN_EDIT()}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => {
              onDelete(data.id);
              onClose();
            }}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
          >
            <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('farmHangHoaPhanThuoc.danhMuc.detail.title')}
      subtitle={data.ma_danh_muc}
      icon={<List size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <List size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_danh_muc}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_danh_muc}</p>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection title={t('farmHangHoaPhanThuoc.danhMuc.detail.basicInfo')} icon={<List size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('farmHangHoaPhanThuoc.danhMuc.form.name')} value={data.ten_danh_muc} icon={<List size={12} />} />
            <DetailField label={t('farmHangHoaPhanThuoc.danhMuc.form.code')} value={data.ma_danh_muc} icon={<List size={12} />} />
            <DetailField
              label={t('farmHangHoaPhanThuoc.danhMuc.form.parent')}
              value={parentItem ? parentItem.ten_danh_muc : t('farmHangHoaPhanThuoc.danhMuc.detail.noParent')}
              icon={<Folder size={12} />}
              emptyText={t('farmHangHoaPhanThuoc.danhMuc.detail.noParent')}
            />
            <DetailField label={t('farmHangHoaPhanThuoc.danhMuc.detail.order')} value={String(data.thu_tu)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField
              label={t('farmHangHoaPhanThuoc.danhMuc.detail.description')}
              value={data.mo_ta ?? ''}
              icon={<FileText size={12} />}
              emptyText="—"
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('farmHangHoaPhanThuoc.danhMuc.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('farmHangHoaPhanThuoc.danhMuc.detail.createdAt')} value={formatDateShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('farmHangHoaPhanThuoc.danhMuc.detail.updated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {isParent && (
          <div className="w-full bg-card p-3.5 sm:p-4 rounded-xl border border-border shadow-sm space-y-2.5">
            <div className="flex items-center gap-3 pb-2">
              <div className="flex items-center gap-2 shrink-0">
                <Folder size={14} className="text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('farmHangHoaPhanThuoc.danhMuc.detail.childrenSection')}
                </h4>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                  {children.length} {t('farmHangHoaPhanThuoc.danhMuc.footerRecords')}
                </span>
              </div>
              <div className="flex-1 h-px border-b border-dashed border-border/80" aria-hidden />
              <Button
                type="button"
                size="sm"
                onClick={() => onAddChild?.(data)}
                className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0"
              >
                <Plus size={14} className="mr-1.5" />
                {t('farmHangHoaPhanThuoc.danhMuc.detail.addChild')}
              </Button>
            </div>
            {children.length === 0 ? (
              <EmptyState
                title={t('farmHangHoaPhanThuoc.danhMuc.detail.noChildren')}
                description={t('farmHangHoaPhanThuoc.danhMuc.detail.noChildrenHint')}
                icon={<Folder className="w-10 h-10 text-muted-foreground" />}
                action={
                  <Button type="button" size="sm" onClick={() => onAddChild?.(data)} className="bg-primary text-white hover:bg-primary/90">
                    <Plus size={14} className="mr-2" />
                    {t('farmHangHoaPhanThuoc.danhMuc.detail.addChild')}
                  </Button>
                }
              />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-[280px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs">{t('farmHangHoaPhanThuoc.danhMuc.form.name')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs">{t('farmHangHoaPhanThuoc.danhMuc.form.code')}</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                      {children.map((child) => (
                        <tr key={child.id} className="hover:bg-muted/60">
                          <td className="px-4 py-2.5 font-medium text-foreground">{child.ten_danh_muc}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{child.ma_danh_muc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GenericDrawer>
  );
};

export default DanhMucDetail;
