/**
 * Chọn nội dung in từ chi tiết phiếu: bảng chuyền, danh sách nhân viên, hoặc cả hai.
 * Phiếu chưa nhập tên → hai lựa chọn có danh sách bị khoá.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Factory, Layers, Printer, Users } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import { BTN_CLOSE } from '../../../../lib/button-labels';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import type { NoiDungIn } from '../core/preview-url';
import LuaChonThe from './LuaChonThe';

interface Props {
  coDanhSachTen: boolean;
  onChon: (noiDung: NoiDungIn) => void;
  onClose: () => void;
}

const ChonKieuInDialog: React.FC<Props> = ({ coDanhSachTen, onChon, onClose }) => {
  const { t } = useTranslation();
  const moTaNv = (key: string) => (coDanhSachTen ? t(key) : t('baoCaoNhanCong.inKieu.chuaCoTen'));

  return (
    <GenericDrawer
      title={t('baoCaoNhanCong.inKieu.title')}
      subtitle={t('baoCaoNhanCong.inKieu.subtitle')}
      icon={<Printer size={20} />}
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
          icon={<Factory size={20} />}
          tieuDe={t('baoCaoNhanCong.inKieu.chuyen')}
          moTa={t('baoCaoNhanCong.inKieu.chuyenMoTa')}
          onClick={() => onChon('chuyen')}
        />
        <LuaChonThe
          icon={<Users size={20} />}
          tieuDe={t('baoCaoNhanCong.inKieu.nhanVien')}
          moTa={moTaNv('baoCaoNhanCong.inKieu.nhanVienMoTa')}
          onClick={() => onChon('nhan-vien')}
          disabled={!coDanhSachTen}
        />
        <LuaChonThe
          icon={<Layers size={20} />}
          tieuDe={t('baoCaoNhanCong.inKieu.caHai')}
          moTa={moTaNv('baoCaoNhanCong.inKieu.caHaiMoTa')}
          onClick={() => onChon('ca-hai')}
          disabled={!coDanhSachTen}
        />
      </div>
    </GenericDrawer>
  );
};

export default ChonKieuInDialog;
