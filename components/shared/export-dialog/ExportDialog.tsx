import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, X, FileSpreadsheet, FileText, Sheet, AlertTriangle } from 'lucide-react';
import Button from '../../ui/Button';
import { cn, formatDateShort, getTodayISODate } from '../../../lib/utils';
import { useEnterTransition } from '../../../lib/usePresenceTransition';
import { DIALOG_SIZE } from '../../../lib/dialog-sizes';
import { dinhDangOXuat, mauSoCotSheet, type ExportColumn } from '../../../lib/export/dinh-dang-o';
import { sheetsClient, SheetsLoi } from '../../../lib/sheets-client';
import ChonCot from './ChonCot';
import GoogleSheetPanel, { type CauHinhSheet } from './GoogleSheetPanel';
import CauHinhDongBo, { type CauHinhDongBoValue } from './CauHinhDongBo';
import LichDongBoPanel from './LichDongBoPanel';
import { useLichDongBo } from './use-lich-dong-bo';
import { useCotXuat } from './use-cot-xuat';
import { useGoogleKetNoi } from './use-google-ket-noi';
import { xuatCsv, xuatExcel, xuatPdf } from './ghi-file';

export type { ExportColumn };

type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'gsheet';

/** Khớp GIOI_HAN.soDong ở services/sheets/src/core/bang-tinh.ts. */
const GS_MAX_DONG = 50_000;

/** File/tab đã xuất lần trước theo module — bấm Xuất lại là vào đúng chỗ cũ. */
type DaNhoSheet = Pick<CauHinhSheet, 'loai' | 'tenTab' | 'cheDo'> & {
  file: { spreadsheetId: string; title: string; url: string } | null;
};

function docNhoSheet(key: string): DaNhoSheet | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DaNhoSheet) : null;
  } catch {
    return null;
  }
}

function luuNhoSheet(key: string, v: CauHinhSheet) {
  try {
    const nho: DaNhoSheet = {
      loai: v.loai,
      tenTab: v.tenTab,
      cheDo: v.cheDo,
      file: v.file ? { spreadsheetId: v.file.spreadsheetId, title: v.file.title, url: v.file.url } : null,
    };
    localStorage.setItem(key, JSON.stringify(nho));
  } catch {
    /* private mode */
  }
}
type ExportScope = 'all' | 'page' | 'selected';

export interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  /** Khai `type` trên cột để xlsx nhận số/ngày thật — xem `lib/export/dinh-dang-o.ts`. */
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  selectedData?: Record<string, unknown>[];
  paginatedData?: Record<string, unknown>[];
  fileName: string;
  visibleColumnKeys?: string[];
  /** Tên sheet Excel (mặc định Data). Tối đa 31 ký tự sau khi làm sạch. */
  sheetName?: string;
  /**
   * Bật "Đồng bộ tự động" lên Google Sheet cho module này. `moduleId` = mã phân quyền và phải
   * có trong `services/sheets/src/core/nguon-dong-bo.ts` (kèm view v_xuat_* + trigger).
   */
  dongBo?: { moduleId: string };
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  columns,
  data,
  selectedData = [],
  paginatedData = [],
  fileName,
  visibleColumnKeys,
  sheetName,
  dongBo,
}) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [scope, setScope] = useState<ExportScope>('all');
  const [exporting, setExporting] = useState(false);
  const visible = useEnterTransition();
  const cot = useCotXuat(columns, fileName, visibleColumnKeys);
  const kn = useGoogleKetNoi(open);
  const lich = useLichDongBo(dongBo?.moduleId, open && format === 'gsheet');
  const [cauHinhLich, setCauHinhLich] = useState<CauHinhDongBoValue>({ bat: false, tanSuat: 'khi_thay_doi', gio: 7, thu: 1, ngayThang: 1 });
  const dangTaoLich = format === 'gsheet' && !!dongBo && !!lich.data?.duocTao && cauHinhLich.bat;
  const khoaNhoSheet = `export-gs:${fileName}`;
  const [gs, setGs] = useState<CauHinhSheet>(() => {
    const macDinh: CauHinhSheet = {
      loai: 'moi',
      tenFile: `${fileName.replace(/_/g, ' ')} ${formatDateShort(getTodayISODate())}`,
      tenTab: sheetName ?? 'Data',
      cheDo: 'ghi_de',
      file: null,
      tabMoi: false,
    };
    const nho = docNhoSheet(khoaNhoSheet);
    if (!nho) return macDinh;
    return { ...macDinh, loai: nho.loai, cheDo: nho.cheDo, tenTab: nho.tenTab || macDinh.tenTab, file: nho.file ? { ...nho.file, tabs: [] } : null };
  });

  // File nhớ từ lần trước: nạp lại danh sách tab khi người dùng chọn Google Sheet.
  // Mất quyền (file bị xoá / thu hồi) thì quay về "Tạo file mới".
  const fileNhoId = gs.loai === 'co_san' && gs.file && gs.file.tabs.length === 0 ? gs.file.spreadsheetId : null;
  const daKetNoi = !!kn.trangThai?.ketNoi && kn.trangThai.trangThai === 'hoat_dong';
  useEffect(() => {
    if (format !== 'gsheet' || !fileNhoId || !daKetNoi) return;
    let huy = false;
    sheetsClient
      .thongTinFile(fileNhoId)
      .then((f) => {
        if (huy) return;
        setGs((v) => ({ ...v, file: f, tabMoi: !f.tabs.some((x) => x.title === v.tenTab) }));
      })
      .catch(() => {
        if (!huy) setGs((v) => ({ ...v, loai: 'moi', file: null }));
      });
    return () => {
      huy = true;
    };
  }, [format, fileNhoId, daKetNoi]);

  const getExportData = (): Record<string, unknown>[] => {
    switch (scope) {
      case 'selected': return selectedData;
      case 'page': return paginatedData;
      default: return data;
    }
  };

  const handleExport = async () => {
    const rows = getExportData();
    if (rows.length === 0 && !dangTaoLich) {
      toast.warning(t('shared.export.noData'));
      return;
    }
    setExporting(true);
    const dateStr = getTodayISODate();
    const fullName = `${fileName}_${dateStr}`;
    const cols = cot.exportCols;

    try {
      if (format === 'gsheet') {
        await xuatGoogleSheet(cols, rows);
        return;
      }
      if (format === 'xlsx') {
        await xuatExcel({ cols, rows, sheetName: sheetName ?? 'Data', fullName });
      } else if (format === 'csv') {
        xuatCsv({ cols, rows, fullName });
      } else {
        await xuatPdf({
          cols,
          rows,
          fullName,
          title: fileName.replace(/_/g, ' '),
          subtitle: t('shared.export.pdfHeader', { date: dateStr, count: rows.length }),
        });
      }
      toast.success(t('shared.export.success'));
      onClose();
    } catch (e) {
      if (import.meta.env.DEV) console.error('Export error:', e);
      toast.error(t('shared.export.error'));
    } finally {
      setExporting(false);
    }
  };

  async function xuatGoogleSheet(cols: ExportColumn[], rows: Record<string, unknown>[]) {
    const tenTab = gs.tenTab.trim();
    if (!tenTab || (gs.loai === 'moi' && !gs.tenFile.trim())) {
      toast.warning(t('shared.export.gs.missingName'));
      return;
    }
    if (gs.loai === 'co_san' && !gs.file) {
      toast.warning(t('shared.export.gs.missingFile'));
      return;
    }
    if (dangTaoLich && dongBo) {
      await taoLichDongBo(cols, tenTab);
      return;
    }
    try {
      const kq = await sheetsClient.xuatNgay({
        dich:
          gs.loai === 'moi'
            ? { loai: 'moi', tenFile: gs.tenFile.trim(), tenTab }
            : { loai: 'co_san', spreadsheetId: gs.file!.spreadsheetId, tenTab },
        cheDo: gs.cheDo,
        header: cols.map((c) => c.label),
        rows: rows.map((r) => cols.map((c) => dinhDangOXuat(r[c.key], c.type).sheet)),
        mauSo: cols.map((c) => mauSoCotSheet(c.type, rows, (r) => r[c.key]) ?? null),
      });
      // Lần sau mở lại dialog thì mặc định xuất vào đúng file/tab này.
      luuNhoSheet(khoaNhoSheet, {
        ...gs,
        loai: 'co_san',
        tenTab: kq.tenTab,
        file: { spreadsheetId: kq.spreadsheetId, title: gs.file?.title ?? gs.tenFile, url: kq.url, tabs: [] },
      });
      toast.success(t('shared.export.gs.success', { count: kq.soDong }), {
        action: { label: t('shared.export.gs.openFile'), onClick: () => window.open(kq.url, '_blank', 'noopener') },
        duration: 10_000,
      });
      if (kq.lechHeader) toast.warning(t('shared.export.gs.headerMismatchAfter'));
      onClose();
    } catch (e) {
      if (e instanceof SheetsLoi) {
        if (e.ma === 'ket_noi_hong' || e.ma === 'chua_ket_noi') void kn.taiLai();
        toast.error(e.message);
        return;
      }
      throw e;
    }
  }

  /** Tạo lịch: server tạo/mở file, lưu lịch, ghi lần đầu TOÀN BỘ dữ liệu trong quyền (không theo bộ lọc). */
  async function taoLichDongBo(cols: ExportColumn[], tenTab: string) {
    try {
      const kq = await sheetsClient.taoLich({
        moduleId: dongBo!.moduleId,
        cot: cols.map((c) => ({ key: c.key, label: c.label, type: c.type })),
        dich:
          gs.loai === 'moi'
            ? { loai: 'moi', tenFile: gs.tenFile.trim(), tenTab }
            : { loai: 'co_san', spreadsheetId: gs.file!.spreadsheetId, tenTab },
        tanSuat: cauHinhLich.tanSuat,
        gio: cauHinhLich.gio,
        thu: cauHinhLich.thu,
        ngayThang: cauHinhLich.ngayThang,
      });
      const openFile = { label: t('shared.export.gs.openFile'), onClick: () => window.open(kq.url, '_blank', 'noopener') };
      if (kq.ketQua && !kq.ketQua.ok) toast.warning(t('shared.export.sync.createdButFailed', { msg: kq.ketQua.thongDiep }), { action: openFile, duration: 12_000 });
      else toast.success(t('shared.export.sync.created', { count: kq.ketQua?.soDong ?? 0 }), { action: openFile, duration: 10_000 });
      setCauHinhLich((v) => ({ ...v, bat: false }));
      void lich.taiLai();
    } catch (e) {
      if (e instanceof SheetsLoi) {
        if (e.ma === 'ket_noi_hong' || e.ma === 'chua_ket_noi') void kn.taiLai();
        toast.error(e.message);
        return;
      }
      throw e;
    }
  }

  if (!open) return null;

  const formats: { id: ExportFormat; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'xlsx', label: 'Excel', icon: FileSpreadsheet, desc: '.xlsx' },
    { id: 'csv', label: 'CSV', icon: FileText, desc: '.csv' },
    { id: 'pdf', label: 'PDF', icon: FileText, desc: '.pdf' },
    ...(kn.khongKhaDung ? [] : [{ id: 'gsheet' as const, label: 'Google Sheet', icon: Sheet, desc: 'Cloud' }]),
  ];
  const soDongXuat = getExportData().length;
  // Tạo lịch đồng bộ không phụ thuộc số dòng đang lọc trên màn hình — server đọc toàn bộ.
  const gsVuotGioiHan = format === 'gsheet' && !dangTaoLich && soDongXuat > GS_MAX_DONG;
  const gsChuaSan =
    format === 'gsheet' && (!daKetNoi || (gs.loai === 'co_san' && !gs.file) || !gs.tenTab.trim());

  const scopes: { id: ExportScope; label: string; count: number }[] = [
    { id: 'all', label: t('shared.export.scopeAll'), count: data.length },
    { id: 'page', label: t('shared.export.scopeCurrentPage'), count: paginatedData.length },
    { id: 'selected', label: t('shared.export.scopeSelected'), count: selectedData.length },
  ];

  return (
    <>
      <div
        role="presentation"
        onClick={exporting ? undefined : onClose}
        className={cn(
          'fixed inset-0 z-[60] bg-black/20 backdrop-blur-md presence-overlay',
          visible && 'presence-visible',
        )}
      />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'w-full bg-card rounded-2xl shadow-2xl border border-border pointer-events-auto flex flex-col max-h-[85vh] presence-dialog-center',
            visible && 'presence-visible',
            DIALOG_SIZE.LARGE,
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Download size={16} /></div>
              <h3 className="text-sm font-semibold text-foreground">{t('shared.export.title')}</h3>
            </div>
            <button
              onClick={onClose}
              disabled={exporting}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {/* Format */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('shared.export.format')}</p>
              <div className="flex gap-2">
                {formats.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all',
                      format === f.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/30',
                    )}
                  >
                    <f.icon size={18} />
                    <span>{f.label}</span>
                    <span className="text-2xs opacity-60">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">{t('shared.export.scope')}</p>
              <div className="flex gap-2">
                {scopes.filter((s) => s.count > 0 || s.id === 'all').map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScope(s.id)}
                    disabled={s.count === 0}
                    className={cn(
                      'flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-all',
                      scope === s.id
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/30',
                      s.count === 0 && 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    <span>{s.label}</span>
                    <span className="block text-2xs tabular-nums opacity-60 mt-0.5">{s.count} {t('shared.export.rows')}</span>
                  </button>
                ))}
              </div>
            </div>

            {format === 'gsheet' && (
              <GoogleSheetPanel kn={kn} value={gs} onChange={setGs} headerXuat={cot.exportCols.map((c) => c.label)} />
            )}
            {format === 'gsheet' && dongBo && daKetNoi && lich.data?.hoTro && (
              <CauHinhDongBo
                moduleId={dongBo.moduleId}
                value={cauHinhLich}
                onChange={setCauHinhLich}
                duocTao={lich.data.duocTao}
                lyDo={lich.data.lyDo}
                cot={cot.exportCols}
              />
            )}
            {format === 'gsheet' && dongBo && daKetNoi && lich.data && (
              <LichDongBoPanel dsLich={lich.data.dsLich} onThay={lich.thayLich} onTaiLai={() => void lich.taiLai()} />
            )}
            {gsVuotGioiHan && (
              <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                {t('shared.export.gs.tooManyRows', { max: GS_MAX_DONG.toLocaleString('vi-VN') })}
              </p>
            )}

            <ChonCot
              ordered={cot.ordered}
              selectedSet={cot.selectedSet}
              onToggle={cot.toggle}
              onToggleAll={cot.toggleAll}
              onMove={cot.move}
              onReset={cot.reset}
            />
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={onClose} disabled={exporting} className="text-xs h-9">{t('common.cancel')}</Button>
            <Button
              onClick={handleExport}
              disabled={exporting || (soDongXuat === 0 && !dangTaoLich) || gsVuotGioiHan || gsChuaSan}
              className="bg-primary text-white text-xs h-9 px-4"
            >
              <Download size={13} className="mr-1.5" />
              {exporting
                ? t('shared.export.exporting')
                : dangTaoLich
                  ? t('shared.export.sync.submit')
                  : format === 'gsheet'
                  ? t('shared.export.gs.exportRows', { count: soDongXuat })
                  : t('shared.export.exportRows', { count: soDongXuat })}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportDialog;
