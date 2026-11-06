/**
 * Nút «In» trong slot `bulkActions` của GenericToolbar: mở trang in hàng loạt các dòng đang chọn
 * ở tab mới (`/in-hang-loat?mau=…&ids=…`). `mau` = khoá trong `DANH_MUC_IN_HANG_LOAT`.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import BulkActionButton from '../BulkActionButton';
import { duongDanInHangLoat } from './in-hang-loat';

const NutInHangLoat: React.FC<{ mau: string; ids: readonly (string | number)[] }> = ({ mau, ids }) => {
  const { t } = useTranslation();
  return (
    <BulkActionButton
      icon={Printer}
      label={t('common.phieuIn.inDaChon', { so: ids.length })}
      disabled={ids.length === 0}
      onClick={() => window.open(duongDanInHangLoat(mau, ids), '_blank', 'noopener')}
    />
  );
};

export default NutInHangLoat;
