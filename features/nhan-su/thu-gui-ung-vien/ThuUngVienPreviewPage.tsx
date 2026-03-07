/**
 * Trang preview / in thư từ chối hoặc thư mời nhận việc theo mẫu (Mẫu phản hồi).
 * Route: /thu-gui-ung-vien/preview/:idUngVien/:loaiThu (loaiThu = tu-choi | moi-nhan-viec)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Printer, Download, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  exportThuUngVienToPDF,
  exportThuUngVienToXLSX,
  exportThuUngVienToDoc,
  type ThuUngVienExportFormat,
} from './utils/export-thu-ung-vien';
import { useUngViens } from '@/features/nhan-su/ung-vien/hooks/use-ung-vien';
import { useMauPhanHois } from '@/features/nhan-su/thiet-lap-tuyen-dung/hooks/use-mau-phan-hoi';
import { useThuGuiUngViens } from './hooks/use-thu-gui-ung-vien';
import { useUIStore } from '@/store/useStore';
import { getMaFromLoaiThu, isValidLoaiThu } from './core/constants';
import { fillTitle, fillContent } from './utils/fill-thu-ung-vien';

const FORMATS: { format: ThuUngVienExportFormat; labelKey: string; icon: React.ReactNode }[] = [
  { format: 'doc', labelKey: 'thuGuiUngVien.export.doc', icon: <FileType size={16} /> },
  { format: 'xlsx', labelKey: 'thuGuiUngVien.export.xlsx', icon: <FileSpreadsheet size={16} /> },
  { format: 'pdf', labelKey: 'thuGuiUngVien.export.pdf', icon: <FileText size={16} /> },
];

const ThuUngVienPreviewPage: React.FC = () => {
  const { t } = useTranslation();
  const { idUngVien, loaiThu } = useParams<{ idUngVien: string; loaiThu: string }>();
  const [searchParams] = useSearchParams();
  const letterId = searchParams.get('letterId');
  const navigate = useNavigate();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const { data: ungVienList = [], isLoading, isError, error, refetch } = useUngViens();
  const { data: mauPhanHoiList = [] } = useMauPhanHois();
  const { data: letterList = [] } = useThuGuiUngViens();

  const templateMa = loaiThu ? getMaFromLoaiThu(loaiThu) : undefined;
  const record = idUngVien ? ungVienList.find((u) => u.id === idUngVien) : undefined;
  const letter = letterId ? letterList.find((l) => l.id === letterId) : undefined;
  const draftNgay = searchParams.get('ngay_vao_lam');
  const draftBac = searchParams.get('bac_luong');
  const draftMuc = searchParams.get('muc_luong');
  const draftCoChe = searchParams.get('co_che_khac');
  const draftGhiChu = searchParams.get('ghi_chu_khac');
  const jobOfferData = useMemo(() => {
    if (loaiThu !== 'moi-nhan-viec') return undefined;
    if (letter) {
      return {
        ngay_vao_lam: letter.ngay_vao_lam ?? null,
        bac_luong: letter.bac_luong ?? null,
        muc_luong: letter.muc_luong ?? null,
        co_che_khac: letter.co_che_khac ?? null,
        ghi_chu_khac: letter.ghi_chu_khac ?? null,
      };
    }
    if (draftNgay != null || draftBac != null || draftMuc != null || draftCoChe != null || draftGhiChu != null) {
      return {
        ngay_vao_lam: draftNgay ?? null,
        bac_luong: draftBac ?? null,
        muc_luong: draftMuc ?? null,
        co_che_khac: draftCoChe ?? null,
        ghi_chu_khac: draftGhiChu ?? null,
      };
    }
    return { ngay_vao_lam: null, bac_luong: null, muc_luong: null, co_che_khac: null, ghi_chu_khac: null };
  }, [loaiThu, letter, draftNgay, draftBac, draftMuc, draftCoChe, draftGhiChu]);

  const template = useMemo(
    () =>
      templateMa
        ? mauPhanHoiList.find((m) => m.ma === templateMa && m.trang_thai === 1)
        : undefined,
    [mauPhanHoiList, templateMa]
  );

  const company = useMemo(
    () => ({
      companyName: companyInfo.companyName,
      phone: companyInfo.phone,
      email: companyInfo.email,
    }),
    [companyInfo.companyName, companyInfo.phone, companyInfo.email]
  );

  const [title, bodyHtml] = useMemo(() => {
    if (!record || !template) return ['', ''];
    const filledTitle = fillTitle(template.tieu_de, record, company, jobOfferData);
    const filledBody = fillContent(template.noi_dung_mau, record, company, jobOfferData);
    return [filledTitle, filledBody];
  }, [record, template, company, jobOfferData]);

  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const exportOptions = useMemo(
    () => ({
      title,
      bodyHtml,
      hoTen: record?.ho_ten,
      loaiThu: loaiThu ?? undefined,
    }),
    [title, bodyHtml, record?.ho_ten, loaiThu]
  );

  const handleDownload = useCallback(
    async (format: ThuUngVienExportFormat) => {
      if (!title && !bodyHtml) return;
      setExporting(true);
      setDownloadOpen(false);
      try {
        if (format === 'pdf') await exportThuUngVienToPDF(exportOptions);
        else if (format === 'xlsx') await exportThuUngVienToXLSX(exportOptions);
        else await exportThuUngVienToDoc(exportOptions);
      } finally {
        setExporting(false);
      }
    },
    [exportOptions, title, bodyHtml]
  );

  useEffect(() => {
    if (!record) return;
    const prev = document.title;
    document.title = `${t('thuGuiUngVien.previewTitle')} - ${record.ho_ten}`;
    return () => {
      document.title = prev;
    };
  }, [record, t]);

  const handleClose = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      window.close();
    }
  }, [navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (downloadOpen) setDownloadOpen(false);
        else handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, downloadOpen]);

  useEffect(() => {
    if (!downloadOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDownloadOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadOpen]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-label={t('common.loading')}
        />
      </div>
    );
  }

  const invalidLoaiThu = loaiThu == null || !isValidLoaiThu(loaiThu);
  const notFound = !isLoading && (invalidLoaiThu || !record || !template);
  const loadError = isError;

  if (notFound || loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {loadError
            ? (error?.message ?? t('thuGuiUngVien.previewLoadError'))
            : t('thuGuiUngVien.previewNotFound')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {loadError && (
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 font-medium"
            >
              {t('common.retry')}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            <X size={16} />
            {t('common.close')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="thu-ung-vien-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="main"
        aria-label={t('thuGuiUngVien.previewTitle')}
      >
        <div className="thu-ung-vien-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0 print:hidden">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDownloadOpen((o) => !o)}
                disabled={exporting}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted/50',
                  exporting && 'opacity-70 pointer-events-none'
                )}
              >
                <Download size={16} />
                {t('thuGuiUngVien.preview.download')}
                <ChevronDown size={14} className={cn('transition-transform', downloadOpen && 'rotate-180')} />
              </button>
              {downloadOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-card rounded-xl border border-border shadow-xl z-10">
                  {FORMATS.map((f) => (
                    <button
                      key={f.format}
                      type="button"
                      onClick={() => handleDownload(f.format)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60"
                    >
                      {f.icon}
                      {t(f.labelKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90"
            >
              <Printer size={16} />
              {t('thuGuiUngVien.print')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center print:p-0 print:overflow-visible">
          <div
            className="bg-white shadow-xl rounded-sm text-gray-900 font-sans text-[10pt] print:shadow-none"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <div className="thu-ung-vien-preview-content p-6 min-h-full">
              {title && <h1 className="text-[14pt] font-bold mb-4">{title}</h1>}
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          .thu-ung-vien-preview-backdrop { background: #fff; }
          .thu-ung-vien-preview-toolbar { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default ThuUngVienPreviewPage;
