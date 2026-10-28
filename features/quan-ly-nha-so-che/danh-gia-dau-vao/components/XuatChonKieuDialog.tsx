/**
 * Chọn kiểu xuất ở tab Phiếu chuyến: chi tiết dạng dòng (khuôn file import, nhập ngược lại được) hoặc
 * danh sách tóm tắt 1 dòng / chuyến (ExportDialog cũ). Cả hai theo bộ lọc đang áp.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileSpreadsheet, ListOrdered } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';

interface Props {
  tongSo: number;
  toiDaChiTiet: number;
  dangXuat: boolean;
  onChiTiet: () => void;
  onTomTat: () => void;
  onClose: () => void;
}

const XuatChonKieuDialog: React.FC<Props> = ({ tongSo, toiDaChiTiet, dangXuat, onChiTiet, onTomTat, onClose }) => {
  const { t } = useTranslation();
  const quaNhieu = tongSo > toiDaChiTiet;
  const luaChon = (
    icon: React.ReactNode,
    tieuDe: string,
    moTa: string,
    onClick: () => void,
    disabled = false
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left rounded-lg border border-border p-3 flex gap-3 hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-border"
    >
      <span className="mt-0.5 text-primary shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{tieuDe}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{moTa}</span>
      </span>
    </button>
  );

  return (
    <GenericDrawer
      title={t('danhGiaDauVao.xuat.title')}
      subtitle={t('danhGiaDauVao.xuat.subtitle', { n: tongSo })}
      icon={<Download size={20} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.COMPACT}
      footer={
        <div className="flex w-full justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="border-border">
            {BTN_CLOSE()}
          </Button>
        </div>
      }
    >
      <div className="space-y-2.5 pb-2">
        {luaChon(
          <FileSpreadsheet size={20} />,
          t('danhGiaDauVao.xuat.chiTiet'),
          quaNhieu
            ? t('danhGiaDauVao.xuat.quaNhieu', { n: tongSo, max: toiDaChiTiet })
            : t('danhGiaDauVao.xuat.chiTietMoTa'),
          onChiTiet,
          dangXuat || quaNhieu
        )}
        {luaChon(<ListOrdered size={20} />, t('danhGiaDauVao.xuat.tomTat'), t('danhGiaDauVao.xuat.tomTatMoTa'), onTomTat, dangXuat)}
      </div>
    </GenericDrawer>
  );
};

export default XuatChonKieuDialog;
