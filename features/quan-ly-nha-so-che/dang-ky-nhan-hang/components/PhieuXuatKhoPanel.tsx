import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ExternalLink, Lock, PackageCheck, RefreshCw } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../lib/utils';
import { BIEN_THE_SO_CHE, khoPreviewUrl } from '../../kho-bien-the/bien-the';
import type { ChenhLechThanhPham, PhieuXuatCuaXe, TinhTrangPhieuXuat } from '../core/phieu-xuat';
import PhieuXuatBadge from './PhieuXuatBadge';

interface Props {
  phieu: PhieuXuatCuaXe | null;
  tinhTrang: TinhTrangPhieuXuat | null;
  chenhLech: ChenhLechThanhPham[];
  /** coTheTaoPhieuXuat && quyền sửa. */
  coTheTao: boolean;
  /** Phiếu đã duyệt, người dùng không phải cấp cao / chưa được cấp Xin sửa. */
  khoa: boolean;
  onTao: () => void;
}

/**
 * Dải "Phiếu xuất kho" đầu bảng cây hàng: chưa có → nút Tạo; đã có → số phiếu + trạng thái;
 * cây hàng đổi sau khi tạo (quét thêm / sửa / xoá) → khung cảnh báo liệt kê chênh lệch + nút Cập nhật.
 */
const PhieuXuatKhoPanel: React.FC<Props> = ({ phieu, tinhTrang, chenhLech, coTheTao, khoa, onTao }) => {
  const { t } = useTranslation();
  const lech = tinhTrang === 'can_cap_nhat';

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5 space-y-2',
        lech ? 'border-rose-500/40 bg-rose-500/5' : 'border-border bg-muted/30'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <PackageCheck size={15} className="text-primary shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dangKyNhanHang.col.phieuXuat')}
        </span>
        {phieu ? (
          <a
            href={khoPreviewUrl(BIEN_THE_SO_CHE, 'phieu-kho-phan-thuoc', phieu.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-mono font-semibold text-primary hover:underline"
          >
            {phieu.so_phieu}
            <ExternalLink size={12} />
          </a>
        ) : null}
        <PhieuXuatBadge value={tinhTrang} />
        {phieu && (
          <span className="text-caption text-muted-foreground tabular-nums">
            {[phieu.ten_kho, formatYmdToDisplay(phieu.ngay)].filter(Boolean).join(' · ')}
          </span>
        )}
        {coTheTao && (!phieu || lech) && (
          <Button
            type="button"
            size="sm"
            variant={phieu ? 'default' : 'outline'}
            className="ml-auto min-h-[36px]"
            onClick={onTao}
          >
            {phieu ? <RefreshCw size={14} className="mr-1.5" /> : <PackageCheck size={14} className="mr-1.5" />}
            {t(phieu ? 'dangKyNhanHang.phieuXuat.nutCapNhat' : 'dangKyNhanHang.phieuXuat.nutTao')}
          </Button>
        )}
      </div>

      {lech && (
        <div className="space-y-1">
          <p className="m-0 flex items-center gap-1.5 text-sm font-medium text-rose-700 dark:text-rose-300">
            <AlertTriangle size={14} className="shrink-0" />
            {t('dangKyNhanHang.phieuXuat.canCapNhatTitle')}
          </p>
          <ul className="m-0 pl-5 list-disc text-caption text-foreground/80 tabular-nums space-y-0.5">
            {chenhLech.map((c) => (
              <li key={c.id_hang_hoa || '_'}>
                <span className="font-medium">{c.ten_hang_hoa || t('dangKyNhanHang.phieuXuat.chuaCoThanhPham')}</span>
                {': '}
                {c.so_luong_xe === 0
                  ? t('dangKyNhanHang.phieuXuat.lechDaBo', { phieu: formatNumberVN(c.so_luong_phieu) })
                  : c.so_luong_phieu === 0
                    ? t('dangKyNhanHang.phieuXuat.lechMoi', { xe: formatNumberVN(c.so_luong_xe) })
                    : t('dangKyNhanHang.phieuXuat.lechSo', {
                        phieu: formatNumberVN(c.so_luong_phieu),
                        xe: formatNumberVN(c.so_luong_xe),
                      })}
              </li>
            ))}
          </ul>
          {khoa && (
            <p className="m-0 flex items-center gap-1.5 text-caption text-muted-foreground">
              <Lock size={12} className="shrink-0" />
              {t('dangKyNhanHang.phieuXuat.khoaXinSua')}
            </p>
          )}
        </div>
      )}
      {!lech && khoa && (
        <p className="m-0 flex items-center gap-1.5 text-caption text-muted-foreground">
          <Lock size={12} className="shrink-0" />
          {t('dangKyNhanHang.phieuXuat.khoaCayHang')}
        </p>
      )}
    </div>
  );
};

export default PhieuXuatKhoPanel;
