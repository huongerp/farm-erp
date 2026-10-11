import React, { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { formatNumberVN } from '../../../../lib/utils';
import { docSoThung } from '../core/quet-cay-hang';
import type { DangKyNhanHangCt } from '../core/types';
import { useSuaSoThungDong } from '../hooks/use-dang-ky-nhan-hang';

interface Props {
  row: DangKyNhanHangCt;
  onClose: () => void;
}

/** Sửa số thùng thực xếp lên xe của một dòng cây hàng (sau khi đã quét). */
const SuaSoThungDialog: React.FC<Props> = ({ row, onClose }) => {
  const { t } = useTranslation();
  const formId = useId();
  const mutation = useSuaSoThungDong(onClose);
  const [raw, setRaw] = useState(String(row.so_luong));
  const [loi, setLoi] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => inputRef.current?.focus(), []);
  const soQc = row.so_thung_qc ?? row.so_luong;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const so = docSoThung(raw);
    if (so == null) {
      setLoi(t('dangKyNhanHang.cayHang.soThungKhongHopLe'));
      return;
    }
    if (so === row.so_luong) {
      onClose();
      return;
    }
    mutation.mutate({ id: row.id, soLuong: so });
  };

  const tenCay = [
    row.so_phieu_gscl,
    row.ten_hang_hoa || row.ma_hang_hoa,
    row.ma_cay_hang ? t('dangKyNhanHang.cayHang.cay', { ma: row.ma_cay_hang }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <GenericDrawer
      title={t('dangKyNhanHang.cayHang.sua')}
      subtitle={tenCay || t('dangKyNhanHang.cayHang.suaSubtitle')}
      icon={<Pencil className="text-primary" size={20} />}
      onClose={onClose}
      isDirty={raw !== String(row.so_luong)}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.COMPACT}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isEdit
          isLoading={mutation.isPending}
          saveLabel={t('common.save')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id={formId} className="space-y-2 pb-2" onSubmit={onSubmit}>
        <Input
          ref={inputRef}
          label={t('dangKyNhanHang.cayHang.soThungNhap', { n: formatNumberVN(soQc) })}
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            setLoi(undefined);
          }}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          required
          error={loi}
          className="text-right tabular-nums font-semibold"
        />
      </form>
    </GenericDrawer>
  );
};

export default SuaSoThungDialog;
