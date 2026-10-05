import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SharedQrScannerDialog, { type KetQuaQuet } from '../../../../components/shared/QrScannerDialog';
import { formatYmdToDisplay } from '../../../../lib/utils';
import { TIEN_TO_CHON_TAY, usePhieuQcDaNop } from '../hooks/use-quet-cay-hang';

export type { KetQuaQuet };

interface Props {
  title: string;
  /** Farm của xe — danh sách chọn tay lấy phiếu QC đã nộp của farm này. */
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
 * Xếp cây hàng lên xe: quét tem QC liên tục. Tem hỏng / mất → chọn tay phiếu QC đã nộp
 * của farm (máy quét cầm tay gõ số phiếu vào ô tìm cũng được).
 */
const QrScannerDialog: React.FC<Props> = ({ title, idChiNhanh, onDetected, onUndoLast, undoPending, onClose }) => {
  const { t } = useTranslation();
  const { data: dsPhieu = [] } = usePhieuQcDaNop(idChiNhanh);
  const options = useMemo(
    () =>
      dsPhieu.map((p) => ({
        value: p.id,
        label: [p.so_phieu, p.ten_hang_hoa].filter(Boolean).join(' · '),
        subLabel: [
          formatYmdToDisplay(p.ngay),
          p.ma_cay_hang ? t('dangKyNhanHang.cayHang.cay', { ma: p.ma_cay_hang }) : null,
          t('dangKyNhanHang.cayHang.soThung', { n: p.so_thung_cay }),
          p.ket_luan ? t(`dangKyNhanHang.cayHang.ketLuan_${p.ket_luan}`) : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    [dsPhieu, t]
  );

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
