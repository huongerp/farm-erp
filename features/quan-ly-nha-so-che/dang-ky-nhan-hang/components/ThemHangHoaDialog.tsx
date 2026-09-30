import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Package, ScanLine } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Combobox from '../../../../components/ui/Combobox';
import NumberInput from '../../../../components/ui/NumberInput';
import Tooltip from '../../../../components/ui/Tooltip';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { useHangHoaRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { useAuthStore } from '../../../../store/useStore';
import { taoMapMaHangHoa } from '../core/qr';
import { useThemDongHang } from '../hooks/use-dang-ky-nhan-hang';

const QrScannerDialog = lazy(() => import('./QrScannerDialog'));

interface Props {
  idPhieu: string;
  onClose: () => void;
}

/** Thêm hàng xuất bằng combobox (hoặc bấm icon quét 1 mã để chọn nhanh). */
const ThemHangHoaDialog: React.FC<Props> = ({ idPhieu, onClose }) => {
  const { t } = useTranslation();
  const { data: hangHoaList = [], isLoading } = useHangHoaRefQuery();
  const userId = useAuthStore((s) => s.user?.id);
  const them = useThemDongHang();
  const [idHangHoa, setIdHangHoa] = useState<string | null>(null);
  const [soLuong, setSoLuong] = useState<number | undefined>(1);
  const [showScan, setShowScan] = useState(false);
  const [error, setError] = useState('');

  const mapMa = useMemo(() => taoMapMaHangHoa(hangHoaList), [hangHoaList]);
  const options = useMemo(
    () =>
      hangHoaList
        .filter((h) => h.trang_thai === TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG || h.id === idHangHoa)
        .map((h) => ({
          value: h.id,
          label: `${h.ma_hang} - ${h.ten_hang}`,
          subLabel: h.don_vi_tinh ? `${t('dangKyNhanHang.hangHoa.dvt')}: ${h.don_vi_tinh}` : undefined,
        })),
    [hangHoaList, idHangHoa, t]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hh = hangHoaList.find((h) => h.id === idHangHoa);
    if (!hh) return setError(t('dangKyNhanHang.validation.hangHoaRequired'));
    if (!soLuong || soLuong <= 0) return setError(t('dangKyNhanHang.validation.soLuongRequired'));
    await them.mutateAsync([
      {
        id_phieu: idPhieu,
        id_hang_hoa: hh.id,
        ma_hang_hoa: hh.ma_hang,
        so_luong: soLuong,
        nguon: 'tay',
        id_nguoi_quet: userId ? String(userId) : null,
      },
    ]);
    onClose();
  };

  return (
    <>
      <GenericDrawer
        title={t('dangKyNhanHang.hangHoa.them')}
        icon={<Package className="text-primary" size={22} />}
        onClose={onClose}
        variant="modal"
        maxWidthClass={DIALOG_SIZE.MEDIUM}
        footer={
          <FormDrawerFooter
            formId="dknh-them-hang-form"
            onCancel={onClose}
            isLoading={them.isPending}
            createLabel={t('common.add')}
            cancelLabel={t('common.cancel')}
          />
        }
      >
        <form id="dknh-them-hang-form" className="space-y-3 pb-2" onSubmit={submit}>
          <div className="flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Combobox
                label={t('dangKyNhanHang.hangHoa.hangHoa')}
                placeholder={isLoading ? t('common.loading') : t('dangKyNhanHang.hangHoa.chonHangHoa')}
                required
                options={options}
                value={idHangHoa}
                onChange={(v: string | number | null) => {
                  setIdHangHoa(v != null ? String(v) : null);
                  setError('');
                }}
              />
            </div>
            <Tooltip content={t('dangKyNhanHang.qr.quetDeChon')} placement="top">
              <button
                type="button"
                onClick={() => setShowScan(true)}
                className="h-10 w-10 shrink-0 rounded-lg border border-border flex items-center justify-center text-primary hover:bg-primary/10"
                aria-label={t('dangKyNhanHang.qr.quetDeChon')}
              >
                <ScanLine size={18} />
              </button>
            </Tooltip>
          </div>
          <NumberInput
            label={t('dangKyNhanHang.hangHoa.soLuongThung')}
            value={soLuong}
            onChange={(v) => {
              setSoLuong(v ?? undefined);
              setError('');
            }}
            min={1}
            maxFractionDigits={0}
          />
          <p className="text-xs text-muted-foreground">{t('dangKyNhanHang.hangHoa.goiYQuet')}</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </form>
      </GenericDrawer>

      <AnimatePresence>
        {showScan && (
          <Suspense fallback={null}>
            <QrScannerDialog
              mode="mot-lan"
              title={t('dangKyNhanHang.qr.quetDeChon')}
              onDetected={(ma) => {
                const hh = mapMa.get(ma);
                if (!hh) return { ok: false, message: t('dangKyNhanHang.qr.khongTimThay', { ma }) };
                setIdHangHoa(hh.id);
                return { ok: true, message: `${hh.ma_hang} - ${hh.ten_hang}` };
              }}
              onClose={() => setShowScan(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  );
};

export default ThemHangHoaDialog;
