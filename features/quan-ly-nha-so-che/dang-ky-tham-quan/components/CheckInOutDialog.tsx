import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, LogIn, LogOut } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Input from '../../../../components/ui/Input';
import Button from '../../../../components/ui/Button';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { formatDateTimeShort, getTimezone } from '../../../../lib/utils';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '../../dang-ky-nhan-hang/core/thoi-gian';
import type { DangKyThamQuan } from '../core/types';
import { useChuyenTrangThaiDangKyThamQuan } from '../hooks/use-dang-ky-tham-quan';
import { khoangThoiGian } from '../utils/hien-thi';

interface Props {
  mode: 'checkIn' | 'checkOut';
  data: DangKyThamQuan;
  onClose: () => void;
}

/** Check in / check out đoàn: giờ mặc định là bây giờ, sửa được. */
const CheckInOutDialog: React.FC<Props> = ({ mode, data, onClose }) => {
  const { t } = useTranslation();
  const tz = getTimezone();
  const mutation = useChuyenTrangThaiDangKyThamQuan(onClose);
  const isIn = mode === 'checkIn';
  const [thoiDiem, setThoiDiem] = useState(() => toDateTimeLocalValue(Date.now(), tz));
  const iso = fromDateTimeLocalValue(thoiDiem, tz);
  const formId = `dktq-${mode}-form`;

  return (
    <GenericDrawer
      title={t(isIn ? 'dangKyThamQuan.checkInOut.titleIn' : 'dangKyThamQuan.checkInOut.titleOut')}
      subtitle={`${data.nguoi_dai_dien || data.khach[0]?.ho_ten || '—'} · ${data.khach.length} ${t('dangKyThamQuan.khach.nguoi')}`}
      icon={isIn ? <LogIn className="text-primary" size={22} /> : <LogOut className="text-emerald-600" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.COMPACT}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isEdit
          isLoading={mutation.isPending}
          saveLabel={t(isIn ? 'dangKyThamQuan.toolbar.checkIn' : 'dangKyThamQuan.toolbar.checkOut')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form
        id={formId}
        className="space-y-4 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (iso) mutation.mutate({ action: mode, id: data.id, thoiDiem: iso });
        }}
      >
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <span className="text-muted-foreground">{t('dangKyThamQuan.checkInOut.dangKy')}</span>
          <span className="tabular-nums">{khoangThoiGian(data)}</span>
          {!isIn && (
            <>
              <span className="text-muted-foreground">{t('dangKyThamQuan.col.gioVao')}</span>
              <span className="tabular-nums">{data.tg_vao_thuc_te ? formatDateTimeShort(data.tg_vao_thuc_te) : '—'}</span>
            </>
          )}
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1 min-w-0">
            <Input
              type="datetime-local"
              value={thoiDiem}
              onChange={(e) => setThoiDiem(e.target.value)}
              label={t('dangKyThamQuan.checkInOut.thoiDiem')}
              icon={<Clock size={12} />}
              required
              error={iso ? undefined : t('dangKyThamQuan.validation.thoiDiemRequired')}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 shrink-0"
            onClick={() => setThoiDiem(toDateTimeLocalValue(Date.now(), tz))}
          >
            {t('dangKyThamQuan.checkInOut.bayGio')}
          </Button>
        </div>
      </form>
    </GenericDrawer>
  );
};

export default CheckInOutDialog;
