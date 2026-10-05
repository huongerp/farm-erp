import React from 'react';
import { useTranslation } from 'react-i18next';
import { Printer, QrCode } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import QrCodeImage from '../../../../components/shared/QrCodeImage';
import Button from '../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { formatDateTimeShort } from '../../../../lib/utils';
import { taoNoiDungQr } from '../core/qr';
import type { GiamSatChatLuong, ThungMau } from '../core/types';

interface Props {
  phieu: GiamSatChatLuong;
  thung: ThungMau;
  onClose: () => void;
  /** Không truyền = ẩn nút in (phiếu đã huỷ). */
  onIn?: () => void;
  dangIn?: boolean;
}

/** QR lớn của một thùng mẫu — để quét thẳng trên màn hình hoặc in lại tem. */
const QrThungDialog: React.FC<Props> = ({ phieu, thung, onClose, onIn, dangIn = false }) => {
  const { t } = useTranslation();

  return (
    <GenericDrawer
      title={t('giamSatChatLuong.qrThung.title', { stt: thung.stt_thung, n: phieu.so_thung_mau })}
      subtitle={phieu.so_phieu}
      icon={<QrCode className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.COMPACT}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
          {onIn && (
            <Button type="button" size="sm" onClick={onIn} disabled={dangIn}>
              <Printer size={14} className="mr-1.5" />
              {t('giamSatChatLuong.toolbar.inTem')}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-2 py-2">
        <QrCodeImage value={taoNoiDungQr(thung.ma_tem)} size={240} />
        <div className="font-mono text-sm font-semibold tabular-nums">{thung.ma_tem}</div>
        {(thung.ten_nguoi_kiem || thung.tg_kiem) && (
          <div className="text-xs text-muted-foreground">
            {[thung.ten_nguoi_kiem, thung.tg_kiem ? formatDateTimeShort(thung.tg_kiem) : null].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </GenericDrawer>
  );
};

export default QrThungDialog;
