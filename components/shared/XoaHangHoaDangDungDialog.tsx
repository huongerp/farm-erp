import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Trash2 } from 'lucide-react';
import GenericDrawer from './GenericDrawer';
import Button from '../ui/Button';
import { BTN_CLOSE } from '../../lib/button-labels';
import { DIALOG_SIZE } from '../../lib/dialog-sizes';
import { formatDate } from '../../lib/utils';
import { duongDanPhieu, type PhanLoaiXoa, type PhieuDangDung } from '../../lib/hang-hoa-dang-dung';

/** Mỗi hàng chỉ hiện vài phiếu đầu — một mặt hàng hay dùng có thể nằm trong hàng trăm phiếu kho. */
const SO_PHIEU_HIEN = 6;

interface Props {
  phanLoai: PhanLoaiXoa;
  /** id → mã/tên hàng (lấy từ ref cache, vì hàng đã chọn có thể nằm ở trang khác). */
  thongTinHang: Map<string, { ma: string; ten: string }>;
  isDeleting: boolean;
  onXoa: () => void;
  onClose: () => void;
}

const PhieuChip: React.FC<{ p: PhieuDangDung }> = ({ p }) => {
  const { t } = useTranslation();
  const href = duongDanPhieu(p.loai, p.idPhieu);
  const noiDung = (
    <>
      <span className="text-muted-foreground">{t(`common.xoaDangDung.loai.${p.loai}`)}</span>
      <span className="font-medium text-foreground">{p.soPhieu}</span>
      {p.ngay && <span className="text-muted-foreground">{formatDate(p.ngay)}</span>}
      {p.trangThai && <span className="text-muted-foreground">· {p.trangThai}</span>}
      {p.soDong > 1 && <span className="text-muted-foreground">· {t('common.xoaDangDung.soDong', { count: p.soDong })}</span>}
    </>
  );
  const cls = 'inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs';
  if (!href) return <span className={cls}>{noiDung}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={t('common.xoaDangDung.moPhieu')}
      className={`${cls} hover:border-primary/50 hover:bg-primary/5`}
    >
      {noiDung}
      <ExternalLink size={12} className="text-muted-foreground" />
    </a>
  );
};

/**
 * Xoá hàng hoá khi có hàng đang dùng ở phiếu: chỉ xoá hàng không dùng, liệt kê phiếu của hàng còn lại.
 * Dùng chung cho danh mục hàng hoá Mua hàng và Nhà sơ chế.
 */
const XoaHangHoaDangDungDialog: React.FC<Props> = ({ phanLoai, thongTinHang, isDeleting, onXoa, onClose }) => {
  const { t } = useTranslation();
  const [moRong, setMoRong] = useState<Set<string>>(() => new Set());
  const { xoaDuoc, dangDung, tongPhieu } = phanLoai;

  return (
    <GenericDrawer
      title={t('common.xoaDangDung.title')}
      subtitle={t('common.xoaDangDung.tomTat', { xoaDuoc: xoaDuoc.length, dangDung: dangDung.length, soPhieu: tongPhieu })}
      icon={<Trash2 className="text-destructive" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" size="sm" onClick={onClose} className="border-border">
            {BTN_CLOSE()}
          </Button>
          <Button variant="destructive" size="sm" onClick={onXoa} disabled={xoaDuoc.length === 0} loading={isDeleting}>
            {xoaDuoc.length > 0 ? t('common.xoaDangDung.xoaDuocBtn', { count: xoaDuoc.length }) : t('common.xoaDangDung.khongXoaDuoc')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 pb-2">
        <p className="text-sm text-muted-foreground">{t('common.xoaDangDung.giaiThich')}</p>
        <ul className="divide-y divide-border rounded-xl border border-border">
          {dangDung.map(({ idHangHoa, phieu }) => {
            const hang = thongTinHang.get(idHangHoa);
            const hienHet = moRong.has(idHangHoa);
            const hien = hienHet ? phieu : phieu.slice(0, SO_PHIEU_HIEN);
            const conLai = phieu.length - hien.length;
            return (
              <li key={idHangHoa} className="space-y-2 p-3">
                <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{hang?.ma ?? `#${idHangHoa}`}</span>
                  <span className="font-medium text-foreground">{hang?.ten ?? ''}</span>
                  <span className="text-xs text-muted-foreground">· {t('common.xoaDangDung.soPhieu', { count: phieu.length })}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {hien.map((p) => (
                    <PhieuChip key={`${p.loai}:${p.idPhieu}`} p={p} />
                  ))}
                  {conLai > 0 && (
                    <button
                      type="button"
                      onClick={() => setMoRong((s) => new Set(s).add(idHangHoa))}
                      className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      {t('common.xoaDangDung.conLai', { count: conLai })} — {t('common.xoaDangDung.xemThem')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </GenericDrawer>
  );
};

export default XoaHangHoaDangDungDialog;
