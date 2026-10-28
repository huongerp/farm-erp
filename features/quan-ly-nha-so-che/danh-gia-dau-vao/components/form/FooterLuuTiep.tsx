/** Footer drawer con: Huỷ · [Lưu & tiếp] · Lưu — dùng cho drawer dây / lô của form phiếu và Nhập theo lô. */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPlus, Save } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import { BTN_CANCEL } from '../../../../../lib/button-labels';

interface Props {
  onHuy: () => void;
  onLuu: () => void;
  /** Có thì hiện nút thứ hai (Lưu & thêm tiếp / Lưu & sang lô kế). */
  onLuuTiep?: () => void;
  nhanTiep?: string;
  nhanLuu?: string;
  dangLuu?: boolean;
}

const FooterLuuTiep: React.FC<Props> = ({ onHuy, onLuu, onLuuTiep, nhanTiep, nhanLuu, dangLuu }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between w-full gap-3">
      <Button variant="outline" size="sm" onClick={onHuy} disabled={dangLuu} className="border-border text-muted-foreground">
        {BTN_CANCEL()}
      </Button>
      <div className="flex gap-2">
        {onLuuTiep && (
          <Button type="button" variant="outline" size="sm" disabled={dangLuu} onClick={onLuuTiep}>
            <ListPlus className="mr-2 h-4 w-4" />
            {nhanTiep}
          </Button>
        )}
        <Button type="button" size="sm" isLoading={dangLuu} onClick={onLuu} className="bg-primary text-white shadow-lg">
          <Save className="mr-2 h-4 w-4" />
          {nhanLuu ?? t('common.save')}
        </Button>
      </div>
    </div>
  );
};

export default FooterLuuTiep;
