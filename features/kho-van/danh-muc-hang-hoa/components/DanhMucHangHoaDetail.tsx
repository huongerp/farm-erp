import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  List,
  FileText,
  ArrowUpFromLine,
  Power,
  Plus,
  Folder,
  Calendar,
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import type { DanhMucHangHoa } from '../core/types';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import EmptyState from '../../../../components/shared/EmptyState';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';

interface Props {
  data: DanhMucHangHoa;
  allDanhMuc: DanhMucHangHoa[];
  onClose: () => void;
  onEdit: (item: DanhMucHangHoa) => void;
  onDelete: (id: string) => void;
  onAddChild: (parent: DanhMucHangHoa) => void;
}

const DanhMucHangHoaDetail: React.FC<Props> = ({
  data,
  allDanhMuc,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
}) => {
  const { t } = useTranslation();
  const isActive = data.trang_thai === 1;
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
      isParent
        ? [
            {
              label: t('danhMucHangHoa.detail.addChild'),
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
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
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
      </div>
    </div>
  );

  return (
    <GenericDrawer
      title={t('danhMucHangHoa.detail.title')}
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
            <div className="mt-1.5">
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {t('common.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> {t('common.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection title={t('danhMucHangHoa.detail.basicInfo')} icon={<List size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('danhMucHangHoa.form.name')} value={data.ten_danh_muc} icon={<List size={12} />} />
            <DetailField label={t('danhMucHangHoa.form.code')} value={data.ma_danh_muc} icon={<List size={12} />} />
            <DetailField
              label={t('danhMucHangHoa.form.parent')}
              value={parentItem ? parentItem.ten_danh_muc : t('danhMucHangHoa.detail.noParent')}
              icon={<Folder size={12} />}
              emptyText={t('danhMucHangHoa.detail.noParent')}
            />
            <DetailField label={t('danhMucHangHoa.detail.order')} value={String(data.thu_tu)} icon={<ArrowUpFromLine size={12} />} />
            <DetailField
              label={t('danhMucHangHoa.detail.description')}
              value={data.mo_ta ?? ''}
              icon={<FileText size={12} />}
              emptyText="—"
            />
            <DetailField
              label={t('common.status')}
              value={isActive ? t('common.active') : t('common.inactive')}
              icon={<Power size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={t('danhMucHangHoa.detail.systemInfo')} icon={<Calendar size={14} />} variant="primary">
          <DetailFieldGrid>
            <DetailField label={t('danhMucHangHoa.detail.createdAt')} value={formatDateShort(data.tg_tao)} icon={<Calendar size={12} />} />
            <DetailField label={t('danhMucHangHoa.detail.updated')} value={formatDateShort(data.tg_cap_nhat)} icon={<Calendar size={12} />} />
          </DetailFieldGrid>
        </DetailSection>

        {isParent && (
          <div className="w-full bg-card p-3.5 sm:p-4 rounded-xl border border-border shadow-sm space-y-2.5">
            <div className="flex items-center gap-3 pb-2">
              <div className="flex items-center gap-2 shrink-0">
                <Folder size={14} className="text-primary" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('danhMucHangHoa.detail.childrenSection')}
                </h4>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                  {children.length} {t('danhMucHangHoa.footerRecords')}
                </span>
              </div>
              <div className="flex-1 h-px border-b border-dashed border-border/80" aria-hidden />
              <Button
                type="button"
                size="sm"
                onClick={() => onAddChild(data)}
                className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0"
              >
                <Plus size={14} className="mr-1.5" />
                {t('danhMucHangHoa.detail.addChild')}
              </Button>
            </div>
            {children.length === 0 ? (
              <EmptyState
                title={t('danhMucHangHoa.detail.noChildren')}
                description={t('danhMucHangHoa.detail.noChildrenHint')}
                icon={<Folder className="w-10 h-10 text-muted-foreground" />}
                action={
                  <Button type="button" size="sm" onClick={() => onAddChild(data)} className="bg-primary text-white hover:bg-primary/90">
                    <Plus size={14} className="mr-2" />
                    {t('danhMucHangHoa.detail.addChild')}
                  </Button>
                }
              />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-[280px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs">{t('danhMucHangHoa.form.name')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs">{t('danhMucHangHoa.form.code')}</th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs">{t('common.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                      {children.map((child) => (
                        <tr key={child.id} className="hover:bg-muted/60">
                          <td className="px-4 py-2.5 font-medium text-foreground">{child.ten_danh_muc}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{child.ma_danh_muc}</td>
                          <td className="px-4 py-2.5">
                            {child.trang_thai === 1 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                {t('common.active')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                                {t('common.inactive')}
                              </span>
                            )}
                          </td>
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

export default DanhMucHangHoaDetail;
