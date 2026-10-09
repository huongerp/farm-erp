import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import { useCaiDatGscl, useLuuCaiDatGscl } from '../../hooks/use-giam-sat-chat-luong';

/** Ô "số tiêu chí không đạt" — dùng chung mọi phiếu (DB). Chỉ cấp cao sửa. */
const QuyTacKetLuan: React.FC<{ canEdit: boolean }> = ({ canEdit }) => {
  const { t } = useTranslation();
  const { data } = useCaiDatGscl();
  const luu = useLuuCaiDatGscl();
  const hienTai = data?.so_tieu_chi_khong_dat;
  const [nhap, setNhap] = useState<string | null>(null);

  const giaTri = nhap ?? (hienTai != null ? String(hienTai) : '');
  const so = /^\d+$/.test(giaTri.trim()) ? Number(giaTri) : NaN;
  const hopLe = Number.isInteger(so) && so >= 1 && so <= 100;

  return (
    <div className="rounded-xl border border-border p-3 space-y-2">
      <div className="text-sm font-semibold">{t('giamSatChatLuong.quyTac.title')}</div>
      <div className="flex items-end gap-2">
        <div className="w-full sm:w-80">
          <Input
            label={t('giamSatChatLuong.quyTac.soTieuChiKhongDat')}
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            step={1}
            value={giaTri}
            disabled={!canEdit || hienTai == null}
            onChange={(e) => setNhap(e.target.value)}
            error={nhap != null && !hopLe ? t('giamSatChatLuong.quyTac.khongHopLe') : undefined}
          />
        </div>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            disabled={!hopLe || so === hienTai || luu.isPending}
            onClick={() => luu.mutate({ so_tieu_chi_khong_dat: so }, { onSuccess: () => setNhap(null) })}
          >
            {t('common.save')}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground m-0">
        {t('giamSatChatLuong.quyTac.hint', { n: hienTai ?? '…' })}
      </p>
    </div>
  );
};

export default QuyTacKetLuan;
