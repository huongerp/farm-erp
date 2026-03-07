import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, FileText, ExternalLink } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import type { DoiThuTaiLieu } from '../core/types';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import { useTaiLieu, useThemTaiLieu, useCapNhatTaiLieu, useXoaTaiLieu } from '../hooks/use-phan-tich-doi-thu';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_DELETE, BTN_ADD } from '../../../../lib/button-labels';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';

const LOAI_OPTIONS: { value: DoiThuTaiLieu['loai']; labelKey: string }[] = [
  { value: 'bao_gia', labelKey: 'phanTichDoiThu.detail.baoGia' },
  { value: 'anh_nang_luc', labelKey: 'phanTichDoiThu.detail.anhNangLuc' },
  { value: 'anh_quang_cao', labelKey: 'phanTichDoiThu.detail.anhQuangCao' },
  { value: 'link_bai_bao', labelKey: 'phanTichDoiThu.detail.linkBaiBao' },
];

function getLoaiTaiLieuLabel(loai: DoiThuTaiLieu['loai'], t: (k: string) => string): string {
  const key: Record<DoiThuTaiLieu['loai'], string> = {
    bao_gia: 'phanTichDoiThu.detail.baoGia',
    anh_nang_luc: 'phanTichDoiThu.detail.anhNangLuc',
    anh_quang_cao: 'phanTichDoiThu.detail.anhQuangCao',
    link_bai_bao: 'phanTichDoiThu.detail.linkBaiBao',
  };
  return t(key[loai]);
}

interface Props {
  doiThuId: string;
}

const TabTaiLieu: React.FC<Props> = ({ doiThuId }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: taiLieu = [], isLoading } = useTaiLieu(doiThuId);
  const themMutation = useThemTaiLieu(doiThuId);
  const capNhatMutation = useCapNhatTaiLieu(doiThuId);
  const xoaMutation = useXoaTaiLieu(doiThuId);

  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DoiThuTaiLieu | null>(null);
  const [formTenFile, setFormTenFile] = useState('');
  const [formLoai, setFormLoai] = useState<DoiThuTaiLieu['loai']>('bao_gia');

  const openAdd = () => {
    setEditingDoc(null);
    setFormTenFile('');
    setFormLoai('bao_gia');
    setShowForm(true);
  };

  const openEdit = (doc: DoiThuTaiLieu) => {
    setEditingDoc(doc);
    setFormTenFile(doc.ten_file);
    setFormLoai(doc.loai);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDoc(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ten = formTenFile.trim();
    if (!ten) return;
    if (editingDoc) {
      capNhatMutation.mutate(
        { id: editingDoc.id, data: { ten_file: ten, loai: formLoai } },
        { onSuccess: handleCloseForm }
      );
    } else {
      themMutation.mutate(
        { ten_file: ten, loai: formLoai },
        { onSuccess: handleCloseForm }
      );
    }
  };

  const handleDelete = (doc: DoiThuTaiLieu) => {
    confirm({
      title: t('phanTichDoiThu.taiLieu.deleteTitle'),
      message: t('phanTichDoiThu.taiLieu.deleteMessage'),
      variant: 'danger',
      confirmText: CONFIRM_DELETE(),
      onConfirm: () => xoaMutation.mutate(doc.id),
    });
  };

  const loaiSelectOptions = LOAI_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }));

  return (
    <div className="space-y-4">
      <GenericSubTableSection
        title={t('phanTichDoiThu.detail.khoTaiLieu')}
        icon={<FileText size={14} className="text-primary" />}
        count={taiLieu.length}
        addLabel={BTN_ADD()}
        onAdd={openAdd}
        loading={isLoading}
        loadingText={t('common.loading')}
        emptyTitle={t('phanTichDoiThu.taiLieuTongHop.empty')}
        emptyDescription={t('phanTichDoiThu.emptyHint')}
        emptyIcon={<FileText className="w-10 h-10 text-muted-foreground" />}
        maxTableHeight="320px"
      >
        {taiLieu.length > 0 ? (
          <>
            <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
              <tr>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">#</th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('phanTichDoiThu.taiLieu.tenFile')}</th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('phanTichDoiThu.taiLieu.loai')}</th>
                <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('phanTichDoiThu.taiLieu.linkCol')}</th>
                <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-24 bg-muted border-l border-border min-w-[96px]">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
              {taiLieu.map((doc, index) => (
                <tr key={doc.id} className="hover:bg-muted/60 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                  <td className="px-4 py-2.5 text-foreground">{doc.ten_file}</td>
                  <td className="px-4 py-2.5 text-foreground text-sm">{getLoaiTaiLieuLabel(doc.loai, t)}</td>
                  <td className="px-4 py-2.5">
                    {doc.duong_dan_file ? (
                      <a
                        href={doc.duong_dan_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline truncate max-w-[180px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                        {t('common.view')}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEdit(doc)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                        title={t('common.edit')}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                        title={t('common.delete')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </>
        ) : null}
      </GenericSubTableSection>

      {showForm && (
        <GenericDrawer
          title={editingDoc ? t('phanTichDoiThu.taiLieu.editTitle') : t('phanTichDoiThu.taiLieu.addTitle')}
          icon={<FileText size={18} />}
          onClose={handleCloseForm}
          stackLevel={1}
          footer={
            <FormDrawerFooter
              formId="tai-lieu-form"
              onCancel={handleCloseForm}
              isLoading={themMutation.isPending || capNhatMutation.isPending}
              isEdit={!!editingDoc}
              saveLabel={t('common.save')}
              createLabel={t('common.add')}
            />
          }
          maxWidthClass={DRAWER_WIDTH_FORM}
        >
          <form id="tai-lieu-form" onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('phanTichDoiThu.taiLieu.tenFile')}
              value={formTenFile}
              onChange={(e) => setFormTenFile(e.target.value)}
              placeholder={t('phanTichDoiThu.taiLieu.tenFilePlaceholder')}
              required
            />
            <Select
              label={t('phanTichDoiThu.taiLieu.loai')}
              options={loaiSelectOptions}
              value={formLoai}
              onChange={(e) => setFormLoai(e.target.value as DoiThuTaiLieu['loai'])}
            />
          </form>
        </GenericDrawer>
      )}
    </div>
  );
};

export default TabTaiLieu;
