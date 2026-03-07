import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '@/components/shared/GenericDrawer';
import FormSection from '@/components/shared/FormSection';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import Button from '@/components/ui/Button';
import type { BaiHoc } from '../core/types';
import { baiHocSchema, type BaiHocFormValues } from '../core/schema';
import { useCreateBaiHoc, useUpdateBaiHoc } from '../hooks/use-thiet-lap-khoa';

const MAX_LINKS = 10;
const MAX_FILES = 10;

const DEFAULT_VALUES: BaiHocFormValues = {
  ten: '',
  mo_ta: '',
  video_youtube_url: '',
  tai_lieu_links: [],
  tai_lieu_files: [],
};

interface Props {
  idChuong: string;
  initialData?: BaiHoc | null;
  onClose: () => void;
}

const BaiHocFormDrawer: React.FC<Props> = ({ idChuong, initialData, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const createMutation = useCreateBaiHoc(idChuong, onClose);
  const updateMutation = useUpdateBaiHoc(idChuong, onClose);

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<BaiHocFormValues>({
    resolver: zodResolver(baiHocSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const videoUrl = watch('video_youtube_url');
  const links = watch('tai_lieu_links') ?? [];
  const files = watch('tai_lieu_files') ?? [];

  useEffect(() => {
    if (initialData) {
      reset({
        ten: initialData.ten,
        mo_ta: initialData.mo_ta ?? '',
        video_youtube_url: initialData.video_youtube_url ?? '',
        tai_lieu_links: initialData.tai_lieu_links ?? [],
        tai_lieu_files: initialData.tai_lieu_files ?? [],
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const addLink = () => {
    if (links.length >= MAX_LINKS) return;
    setValue('tai_lieu_links', [...links, '']);
  };
  const removeLink = (i: number) => {
    setValue('tai_lieu_links', links.filter((_, idx) => idx !== i));
  };
  const setLink = (i: number, v: string) => {
    const next = [...links];
    next[i] = v;
    setValue('tai_lieu_links', next);
  };

  const addFile = () => {
    if (files.length >= MAX_FILES) return;
    setValue('tai_lieu_files', [...files, { ten_file: '', link: '' }]);
  };
  const removeFile = (i: number) => {
    setValue('tai_lieu_files', files.filter((_, idx) => idx !== i));
  };
  const setFile = (i: number, field: 'ten_file' | 'link', v: string) => {
    const next = [...files];
    next[i] = { ...next[i], [field]: v };
    setValue('tai_lieu_files', next);
  };

  const onSubmit: SubmitHandler<BaiHocFormValues> = (data) => {
    const sanitized = {
      ten: data.ten.trim(),
      mo_ta: data.mo_ta?.trim() || undefined,
      video_youtube_url: data.video_youtube_url?.trim() || undefined,
      tai_lieu_links: (data.tai_lieu_links ?? []).filter((s) => s.trim()).map((s) => s.trim()),
      tai_lieu_files: (data.tai_lieu_files ?? []).filter((f) => f.ten_file.trim()).map((f) => ({ ten_file: f.ten_file.trim(), link: f.link?.trim() })),
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitized });
    } else {
      createMutation.mutate(sanitized);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const embedId = videoUrl?.trim() ? (() => {
    const m = videoUrl.match(/(?:v=|\/)([\w-]+)/);
    return m ? m[1] : null;
  })() : null;

  return (
    <GenericDrawer
      title={isEdit ? t('thietLapKhoa.baiHoc.edit') : t('thietLapKhoa.baiHoc.add')}
      icon={<BookOpen size={20} />}
      onClose={onClose}
      footer={<FormDrawerFooter formId="bai-hoc-form" onCancel={onClose} isLoading={isLoading} isEdit={isEdit} />}
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="bai-hoc-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormSection title={t('thietLapKhoa.baiHoc.title')}>
          <div className="space-y-3">
            <Input {...register('ten')} label={t('khoaDaoTao.form.ten')} placeholder={t('khoaDaoTao.form.tenPlaceholder')} error={errors.ten?.message} required autoFocus />
            <Textarea {...register('mo_ta')} label={t('khoaDaoTao.form.moTa')} placeholder={t('khoaDaoTao.form.moTaPlaceholder')} rows={2} error={errors.mo_ta?.message} />
          </div>
        </FormSection>
        <FormSection title={t('thietLapKhoa.baiHoc.video')}>
          <Input {...register('video_youtube_url')} placeholder={t('thietLapKhoa.baiHoc.videoPlaceholder')} error={errors.video_youtube_url?.message} />
          {embedId && (
            <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
              <iframe title="YouTube preview" src={`https://www.youtube.com/embed/${embedId}`} className="w-full h-full" allowFullScreen />
            </div>
          )}
        </FormSection>
        <FormSection title={t('thietLapKhoa.baiHoc.links')}>
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input value={link} onChange={(e) => setLink(i, e.target.value)} placeholder="https://..." className="flex-1" />
              <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeLink(i)}><Trash2 size={14} /></Button>
            </div>
          ))}
          {links.length < MAX_LINKS && <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addLink}><Plus size={14} /> {t('thietLapKhoa.baiHoc.addLink')}</Button>}
        </FormSection>
        <FormSection title={t('thietLapKhoa.baiHoc.files')}>
          {files.map((file, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input value={file.ten_file} onChange={(e) => setFile(i, 'ten_file', e.target.value)} placeholder={t('thietLapKhoa.baiHoc.tenFilePlaceholder')} className="flex-1" />
              <Input value={file.link ?? ''} onChange={(e) => setFile(i, 'link', e.target.value)} placeholder={t('thietLapKhoa.baiHoc.urlFilePlaceholder')} className="flex-1" />
              <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeFile(i)}><Trash2 size={14} /></Button>
            </div>
          ))}
          {files.length < MAX_FILES && <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addFile}><Plus size={14} /> {t('thietLapKhoa.baiHoc.addFile')}</Button>}
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default BaiHocFormDrawer;
