import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Edit, FileText, MessageSquare, ListTree, Plus, Send, Link2, User, Trash2, Power, FileEdit } from 'lucide-react';
import i18n from '../../../../lib/i18n';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import DetailToolbar from '../../../../components/shared/DetailToolbar';
import { useNotificationStore } from '../../../../store/useNotificationStore';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import TabGroup from '../../../../components/ui/TabGroup';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../../../lib/button-labels';
import type { CongViec, BaoCaoKetQua, BinhLuanCongViec } from '../core/types';
import type { CongViecTrangThai } from '../core/types';
import { getTrangThaiLabel, getUuTienLabel, getTrangThaiOptions } from '../core/constants';
import { BaoCaoKetQuaFormValues, baoCaoKetQuaSchema, BinhLuanFormValues, binhLuanSchema } from '../core/schema';
import {
  useBaoCaoByCongViecId,
  useCreateBaoCaoKetQua,
  useBinhLuanByCongViecId,
  useCreateBinhLuan,
  useCongViecList,
  useUpdateCongViec,
} from '../hooks/use-cong-viec';
const TAB_IDS = { info: 'info', baoCao: 'baoCao', binhLuan: 'binhLuan', con: 'con' } as const;

interface Props {
  data: CongViec;
  onClose: () => void;
  onEdit: (item: CongViec) => void;
  /** Xóa công việc này (parent hiển thị confirm rồi gọi delete). */
  onDelete?: (id: string) => void;
  onAddChild?: (parentId: string) => void;
  onDeleteChild?: (id: string) => void;
  /** Drawer chồng (vd: mở từ detail Dự án). >= 1 để z-index cao hơn. */
  stackLevel?: number;
}

const CongViecDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, onAddChild, onDeleteChild, stackLevel = 0 }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(TAB_IDS.info);
  const [showBaoCaoForm, setShowBaoCaoForm] = useState(false);
  const [showTrangThaiDialog, setShowTrangThaiDialog] = useState(false);

  const { data: baoCaoList = [] } = useBaoCaoByCongViecId(data.id);
  const { data: binhLuanList = [] } = useBinhLuanByCongViecId(data.id);
  const { data: allCongViec = [] } = useCongViecList();
  const children = allCongViec.filter((c) => c.id_cha === data.id);
  const updateMutation = useUpdateCongViec(() => setShowTrangThaiDialog(false));
  const trangThaiOptions = useMemo(() => getTrangThaiOptions(t), [t]);

  const createBaoCao = useCreateBaoCaoKetQua(data.id, () => {
    setShowBaoCaoForm(false);
    useNotificationStore.getState().add({
      title: i18n.t('congViec.notif.reportSubmitted'),
      message: data.tieu_de,
      type: 'info',
      link: `/hanh-chinh/cong-viec-cua-toi?detail=${data.id}`,
    });
  });
  const createBinhLuan = useCreateBinhLuan(data.id);

  const {
    register: regBaoCao,
    handleSubmit: handleBaoCaoSubmit,
    formState: { errors: errBaoCao },
    reset: resetBaoCao,
    control: controlBaoCao,
  } = useForm<BaoCaoKetQuaFormValues>({
    resolver: zodResolver(baoCaoKetQuaSchema),
    defaultValues: { noi_dung: '', links: [], file_dinh_kem: '' },
  });

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    control: controlBaoCao,
    name: 'links',
  });

  const {
    register: regBinhLuan,
    handleSubmit: handleBinhLuanSubmit,
    formState: { errors: errBinhLuan },
    reset: resetBinhLuan,
  } = useForm<BinhLuanFormValues>({
    resolver: zodResolver(binhLuanSchema),
    defaultValues: { noi_dung: '' },
  });

  const onBaoCaoSubmit: SubmitHandler<BaoCaoKetQuaFormValues> = (values) => {
    const linksFiltered = (values.links ?? []).filter((u) => typeof u === 'string' && u.trim().length > 0);
    createBaoCao.mutate(
      {
        noi_dung: values.noi_dung,
        links: linksFiltered,
        file_dinh_kem: values.file_dinh_kem ?? '',
      },
      { onSuccess: () => resetBaoCao() }
    );
  };

  const onBinhLuanSubmit: SubmitHandler<BinhLuanFormValues> = (values) => {
    createBinhLuan.mutate(values.noi_dung, { onSuccess: () => resetBinhLuan() });
  };

  const tabs = [
    { id: TAB_IDS.info, label: t('congViec.detail.tabInfo'), icon: ClipboardList },
    { id: TAB_IDS.baoCao, label: t('congViec.detail.tabBaoCao'), icon: FileText },
    { id: TAB_IDS.binhLuan, label: t('congViec.detail.tabBinhLuan'), icon: MessageSquare },
    { id: TAB_IDS.con, label: t('congViec.detail.tabCon'), icon: ListTree },
  ];

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
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
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => onDelete(data.id)}
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
      title={data.tieu_de}
      icon={<ClipboardList size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass="max-w-2xl"
      stackLevel={stackLevel}
    >
      {/* Summary card — trên nội dung detail */}
      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4 mb-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
          <ClipboardList size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.tieu_de}</h2>
          <p className="text-body-sm text-muted-foreground font-mono mt-0.5">{data.ma_cong_viec}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground text-xs font-medium border border-border">
              {getTrangThaiLabel(data.trang_thai, t)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('congViec.form.ngayHetHan')}: {formatDate(data.ngay_het_han)}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
              {data.phan_tram_hoan_thanh}%
            </span>
          </div>
        </div>
      </div>

      <DetailToolbar
        actions={[
          {
            label: t('congViec.detail.actionTrangThai'),
            icon: <Power size={16} />,
            onClick: () => setShowTrangThaiDialog(true),
            variant: 'secondary',
          },
          {
            label: t('congViec.detail.actionBaoCao'),
            icon: <FileEdit size={16} />,
            onClick: () => {
              setActiveTab(TAB_IDS.baoCao);
              setShowBaoCaoForm(true);
            },
            variant: 'info',
          },
          {
            label: t('congViec.detail.addCon'),
            icon: <ListTree size={16} />,
            onClick: () => {
              setActiveTab(TAB_IDS.con);
              onAddChild?.(data.id);
            },
            variant: 'primary',
          },
        ]}
        className="mb-4"
      />

      {showTrangThaiDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" style={{ margin: 0 }} onClick={() => setShowTrangThaiDialog(false)}>
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-sm w-full p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground">{t('congViec.detail.actionTrangThai')}</h3>
            <div className="flex flex-col gap-1.5">
              {trangThaiOptions.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={data.trang_thai === opt.value ? 'primary' : 'outline'}
                  size="sm"
                  className="justify-start"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    updateMutation.mutate(
                      { id: data.id, data: { trang_thai: opt.value as CongViecTrangThai } },
                      { onSuccess: () => setShowTrangThaiDialog(false) }
                    );
                  }}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setShowTrangThaiDialog(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      <TabGroup tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-4" />

      {activeTab === TAB_IDS.info && (
        <div className="space-y-5">
          <DetailSection title={t('congViec.form.basicInfo')} icon={<ClipboardList size={14} />} variant="primary">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label={t('congViec.form.maCongViec')} value={data.ma_cong_viec} />
              <DetailField label={t('congViec.form.tieuDe')} value={data.tieu_de} />
              <DetailField label={t('congViec.form.duAn')} value={data.ten_du_an || '—'} />
              <DetailField label={t('congViec.form.nguoiGiao')} value={data.ten_nguoi_giao || data.id_nguoi_giao} />
              <DetailField
                label={t('congViec.form.nguoiThucHien')}
                value={
                  (data.ten_nguoi_thuc_hien && data.ten_nguoi_thuc_hien.length > 0
                    ? data.ten_nguoi_thuc_hien.join(', ')
                    : data.danh_sach_nguoi_thuc_hien?.length
                      ? data.danh_sach_nguoi_thuc_hien.join(', ')
                      : '—') as string
                }
              />
              <DetailField label={t('congViec.form.uuTien')} value={getUuTienLabel(data.uu_tien, t)} />
              <DetailField label={t('congViec.form.trangThai')} value={getTrangThaiLabel(data.trang_thai, t)} />
              <DetailField label={t('congViec.form.ngayHetHan')} value={formatDate(data.ngay_het_han)} />
              <DetailField label={t('congViec.form.tienDo')} value={`${data.phan_tram_hoan_thanh}%`} />
              {data.mo_ta ? (
                <div className="col-span-1 sm:col-span-2">
                  <DetailField label={t('congViec.form.moTa')} value={data.mo_ta} />
                </div>
              ) : null}
              <DetailField label={t('congViec.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} />
            </div>
          </DetailSection>
        </div>
      )}

      {activeTab === TAB_IDS.baoCao && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">{t('congViec.baoCaoKetQua.list')}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBaoCaoForm(!showBaoCaoForm)}
              className="gap-2"
            >
              <Plus size={14} />
              {t('congViec.baoCaoKetQua.add')}
            </Button>
          </div>
          {showBaoCaoForm && (
            <form onSubmit={handleBaoCaoSubmit(onBaoCaoSubmit)} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
              <Textarea
                label={t('congViec.baoCaoKetQua.form.noiDung')}
                required
                {...regBaoCao('noi_dung')}
                error={errBaoCao.noi_dung?.message}
              />
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium text-foreground">{t('congViec.baoCaoKetQua.form.links')}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendLink('')}
                    className="gap-1"
                  >
                    <Plus size={14} />
                    {t('congViec.baoCaoKetQua.form.addLink')}
                  </Button>
                </div>
                {linkFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <Input
                      placeholder="https://..."
                      className="flex-1"
                      {...regBaoCao(`links.${index}`)}
                      error={Array.isArray(errBaoCao.links) ? errBaoCao.links[index]?.message : undefined}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLink(index)}
                      className="shrink-0 text-muted-foreground hover:text-rose-600"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <Input
                label={t('congViec.baoCaoKetQua.form.fileDinhKem')}
                {...regBaoCao('file_dinh_kem')}
                error={errBaoCao.file_dinh_kem?.message}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={createBaoCao.isPending}>
                  {t('congViec.baoCaoKetQua.submit')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowBaoCaoForm(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
          <ul className="space-y-3">
            {baoCaoList.length === 0 && !showBaoCaoForm && (
              <li className="text-sm text-muted-foreground py-4">{t('congViec.baoCaoKetQua.empty')}</li>
            )}
            {baoCaoList.map((b: BaoCaoKetQua) => (
              <li key={b.id} className="p-3 rounded-lg border border-border bg-card text-sm">
                <div className="flex justify-between gap-2 mb-1">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <User size={14} className="text-muted-foreground" />
                    {b.ten_nguoi_bao_cao || b.nguoi_bao_cao_id}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDateTimeShort(b.tg_bao_cao)}</span>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{b.noi_dung}</p>
                {b.links && b.links.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {b.links.filter(Boolean).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Link2 size={12} />
                        {url.slice(0, 40)}…
                      </a>
                    ))}
                  </div>
                )}
                {b.file_dinh_kem && (
                  <p className="mt-1 text-xs text-muted-foreground">{t('congViec.baoCaoKetQua.file')}: {b.file_dinh_kem}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === TAB_IDS.binhLuan && (
        <div className="space-y-4">
          <form onSubmit={handleBinhLuanSubmit(onBinhLuanSubmit)} className="flex gap-2">
            <Textarea
              label={t('congViec.binhLuan.noiDung')}
              placeholder={t('congViec.binhLuan.placeholder')}
              required
              className="min-h-[80px] flex-1"
              {...regBinhLuan('noi_dung')}
              error={errBinhLuan.noi_dung?.message}
            />
            <Button type="submit" size="sm" className="shrink-0 gap-1" loading={createBinhLuan.isPending}>
              <Send size={14} />
              {t('congViec.binhLuan.send')}
            </Button>
          </form>
          <ul className="space-y-3">
            {binhLuanList.length === 0 && (
              <li className="text-sm text-muted-foreground py-4">{t('congViec.binhLuan.empty')}</li>
            )}
            {binhLuanList.map((c: BinhLuanCongViec) => (
              <li key={c.id} className="p-3 rounded-lg border border-border bg-card text-sm">
                <div className="flex justify-between gap-2 mb-1">
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <User size={14} className="text-muted-foreground" />
                    {c.ten_nguoi_gui || c.nguoi_gui_id}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDateTimeShort(c.tg_gui)}</span>
                </div>
                <p className="text-foreground whitespace-pre-wrap">{c.noi_dung}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === TAB_IDS.con && (
        <DetailSection
          title={t('congViec.detail.conList')}
          icon={<ListTree size={14} />}
          variant="primary"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {children.length === 0
                  ? t('congViec.detail.conEmpty')
                  : t('congViec.detail.conCount', { count: children.length })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddChild?.(data.id)}
                className="gap-2 shrink-0"
              >
                <Plus size={14} />
                {t('congViec.detail.addCon')}
              </Button>
            </div>
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg bg-muted/20">
                {t('congViec.detail.conEmpty')}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium">{t('congViec.store.maCol')}</th>
                      <th className="text-left px-3 py-2 font-medium">{t('congViec.store.tieuDeCol')}</th>
                      <th className="text-left px-3 py-2 font-medium">{t('congViec.store.trangThaiCol')}</th>
                      <th className="text-left px-3 py-2 font-medium">{t('congViec.store.ngayHetHanCol')}</th>
                      <th className="text-right px-3 py-2 font-medium w-28">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {children.map((c) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono text-xs">{c.ma_cong_viec}</td>
                        <td className="px-3 py-2 line-clamp-1">{c.tieu_de}</td>
                        <td className="px-3 py-2">{getTrangThaiLabel(c.trang_thai, t)}</td>
                        <td className="px-3 py-2 tabular-nums">{formatDate(c.ngay_het_han)}</td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(c)} className="h-8">
                              {t('common.edit')}
                            </Button>
                            {onDeleteChild && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteChild(c.id)}
                                className="h-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              >
                                <Trash2 size={14} />
                                {t('common.delete')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DetailSection>
      )}
    </GenericDrawer>
  );
};

export default CongViecDetail;
