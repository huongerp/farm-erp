import React, { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ListChecks } from 'lucide-react';
import GenericDrawer from './GenericDrawer';
import FormDrawerFooter from './FormDrawerFooter';
import NumberInput from '../ui/NumberInput';
import { DIALOG_SIZE } from '../../lib/dialog-sizes';
import { cn, formatNumberVN } from '../../lib/utils';
import type { DongChonTaoPhieu, DongDaChon } from '../../lib/thuc-hien-tung-phan';

interface Props {
  title: string;
  subtitle?: React.ReactNode;
  rows: DongChonTaoPhieu[];
  /** Nhãn cột đã thực hiện: "Đã nhập" / "Đã đặt". */
  nhanDaThucHien: string;
  /** Đang tải số đã thực hiện → chưa cho xác nhận (tránh chọn theo số cũ). */
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (lines: DongDaChon[]) => void;
}

/**
 * Chọn hàng + số lượng LẦN NÀY trước khi tạo phiếu đích từ phiếu nguồn (nhập kho / đặt hàng từng
 * phần). Mặc định chọn mọi hàng còn lại với số lượng = còn lại; hàng đã đủ thì khoá.
 */
const ChonHangTaoPhieuDialog: React.FC<Props> = ({ title, subtitle, rows, nhanDaThucHien, isLoading = false, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const formId = useId();
  const [chon, setChon] = useState<Record<string, boolean>>({});
  const [soLuong, setSoLuong] = useState<Record<string, number>>({});
  const [loi, setLoi] = useState<string>();

  // Chưa đụng tới dòng nào → mặc định chọn khi còn lại > 0. Đọc theo rows hiện tại để số đã nhập
  // tải xong muộn vẫn cập nhật mặc định đúng.
  const daChon = (r: DongChonTaoPhieu) => r.con_lai > 0 && (chon[r.id_hang_hoa] ?? true);
  const slLanNay = (r: DongChonTaoPhieu) => soLuong[r.id_hang_hoa] ?? r.con_lai;

  const conHang = rows.filter((r) => r.con_lai > 0);
  const soDaChon = conHang.filter(daChon).length;
  const chonHet = conHang.length > 0 && soDaChon === conHang.length;

  const toggleTatCa = () => {
    const next = !chonHet;
    setChon(Object.fromEntries(conHang.map((r) => [r.id_hang_hoa, next])));
    setLoi(undefined);
  };

  const lines = useMemo(
    () =>
      rows
        .filter(daChon)
        .map((r) => ({ id_hang_hoa: r.id_hang_hoa, so_luong: slLanNay(r) }))
        .filter((l) => l.so_luong > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- daChon/slLanNay chỉ đọc chon, soLuong, rows
    [rows, chon, soLuong]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (lines.length === 0) {
      setLoi(t('common.tungPhan.chuaChon'));
      return;
    }
    onConfirm(lines);
  };

  return (
    <GenericDrawer
      title={title}
      subtitle={subtitle}
      icon={<ListChecks className="text-primary" size={20} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isLoading={isLoading}
          createLabel={t('common.tungPhan.tiepTuc', { n: lines.length })}
          cancelLabel={t('common.cancel')}
          createIcon={<ListChecks className="mr-2 h-4 w-4" />}
        />
      }
    >
      <form id={formId} className="space-y-3 pb-2" onSubmit={onSubmit}>
        <p className="text-caption text-muted-foreground m-0">{t('common.tungPhan.hint')}</p>

        <div className="rounded-lg border border-border overflow-hidden">
          <label className="flex items-center gap-3 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={chonHet}
              ref={(el) => {
                if (el) el.indeterminate = soDaChon > 0 && !chonHet;
              }}
              onChange={toggleTatCa}
              disabled={conHang.length === 0}
              className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
            />
            <span className="flex-1">{t('common.tungPhan.chonTatCa', { chon: soDaChon, tong: conHang.length })}</span>
            <span className="w-28 sm:w-32 text-right">{t('common.tungPhan.lanNay')}</span>
          </label>

          {rows.length === 0 && (
            <p className="px-3 py-6 text-center text-body-sm text-muted-foreground m-0">{t('common.noData')}</p>
          )}

          {/* Hàng còn thiếu lên trước: đơn nhiều dòng mà hầu hết đã đủ thì không phải cuộn tìm. */}
          {[...conHang, ...rows.filter((r) => r.con_lai <= 0)].map((r) => {
            const du = r.con_lai <= 0;
            const checked = daChon(r);
            return (
              <div
                key={r.id_hang_hoa}
                className={cn('flex items-center gap-3 px-3 py-2.5 border-t border-border', du && 'opacity-55')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={du}
                  onChange={() => {
                    setChon((s) => ({ ...s, [r.id_hang_hoa]: !checked }));
                    setLoi(undefined);
                  }}
                  aria-label={r.ten_hang}
                  className="w-4 h-4 shrink-0 rounded border-border text-primary accent-primary cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-medium text-foreground truncate">
                    {r.ten_hang || '—'}
                    {r.ma_hang && <span className="ml-1.5 font-mono text-caption text-muted-foreground">{r.ma_hang}</span>}
                  </div>
                  <div className="text-caption text-muted-foreground tabular-nums">
                    {t('common.tungPhan.dongSoLieu', {
                      nguon: formatNumberVN(r.so_luong_nguon),
                      nhanDa: nhanDaThucHien,
                      da: formatNumberVN(r.da_thuc_hien),
                      conLai: formatNumberVN(r.con_lai),
                      dvt: r.don_vi_tinh ?? '',
                    })}
                    {du && <span className="ml-1.5 font-medium text-emerald-600 dark:text-emerald-400">· {t('common.tungPhan.daDu')}</span>}
                  </div>
                </div>
                <div className="w-28 sm:w-32 shrink-0">
                  <NumberInput
                    compact
                    value={checked ? slLanNay(r) : 0}
                    min={0}
                    max={r.con_lai}
                    disabled={!checked}
                    onChange={(v) => {
                      setSoLuong((s) => ({ ...s, [r.id_hang_hoa]: Math.min(v, r.con_lai) }));
                      setLoi(undefined);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {loi && <p className="text-caption text-destructive m-0">{loi}</p>}
      </form>
    </GenericDrawer>
  );
};

export default ChonHangTaoPhieuDialog;
