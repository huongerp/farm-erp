import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SharedQrScannerDialog, { type KetQuaQuet } from '../../../../components/shared/QrScannerDialog';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { chuanHoaMaQr } from '../core/qr';

export type { KetQuaQuet };

interface Props {
  /** `lien-tuc`: quét nhiều thùng liên tục; `mot-lan`: quét 1 mã rồi đóng (điền combobox). */
  mode: 'lien-tuc' | 'mot-lan';
  title: string;
  /** Nhận mã đã chuẩn hoá. Trả kết quả để hiện ngay dưới camera. */
  onDetected: (ma: string) => Promise<KetQuaQuet> | KetQuaQuet;
  /** Xoá lần ghi gần nhất; trả `true` khi có dòng bị xoá. */
  onUndoLast?: () => Promise<boolean>;
  undoPending?: boolean;
  onClose: () => void;
}

const chuanHoa = (raw: string) => chuanHoaMaQr(raw);

/** Quét QR mã hàng hoá — máy quét dùng chung + danh sách hàng hoá để chọn tay. */
const QrScannerDialog: React.FC<Props> = ({ mode, title, onDetected, onUndoLast, undoPending, onClose }) => {
  const { t } = useTranslation();
  const { data: hangHoaList = [] } = useHangHoaRefQuery();
  const options = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.ma_hang && h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG)
        .map((h) => ({ value: h.id, label: `${h.ma_hang} - ${h.ten_hang}`, subLabel: h.don_vi_tinh || undefined })),
    [hangHoaList]
  );

  return (
    <SharedQrScannerDialog
      mode={mode}
      title={title}
      subtitle={t(mode === 'lien-tuc' ? 'dangKyNhanHang.qr.subtitleLienTuc' : 'dangKyNhanHang.qr.subtitleMotLan')}
      chuanHoa={chuanHoa}
      onDetected={onDetected}
      onUndoLast={onUndoLast}
      undoPending={undoPending}
      undoLabel={t('dangKyNhanHang.hangHoa.hoanTacCuoi')}
      undoDoneMessage={t('dangKyNhanHang.toast.hoanTacDongSuccess')}
      doneLabel={t(mode === 'lien-tuc' ? 'dangKyNhanHang.qr.xong' : 'common.close')}
      chonTay={{
        label: t('dangKyNhanHang.qr.nhapTay'),
        placeholder: t(mode === 'lien-tuc' ? 'dangKyNhanHang.qr.chonDeThem' : 'dangKyNhanHang.hangHoa.chonHangHoa'),
        searchPlaceholder: t('dangKyNhanHang.qr.timMaHoacTen'),
        options,
        toCode: (id) => hangHoaList.find((h) => h.id === id)?.ma_hang ?? null,
      }}
      onClose={onClose}
    />
  );
};

export default QrScannerDialog;
