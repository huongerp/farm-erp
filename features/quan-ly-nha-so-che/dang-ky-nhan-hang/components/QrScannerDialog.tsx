import React from 'react';
import { useTranslation } from 'react-i18next';
import SharedQrScannerDialog, { type KetQuaQuet } from '../../../../components/shared/QrScannerDialog';
import { TIEN_TO_CHON_TAY, usePhieuQcOptions } from '../hooks/use-quet-cay-hang';

export type { KetQuaQuet };

interface Props {
  title: string;
  /** Farm của xe — danh sách chọn tay lấy phiếu QC (trừ phiếu huỷ) của farm này. */
  idChiNhanh: string;
  /** Nhận chuỗi quét được (tem QC) hoặc `PHIEU:<id>` khi chọn tay. */
  onDetected: (ma: string) => Promise<KetQuaQuet> | KetQuaQuet;
  /** Xoá lần ghi gần nhất; trả `true` khi có dòng bị xoá. */
  onUndoLast?: () => Promise<boolean>;
  undoPending?: boolean;
  onClose: () => void;
}

const trim = (raw: string) => raw.trim() || null;

/**
 * Xếp cây hàng lên xe: quét tem QC liên tục. Tem hỏng / mất → chọn tay phiếu QC
 * của farm (máy quét cầm tay gõ số phiếu vào ô tìm cũng được).
 */
const QrScannerDialog: React.FC<Props> = ({ title, idChiNhanh, onDetected, onUndoLast, undoPending, onClose }) => {
  const { t } = useTranslation();
  const { options } = usePhieuQcOptions(idChiNhanh);

  return (
    <SharedQrScannerDialog
      mode="lien-tuc"
      title={title}
      subtitle={t('dangKyNhanHang.cayHang.subtitleQuet')}
      chuanHoa={trim}
      onDetected={onDetected}
      onUndoLast={onUndoLast}
      undoPending={undoPending}
      undoLabel={t('dangKyNhanHang.hangHoa.hoanTacCuoi')}
      undoDoneMessage={t('dangKyNhanHang.toast.hoanTacDongSuccess')}
      doneLabel={t('dangKyNhanHang.qr.xong')}
      nhanDem={(n) => t('dangKyNhanHang.cayHang.demQuet', { n })}
      chonTay={{
        label: t('dangKyNhanHang.cayHang.chonTay'),
        placeholder: t('dangKyNhanHang.cayHang.chonPhieuQc'),
        searchPlaceholder: t('dangKyNhanHang.cayHang.timPhieuQc'),
        options,
        toCode: (id) => `${TIEN_TO_CHON_TAY}${id}`,
      }}
      onClose={onClose}
    />
  );
};

export default QrScannerDialog;
