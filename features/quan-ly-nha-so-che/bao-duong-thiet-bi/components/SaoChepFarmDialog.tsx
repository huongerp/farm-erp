import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import type { ThietBi } from '../core/types';
import { useSaoChepThietBi } from '../hooks/use-bao-duong-thiet-bi';
import { useBaoDuongFarm } from '../hooks/use-bao-duong-view-scope';

interface Props {
  /** Farm nhận thiết bị (farm đang xem) */
  farmDich: string;
  /** Toàn bộ thiết bị mọi farm — đếm thiết bị đang dùng của từng farm nguồn */
  tatCaThietBi: ThietBi[];
  onClose: () => void;
}

/**
 * Dialog "Sao chép từ farm khác": chọn farm nguồn → RPC chép thiết bị + việc đang dùng sang farm đang xem.
 * Mã TS để trống (mỗi farm mã khác nhau), thiết bị trùng tên đã có thì bỏ qua.
 */
const SaoChepFarmDialog: React.FC<Props> = ({ farmDich, tatCaThietBi, onClose }) => {
  const { t } = useTranslation();
  const { tenFarm } = useBaoDuongFarm();
  const saoChep = useSaoChepThietBi(() => onClose());
  const [farmNguon, setFarmNguon] = useState('');

  // Chỉ farm khác có thiết bị đang dùng mới đáng chọn làm nguồn.
  const options = useMemo(() => {
    const dem = new Map<string, number>();
    for (const tb of tatCaThietBi) {
      if (!tb.dang_dung || tb.id_chi_nhanh === farmDich) continue;
      dem.set(tb.id_chi_nhanh, (dem.get(tb.id_chi_nhanh) ?? 0) + 1);
    }
    return [...dem.entries()]
      .map(([id, n]) => ({ value: id, label: t('baoDuongThietBi.saoChep.option', { ten: tenFarm.get(id) ?? id, n }) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [tatCaThietBi, farmDich, tenFarm, t]);

  const submit = () => {
    if (farmNguon === '') return;
    saoChep.mutate({ tu: farmNguon, den: farmDich });
  };

  return (
    <GenericDrawer
      title={t('baoDuongThietBi.saoChep.tieuDe')}
      subtitle={t('baoDuongThietBi.saoChep.farmDich', { ten: tenFarm.get(farmDich) ?? farmDich })}
      icon={<Copy className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.COMPACT}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saoChep.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={submit} disabled={farmNguon === '' || saoChep.isPending}>
            {t('baoDuongThietBi.saoChep.xacNhan')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Select
          label={t('baoDuongThietBi.saoChep.farmNguon')}
          required
          value={farmNguon}
          onChange={(e) => setFarmNguon(e.target.value)}
          options={options}
          placeholder={options.length > 0 ? t('baoDuongThietBi.saoChep.chonFarm') : t('baoDuongThietBi.saoChep.khongCoNguon')}
        />
        <p className="text-xs text-muted-foreground">{t('baoDuongThietBi.saoChep.ghiChu')}</p>
      </div>
    </GenericDrawer>
  );
};

export default SaoChepFarmDialog;
