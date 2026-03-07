/**
 * Trang preview phiếu lương A4 – toolbar: In, Tải (dropdown Doc / Excel / PDF)
 */
import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Printer, Download, ChevronDown, FileText, FileSpreadsheet, FileType } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { BangLuongRecord } from '../core/types';
import type { BangLuongExportFormat } from '../utils/export-bang-luong';
import { exportBangLuongPDF, exportBangLuongExcel, exportBangLuongDoc } from '../utils/export-bang-luong';
import PayslipPreviewContent from './PayslipPreviewContent';

interface Props {
  record: BangLuongRecord;
  onClose: () => void;
}

const FORMATS: { format: BangLuongExportFormat; labelKey: string; icon: React.ReactNode }[] = [
  { format: 'doc', labelKey: 'bangLuong.export.doc', icon: <FileType size={16} /> },
  { format: 'excel', labelKey: 'bangLuong.export.excel', icon: <FileSpreadsheet size={16} /> },
  { format: 'pdf', labelKey: 'bangLuong.export.pdf', icon: <FileText size={16} /> },
];

const PayslipPreviewModal: React.FC<Props> = ({ record, onClose }) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (downloadOpen) setDownloadOpen(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [downloadOpen, onClose]);

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

  const handleDownload = async (format: BangLuongExportFormat) => {
    setExporting(true);
    setDownloadOpen(false);
    try {
      if (format === 'pdf') await exportBangLuongPDF(record);
      else if (format === 'excel') await exportBangLuongExcel(record);
      else await exportBangLuongDoc(record);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div
        className="payslip-preview-backdrop fixed inset-0 z-[70] flex flex-col bg-muted/90"
        role="dialog"
        aria-modal="true"
        aria-label={t('bangLuong.preview.title')}
      >
        {/* Toolbar */}
        <div className="payslip-preview-toolbar flex items-center justify-between gap-3 px-4 py-3 bg-card border-b border-border shadow-sm shrink-0">
          <button
            type="button"
            onClick={onClose}
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
                {t('bangLuong.preview.download')}
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
              {t('bangLuong.preview.print')}
            </button>
          </div>
        </div>

        {/* A4 preview */}
        <div className="flex-1 overflow-auto p-4 md:p-6 flex justify-center">
          <div
            ref={contentRef}
            className="bg-white shadow-xl rounded-sm"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <PayslipPreviewContent record={record} />
          </div>
        </div>
      </div>
    </>
  );
};

export default PayslipPreviewModal;
