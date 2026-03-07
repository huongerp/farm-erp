import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  List,
  ListTree,
  FileText,
  ArrowUpFromLine,
  Power,
  Plus,
  Folder,
  Calendar,
  Shield,
  FileEdit,
} from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import type { HangMucTaiChinh } from '../../../core/types';
import { formatDateShort } from '../../../../lib/utils';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailFieldGrid from '../../../../components/shared/DetailFieldGrid';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import EmptyState from '../../../../components/shared/EmptyState';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import Tooltip from '../../../../components/ui/Tooltip';
import { useUpdateDanhMucTaiChinh } from '../hooks/use-danh-muc-tai-chinh';
import { useConfirmStore } from '../../../../store/useConfirmStore';

interface Props {
  data: HangMucTaiChinh;
  allDanhMuc: HangMucTaiChinh[];
  onClose: () => void;
  onEdit: (item: HangMucTaiChinh) => void;
  onDelete: (id: string) => void;
  onAddChild: (parent: HangMucTaiChinh) => void;
  onOpenQuyenQuanLy: (item: HangMucTaiChinh) => void;
  onOpenQuyenDeXuat: (item: HangMucTaiChinh) => void;
}

const DanhMucTaiChinhDetail: React.FC<Props> = ({
  data,
  allDanhMuc,
  onClose,
  onEdit,
  onDelete,
  onAddChild,
  onOpenQuyenQuanLy,
  onOpenQuyenDeXuat,
}) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const updateMutation = useUpdateDanhMucTaiChinh();
  const isActive = data.trang_thai === 1;
  const isParent = data.id_cha === null;
  const parentItem = data.id_cha
    ? allDanhMuc.find((d) => d.id === data.id_cha)
    : null;

  const handleChangeStatus = () => {
    let selectedStatus: 0 | 1 = data.trang_thai === 1 ? 1 : 0;
    confirm({
      title: t('danhMucTaiChinh.detail.changeStatusTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm">{t('danhMucTaiChinh.detail.changeStatusMessage')}</p>
          <Select
            defaultValue={String(data.trang_thai)}
            options={[
              { label: t('common.activeStatus'), value: '1' },
              { label: t('common.inactiveStatus'), value: '0' },
            ]}
            onChange={(e) => {
              selectedStatus = parseInt(e.target.value, 10) as 0 | 1;
            }}
          />
        </div>
      ),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await updateMutation.mutateAsync({
          id: data.id,
          data: {
            ma_danh_muc: data.ma_danh_muc,
            ten_danh_muc: data.ten_danh_muc,
            loai: data.loai,
            id_cha: data.id_cha ?? undefined,
            thu_tu: data.thu_tu,
            mo_ta: data.mo_ta ?? undefined,
            trang_thai: selectedStatus,
          },
        });
      },
    });
  };

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('danhMucTaiChinh.detail.changeStatus'),
      icon: <Power size={16} />,
      onClick: handleChangeStatus,
      variant: 'info',
      disabled: updateMutation.isPending,
    },
    ...(isParent
      ? [
          {
            label: t('danhMucTaiChinh.detail.addChild'),
            icon: <Plus size={16} />,
            onClick: () => onAddChild(data),
            variant: 'primary' as const,
          },
        ]
      : []),
  ];

  const children = useMemo(
    () =>
      allDanhMuc
        .filter((d) => d.id_cha === data.id)
        .sort((a, b) => a.thu_tu - b.thu_tu),
    [allDanhMuc, data.id]
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
      title={t('danhMucTaiChinh.detail.title')}
      subtitle={data.ma_danh_muc}
      icon={<List size={18} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <ListTree size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">
              {data.ten_danh_muc}
            </h2>
            <p className="text-body-sm text-muted-foreground font-mono mt-0.5">
              {data.ma_danh_muc}
            </p>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                  data.loai === 'thu'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200'
                }`}
              >
                {data.loai === 'thu'
                  ? t('danhMucTaiChinh.loaiThu')
                  : t('danhMucTaiChinh.loaiChi')}
              </span>
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />{' '}
                  {t('common.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />{' '}
                  {t('common.inactive')}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={t('danhMucTaiChinh.detail.basicInfo')}
          icon={<ListTree size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('danhMucTaiChinh.form.tenDanhMuc')}
              value={data.ten_danh_muc}
              icon={<ListTree size={12} />}
            />
            <DetailField
              label={t('danhMucTaiChinh.form.maDanhMuc')}
              value={data.ma_danh_muc}
              icon={<FileText size={12} />}
            />
            <DetailField
              label={t('danhMucTaiChinh.form.loai')}
              value={
                data.loai === 'thu'
                  ? t('danhMucTaiChinh.loaiThu')
                  : t('danhMucTaiChinh.loaiChi')
              }
              icon={<List size={12} />}
            />
            <DetailField
              label={t('danhMucTaiChinh.form.parent')}
              value={parentItem ? parentItem.ten_danh_muc : t('danhMucTaiChinh.detail.noParent')}
              icon={<Folder size={12} />}
              emptyText={t('danhMucTaiChinh.detail.noParent')}
            />
            <DetailField
              label={t('danhMucTaiChinh.form.thuTu')}
              value={String(data.thu_tu)}
              icon={<ArrowUpFromLine size={12} />}
            />
            <DetailField
              label={t('danhMucTaiChinh.form.moTa')}
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

        <DetailSection
          title={t('danhMucTaiChinh.detail.systemInfo')}
          icon={<Calendar size={14} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={t('danhMucTaiChinh.detail.updated')}
              value={formatDateShort(data.tg_cap_nhat)}
              icon={<Calendar size={12} />}
            />
          </DetailFieldGrid>
        </DetailSection>

        {isParent && (
          <div className="w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
              <div className="flex items-center gap-2 shrink-0">
                <ListTree size={14} className="text-primary" />
                <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-primary font-bold">
                  {t('danhMucTaiChinh.detail.childrenSection')}
                </h4>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
                  {children.length} {t('danhMucTaiChinh.footerRecords')}
                </span>
              </div>
              <div
                className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1"
                aria-hidden
              />
              <Button
                type="button"
                size="sm"
                onClick={() => onAddChild(data)}
                className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0"
              >
                <Plus size={14} className="mr-1.5" />
                {t('danhMucTaiChinh.detail.addChild')}
              </Button>
            </div>
            {children.length === 0 ? (
              <EmptyState
                title={t('danhMucTaiChinh.detail.noChildren')}
                description={t('danhMucTaiChinh.detail.noChildrenHint')}
                icon={<Folder className="w-10 h-10 text-muted-foreground" />}
                action={
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onAddChild(data)}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <Plus size={14} className="mr-2" />
                    {t('danhMucTaiChinh.detail.addChild')}
                  </Button>
                }
              />
            ) : (
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="overflow-x-auto max-h-[320px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                          {t('danhMucTaiChinh.columns.tenDanhMuc')}
                        </th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                          {t('danhMucTaiChinh.columns.maDanhMuc')}
                        </th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap max-w-[180px]">
                          {t('danhMucTaiChinh.columns.moTa')}
                        </th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">
                          {t('common.status')}
                        </th>
                        <th className="px-4 py-2 font-semibold text-foreground/80 text-xs text-center min-w-[160px]">
                          {t('common.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
                      {children.map((child) => (
                        <tr
                          key={child.id}
                          className="hover:bg-muted/60 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-medium text-foreground">
                            {child.ten_danh_muc}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                              {child.ma_danh_muc}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 max-w-[180px]">
                            <span className="text-xs text-muted-foreground line-clamp-2">
                              {child.mo_ta ?? '—'}
                            </span>
                          </td>
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
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-0.5 flex-wrap">
                              <Tooltip content={t('common.edit')} placement="top">
                                <button
                                  type="button"
                                  onClick={() => onEdit(child)}
                                  className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                                >
                                  <Edit size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip content={t('common.delete')} placement="top">
                                <button
                                  type="button"
                                  onClick={() => onDelete(child.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip
                                content={t('danhMucTaiChinh.quyenQuanLy')}
                                placement="top"
                              >
                                <button
                                  type="button"
                                  onClick={() => onOpenQuyenQuanLy(child)}
                                  className="p-1.5 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-md transition-all"
                                >
                                  <Shield size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip
                                content={t('danhMucTaiChinh.quyenDeXuat')}
                                placement="top"
                              >
                                <button
                                  type="button"
                                  onClick={() => onOpenQuyenDeXuat(child)}
                                  className="p-1.5 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-md transition-all"
                                >
                                  <FileEdit size={14} />
                                </button>
                              </Tooltip>
                            </div>
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

export default DanhMucTaiChinhDetail;
