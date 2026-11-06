import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';

interface Props {
  onImport?: () => void;
  onExport?: () => void;
  /** Đang nạp dữ liệu xuất: vô hiệu hoá nút + xoay icon, KHÔNG ẩn nút (tránh toolbar nhảy) */
  exportLoading?: boolean;
}

/** Nút icon-only, cùng kích thước với cặp nút Nhập/Xuất của các module khác. */
const BTN_CLASS =
  'inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted';

const ImportExportButtons: React.FC<Props> = ({ onImport, onExport, exportLoading = false }) => {
  const { t } = useTranslation();
  return (
    <>
      {onImport && (
        <Tooltip content={t('thanhToanDoiTac.toolbar.import')} placement="bottom">
          <Button variant="outline" size="sm" onClick={onImport} className={BTN_CLASS}>
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {onExport && (
        <Tooltip content={t('thanhToanDoiTac.toolbar.export')} placement="bottom">
          <Button variant="outline" size="sm" onClick={onExport} disabled={exportLoading} className={BTN_CLASS}>
            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </Button>
        </Tooltip>
      )}
    </>
  );
};

/** Bản cho bottom-sheet mobile của GenericToolbar. */
export function buildImportExportMobileActions(
  t: (key: string) => string,
  onImport?: () => void,
  onExport?: () => void
) {
  return [
    ...(onImport
      ? [
          {
            key: 'import',
            label: t('thanhToanDoiTac.toolbar.import'),
            icon: Upload,
            onClick: onImport,
            description: t('thanhToanDoiTac.toolbar.importDesc'),
          },
        ]
      : []),
    ...(onExport
      ? [
          {
            key: 'export',
            label: t('thanhToanDoiTac.toolbar.export'),
            icon: Download,
            onClick: onExport,
            description: t('thanhToanDoiTac.toolbar.exportDesc'),
          },
        ]
      : []),
  ];
}

export default ImportExportButtons;
