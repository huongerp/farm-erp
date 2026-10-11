import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Eye, Printer } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { TRANG_THAI } from '../../../../lib/constants';
import { cn, getTodayISO, nowTz } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { taoUrlInDanhSach } from '../core/danh-sach-in';

interface Props {
  branches: Branch[];
  /** Chi nhánh trong phạm vi xem; `null` = xem tất cả. */
  allowedBranchIds: string[] | null;
  /** Chi nhánh đang lọc trên toolbar — chọn sẵn. */
  idChiNhanhDangLoc: string[];
  onClose: () => void;
}

/** Popup chọn ngày + chi nhánh rồi mở trang in danh sách xe ở tab mới. */
const InDanhSachDialog: React.FC<Props> = ({ branches, allowedBranchIds, idChiNhanhDangLoc, onClose }) => {
  const { t } = useTranslation();
  const homNay = getTodayISO();
  const ngayMai = nowTz().add(1, 'day').format('YYYY-MM-DD');
  const [ngay, setNgay] = useState(homNay);
  const [idChiNhanh, setIdChiNhanh] = useState<string[]>(idChiNhanhDangLoc);

  const chiNhanhOptions = useMemo(
    () =>
      branches.filter(
        (b) =>
          (allowedBranchIds == null || allowedBranchIds.includes(b.id)) &&
          (b.trang_thai === TRANG_THAI.DANG_DUNG || idChiNhanhDangLoc.includes(b.id))
      ),
    [branches, allowedBranchIds, idChiNhanhDangLoc]
  );

  const xemTruoc = () => {
    if (!ngay) return;
    window.open(taoUrlInDanhSach(ngay, idChiNhanh), '_blank', 'noopener,noreferrer');
    onClose();
  };

  const chip = (active: boolean) =>
    cn(
      'px-3 py-1.5 rounded-full border text-sm font-medium transition',
      active ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/50'
    );

  return (
    <GenericDrawer
      title={t('dangKyNhanHang.inDanhSach.dialogTitle')}
      subtitle={t('dangKyNhanHang.inDanhSach.dialogSubtitle')}
      icon={<Printer className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={xemTruoc} disabled={!ngay}>
            <Eye size={14} className="mr-1.5" />
            {t('dangKyNhanHang.mauIn.xemTruoc')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(ngay === homNay)} onClick={() => setNgay(homNay)}>
              {t('dangKyNhanHang.inDanhSach.homNay')}
            </button>
            <button type="button" className={chip(ngay === ngayMai)} onClick={() => setNgay(ngayMai)}>
              {t('dangKyNhanHang.inDanhSach.ngayMai')}
            </button>
          </div>
          <Input
            type="date"
            label={t('dangKyNhanHang.col.ngay')}
            icon={<Calendar size={12} />}
            value={ngay}
            onChange={(e) => setNgay(e.target.value)}
            required
          />
        </div>

        {chiNhanhOptions.length > 1 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{t('dangKyNhanHang.col.chiNhanh')}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={chip(idChiNhanh.length === 0)} onClick={() => setIdChiNhanh([])}>
                {t('dangKyNhanHang.inDanhSach.tatCaChiNhanh')}
              </button>
              {chiNhanhOptions.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={idChiNhanh.includes(b.id)}
                  className={chip(idChiNhanh.includes(b.id))}
                  onClick={() =>
                    setIdChiNhanh((cur) => (cur.includes(b.id) ? cur.filter((x) => x !== b.id) : [...cur, b.id]))
                  }
                >
                  {b.ten_chi_nhanh}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">{t('dangKyNhanHang.inDanhSach.hint')}</p>
      </div>
    </GenericDrawer>
  );
};

export default InDanhSachDialog;
