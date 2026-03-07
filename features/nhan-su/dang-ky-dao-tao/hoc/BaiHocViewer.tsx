import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import DetailSection from '@/components/shared/DetailSection';
import type { BaiHoc } from '@/features/nhan-su/khoa-dao-tao/thiet-lap/core/types';

interface Props {
  baiHoc: BaiHoc;
  daXem: boolean;
  onMarkViewed: () => void;
  isMarking?: boolean;
}

const BaiHocViewer: React.FC<Props> = ({ baiHoc, daXem, onMarkViewed, isMarking }) => {
  const { t } = useTranslation();

  const embedId = baiHoc.video_youtube_url?.trim()
    ? (() => {
        const m = baiHoc.video_youtube_url!.match(/(?:v=|\/)([\w-]+)/);
        return m ? m[1] : null;
      })()
    : null;
  const links = baiHoc.tai_lieu_links ?? [];
  const files = baiHoc.tai_lieu_files ?? [];

  return (
    <div className="space-y-5 p-4">
      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
          <BookOpen size={24} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground leading-tight">{baiHoc.ten}</h2>
          {baiHoc.mo_ta && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{baiHoc.mo_ta}</p>
          )}
        </div>
        {!daXem && (
          <Button
            onClick={onMarkViewed}
            disabled={isMarking}
            className="shrink-0 bg-primary text-white hover:bg-primary/90"
          >
            <CheckCircle size={16} className="mr-2" />
            {isMarking ? t('common.saving') : t('dangKyDaoTao.danhDauDaXem')}
          </Button>
        )}
        {daXem && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            <CheckCircle size={14} /> {t('dangKyDaoTao.daXem')}
          </span>
        )}
      </div>

      {baiHoc.mo_ta && (
        <DetailSection title={t('khoaDaoTao.form.moTa')} variant="muted">
          <p className="text-sm text-foreground whitespace-pre-wrap">{baiHoc.mo_ta}</p>
        </DetailSection>
      )}

      {embedId && (
        <DetailSection title={t('thietLapKhoa.baiHoc.video')} icon={<BookOpen size={14} />} variant="primary">
          <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted">
            <iframe
              title="YouTube"
              src={`https://www.youtube.com/embed/${embedId}`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </DetailSection>
      )}
      {links.length > 0 && (
        <DetailSection title={t('thietLapKhoa.baiHoc.links')} variant="primary">
          <ul className="space-y-1.5">
            {links.map((url, i) => (
              <li key={i}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
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
                  <a
                    href={file.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-[200px]"
                  >
                    {file.link}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
    </div>
  );
};

export default BaiHocViewer;
