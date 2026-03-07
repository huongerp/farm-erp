import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Edit, Trash2 } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import DetailToolbar, { DetailToolbarAction } from '@/components/shared/DetailToolbar';
import DetailSection from '@/components/shared/DetailSection';
import Button from '@/components/ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '@/lib/button-labels';
import type { BaiHoc } from '../core/types';

interface Props {
  baiHoc: BaiHoc;
  onClose: () => void;
  onEdit: (item: BaiHoc) => void;
  onDelete: (id: string) => void;
}

const BaiHocDetailDrawer: React.FC<Props> = ({ baiHoc, onClose, onEdit, onDelete }) => {
  const { t } = useTranslation();

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: BTN_EDIT(),
      icon: <Edit size={16} />,
      variant: 'primary',
      onClick: () => { onClose(); onEdit(baiHoc); },
    },
    {
      label: BTN_DELETE(),
      icon: <Trash2 size={16} />,
      variant: 'danger',
      onClick: () => { onClose(); onDelete(baiHoc.id); },
    },
  ];

  const footer = (
    <div className="flex items-center justify-between w-full flex-wrap gap-2">
      <Button
        variant="ghost"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={() => { onClose(); onEdit(baiHoc); }} className="bg-primary text-white shadow-lg hover:bg-primary/90">
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        <Button
          variant="ghost"
          onClick={() => { onClose(); onDelete(baiHoc.id); }}
          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800"
        >
          <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
        </Button>
      </div>
    </div>
  );

  const embedId = baiHoc.video_youtube_url?.trim()
    ? (() => {
        const m = baiHoc.video_youtube_url!.match(/(?:v=|\/)([\w-]+)/);
        return m ? m[1] : null;
      })()
    : null;

  const links = baiHoc.tai_lieu_links ?? [];
  const files = baiHoc.tai_lieu_files ?? [];

  return (
    <GenericDrawer
      title={baiHoc.ten}
      subtitle={t('thietLapKhoa.baiHoc.title')}
      icon={<BookOpen size={20} className="text-primary" />}
      onClose={onClose}
      footer={footer}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <BookOpen size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{baiHoc.ten}</h2>
            <p className="text-body-sm text-muted-foreground mt-0.5">{t('thietLapKhoa.baiHoc.title')}</p>
            {baiHoc.mo_ta && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{baiHoc.mo_ta}</p>}
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        {baiHoc.mo_ta && (
          <DetailSection title={t('khoaDaoTao.form.moTa')} variant="muted">
            <p className="text-sm text-foreground whitespace-pre-wrap">{baiHoc.mo_ta}</p>
          </DetailSection>
        )}

        {(embedId || links.length > 0 || files.length > 0) && (
          <>
            {embedId && (
              <DetailSection title={t('thietLapKhoa.baiHoc.video')} icon={<BookOpen size={14} />} variant="primary">
                <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  <iframe title="YouTube" src={`https://www.youtube.com/embed/${embedId}`} className="w-full h-full" allowFullScreen />
                </div>
              </DetailSection>
            )}
            {links.length > 0 && (
              <DetailSection title={t('thietLapKhoa.baiHoc.links')} variant="primary">
                <ul className="space-y-1.5">
                  {links.map((url, i) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}
            {files.length > 0 && (
              <DetailSection title={t('thietLapKhoa.baiHoc.files')} variant="primary">
                <ul className="space-y-2">
                  {files.map((file, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">{file.ten_file}</span>
                      {file.link && (
                        <a href={file.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[200px]">
                          {file.link}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </DetailSection>
            )}
          </>
        )}
      </div>
    </GenericDrawer>
  );
};

export default BaiHocDetailDrawer;
