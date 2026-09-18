import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';

interface Props {
  onImport?: () => void;
  onExport?: () => void;
}

const BTN_CLASS =
  'inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted';

/** Cặp nút Import/Export dùng chung cho cả hai tab của module. */
const ImportExportButtons: React.FC<Props> = ({ onImport, onExport }) => {
  const { t } = useTranslation();
  return (
    <>
      {onImport && (
        <Tooltip content={t('farmHangHoaPhanThuoc.toolbar.importData')} placement="bottom">
          <Button variant="outline" size="sm" onClick={onImport} className={BTN_CLASS}>
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {onExport && (
        <Tooltip content={t('farmHangHoaPhanThuoc.toolbar.exportData')} placement="bottom">
          <Button variant="outline" size="sm" onClick={onExport} className={BTN_CLASS}>
            <Download className="w-4 h-4" />
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
      ? [{
          key: 'import',
          label: t('farmHangHoaPhanThuoc.toolbar.importData'),
          icon: Upload,
          onClick: onImport,
          description: t('farmHangHoaPhanThuoc.toolbar.importDesc'),
        }]
      : []),
    ...(onExport
      ? [{
          key: 'export',
          label: t('farmHangHoaPhanThuoc.toolbar.exportData'),
          icon: Download,
          onClick: onExport,
          description: t('farmHangHoaPhanThuoc.toolbar.exportDesc'),
        }]
      : []),
  ];
}

export default ImportExportButtons;
