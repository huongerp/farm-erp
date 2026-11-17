import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import { useCaiDatGscl, useLuuCaiDatGscl } from '../../hooks/use-giam-sat-chat-luong';

/**
 * Số thùng kiểm tối thiểu / farm / ngày + ngày áp dụng (migration 081) — dưới mức này % lỗi QC của
 * Báo cáo sơ chế là «Chưa đạt kiểm tra». Dùng chung mọi farm (DB). Chỉ cấp cao sửa.
 */
const ToiThieuThungNgay: React.FC<{ canEdit: boolean }> = ({ canEdit }) => {
  const { t } = useTranslation();
  const { data } = useCaiDatGscl();
  const luu = useLuuCaiDatGscl();
  const soHienTai = data?.so_thung_toi_thieu_ngay;
  const ngayHienTai = data?.ngay_ap_dung_toi_thieu;
  const [nhapSo, setNhapSo] = useState<string | null>(null);
  const [nhapNgay, setNhapNgay] = useState<string | null>(null);

  const giaTriSo = nhapSo ?? (soHienTai != null ? String(soHienTai) : '');
  const giaTriNgay = nhapNgay ?? ngayHienTai ?? '';
  const so = /^\d+$/.test(giaTriSo.trim()) ? Number(giaTriSo) : NaN;
  const soHopLe = Number.isInteger(so) && so >= 1 && so <= 1000;
  const ngayHopLe = /^\d{4}-\d{2}-\d{2}$/.test(giaTriNgay);
  const doi = so !== soHienTai || giaTriNgay !== ngayHienTai;

  return (
    <div className="rounded-xl border border-border p-3 space-y-2">
      <div className="text-sm font-semibold">{t('giamSatChatLuong.toiThieu.title')}</div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-56">
          <Input
            label={t('giamSatChatLuong.toiThieu.soThung')}
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            step={1}
            value={giaTriSo}
            disabled={!canEdit || soHienTai == null}
            onChange={(e) => setNhapSo(e.target.value)}
            error={nhapSo != null && !soHopLe ? t('giamSatChatLuong.toiThieu.khongHopLe') : undefined}
          />
        </div>
        <div className="w-full sm:w-48">
          <Input
            label={t('giamSatChatLuong.toiThieu.tuNgay')}
            type="date"
            value={giaTriNgay}
            disabled={!canEdit || ngayHienTai == null}
            onChange={(e) => setNhapNgay(e.target.value)}
          />
        </div>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            disabled={!soHopLe || !ngayHopLe || !doi || luu.isPending}
            onClick={() =>
              luu.mutate(
                { so_thung_toi_thieu_ngay: so, ngay_ap_dung_toi_thieu: giaTriNgay },
                {
                  onSuccess: () => {
                    setNhapSo(null);
                    setNhapNgay(null);
                  },
                }
              )
            }
          >
            {t('common.save')}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground m-0">
        {t('giamSatChatLuong.toiThieu.hint', { n: soHienTai ?? '…' })}
      </p>
    </div>
  );
};

export default ToiThieuThungNgay;
