/**
 * Chọn kiểu xuất ở danh sách (theo bộ lọc đang áp): Tổng hợp (dialog Xuất cũ, một dòng / phiếu),
 * Chi tiết nhân viên (Excel: ma trận theo dõi vị trí + từng người × ngày), hoặc Cả hai (một file).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Layers, ListOrdered, Users } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import type { KieuXuatNv } from '../utils/export-bao-cao-nhan-cong-nv';
import LuaChonThe from './LuaChonThe';

interface Props {
  tongSo: number;
  toiDaChiTiet: number;
  dangXuat: boolean;
  onTongHop: () => void;
  onChiTiet: (kieu: KieuXuatNv) => void;
  onClose: () => void;
}

const XuatChonKieuDialog: React.FC<Props> = ({ tongSo, toiDaChiTiet, dangXuat, onTongHop, onChiTiet, onClose }) => {
  const { t } = useTranslation();
  const quaNhieu = tongSo > toiDaChiTiet;
  const moTa = (key: string) => (quaNhieu ? t('baoCaoNhanCong.xuat.quaNhieu', { n: tongSo, max: toiDaChiTiet }) : t(key));

  return (
    <GenericDrawer
      title={t('baoCaoNhanCong.xuat.title')}
      subtitle={dangXuat ? t('baoCaoNhanCong.xuat.dangXuat') : t('baoCaoNhanCong.xuat.subtitle', { n: tongSo })}
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
        <LuaChonThe
          icon={<ListOrdered size={20} />}
          tieuDe={t('baoCaoNhanCong.xuat.tongHop')}
          moTa={t('baoCaoNhanCong.xuat.tongHopMoTa')}
          onClick={onTongHop}
          disabled={dangXuat}
        />
        <LuaChonThe
          icon={<Users size={20} />}
          tieuDe={t('baoCaoNhanCong.xuat.chiTiet')}
          moTa={moTa('baoCaoNhanCong.xuat.chiTietMoTa')}
          onClick={() => onChiTiet('chi-tiet')}
          disabled={dangXuat || quaNhieu}
        />
        <LuaChonThe
          icon={<Layers size={20} />}
          tieuDe={t('baoCaoNhanCong.xuat.caHai')}
          moTa={moTa('baoCaoNhanCong.xuat.caHaiMoTa')}
          onClick={() => onChiTiet('ca-hai')}
          disabled={dangXuat || quaNhieu}
        />
      </div>
    </GenericDrawer>
  );
};

export default XuatChonKieuDialog;
