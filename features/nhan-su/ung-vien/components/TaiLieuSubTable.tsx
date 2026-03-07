import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFieldArray, Control, UseFormRegister } from 'react-hook-form';
import { FileText, Edit, Trash2, ExternalLink } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import type { TaiLieuUngVien } from '../core/types';
import type { UngVienFormValues } from '../core/schema';

const TAI_LIEU_NAME = 'tai_lieu' as const;

/** Bảng con Tài liệu (JSONB) – form mode, chuẩn như bảng con Lịch sử cấp phát thu hồi (TaiSanDetail). */
interface TaiLieuSubTableFormProps {
  control: Control<UngVienFormValues>;
  register: UseFormRegister<UngVienFormValues>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function TaiLieuSubTableForm({ control, register, onAdd, onRemove }: TaiLieuSubTableFormProps) {
  const { t } = useTranslation();
  const { fields } = useFieldArray({ control, name: TAI_LIEU_NAME });

  return (
    <GenericSubTableSection
      title={t('ungVien.form.taiLieu')}
      icon={<FileText size={14} className="text-primary" />}
      count={fields.length}
      addLabel={t('ungVien.form.addFile')}
      onAdd={onAdd}
      maxTableHeight="320px"
    >
      <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
        <tr>
          <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">#</th>
          <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('ungVien.form.tenFile')}</th>
          <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('ungVien.form.loaiFile')}</th>
          <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('ungVien.form.linkLabel')}</th>
          <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-24 bg-muted border-l border-border min-w-[96px]">
            {t('ungVien.form.actionsCol')}
          </th>
        </tr>
      </thead>
      <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
        {fields.length === 0 ? (
          <tr>
            <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-xs">
              {t('ungVien.detail.noDocuments')}
            </td>
          </tr>
        ) : (
          fields.map((field, index) => (
            <tr key={field.id} className="hover:bg-muted/60 transition-colors">
              <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
              <td className="px-4 py-2.5">
                <Input
                  placeholder={t('ungVien.form.tenFile')}
                  className="h-9 text-sm border-border w-full min-w-0"
                  {...register(`${TAI_LIEU_NAME}.${index}.ten_file`)}
                />
              </td>
              <td className="px-4 py-2.5">
                <Input
                  placeholder={t('ungVien.form.loaiFile')}
                  className="h-9 text-sm border-border w-full min-w-0"
                  {...register(`${TAI_LIEU_NAME}.${index}.loai`)}
                />
              </td>
              <td className="px-4 py-2.5">
                <Input
                  placeholder={t('ungVien.form.linkPlaceholder')}
                  className="h-9 text-sm border-border w-full min-w-0"
                  {...register(`${TAI_LIEU_NAME}.${index}.link`)}
                />
              </td>
              <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center gap-0.5">
                  <button
                    type="button"
                    className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                    title={t('common.edit')}
                    aria-label={t('common.edit')}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
                    title={t('common.delete')}
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </GenericSubTableSection>
  );
}

interface TaiLieuSubTableViewProps {
  items: TaiLieuUngVien[];
  /** Nút Thêm (ví dụ mở form sửa ứng viên để thêm tài liệu) */
  onAdd?: () => void;
  /** Sửa dòng (ví dụ mở form sửa ứng viên) */
  onEdit?: (doc: TaiLieuUngVien) => void;
  /** Xóa dòng */
  onDelete?: (doc: TaiLieuUngVien) => void;
}

/** Bảng con Tài liệu – view mode, chuẩn như bảng con Lịch sử cấp phát thu hồi (TaiSanDetail): Thêm, Sửa, Xóa. */
export function TaiLieuSubTableView({ items, onAdd, onEdit, onDelete }: TaiLieuSubTableViewProps) {
  const { t } = useTranslation();
  const list = items ?? [];
  const hasItems = list.length > 0;
  const showActions = onEdit != null || onDelete != null;

  return (
    <GenericSubTableSection
      title={t('ungVien.detail.taiLieu')}
      icon={<FileText size={14} className="text-primary" />}
      count={list.length}
      addLabel={t('ungVien.form.addFile')}
      onAdd={onAdd}
      emptyTitle={t('ungVien.detail.noDocuments')}
      emptyDescription={t('ungVien.detail.noDocuments')}
      emptyIcon={<FileText className="w-10 h-10 text-muted-foreground" />}
      maxTableHeight="320px"
    >
      {hasItems ? (
        <>
          <thead className="sticky top-0 z-[1] bg-muted border-b border-border">
            <tr>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">#</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('ungVien.form.tenFile')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('ungVien.form.loaiFile')}</th>
              <th className="px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap">{t('ungVien.form.linkLabel')}</th>
              {showActions && (
                <th className="sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-24 bg-muted border-l border-border min-w-[96px]">
                  {t('common.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
            {list.map((doc, index) => (
              <tr key={doc.id} className="hover:bg-muted/60 transition-colors">
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{index + 1}</td>
                <td className="px-4 py-2.5 text-foreground">{doc.ten_file || t('ungVien.noValue')}</td>
                <td className="px-4 py-2.5 text-foreground">{doc.loai || t('ungVien.noValue')}</td>
                <td className="px-4 py-2.5 text-foreground">
                  {doc.link ? (
                    <a
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline truncate max-w-[180px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                      {t('common.view')}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">{t('ungVien.noValue')}</span>
                  )}
                </td>
                {showActions && (
                  <td className="sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-0.5">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(doc)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-all"
                          title={t('common.edit')}
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(doc)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-all"
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
      ) : null}
    </GenericSubTableSection>
  );
}
