import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Folder, ArrowUpFromLine, Power } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import StatusToggle from '../../../../components/ui/StatusToggle';
import LoaiToggleGroup from './LoaiToggleGroup';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { NhomDoiTac } from '../core/types';
import { TRANG_THAI_DOI_TAC } from '../core/types';
import type { LoaiDoiTac } from '../core/types';
import type { NhomDoiTacFormValues } from '../services/doi-tac-service';

interface NhomFormDrawerProps {
  initialData: NhomDoiTac | null;
  /** Khi tạo mới: thứ tự mặc định (tự tăng từ max + 1). Bỏ qua nếu initialData có sẵn. */
  defaultThuTu?: number;
  /** Khi tạo mới từ form đối tác: loại mặc định theo tab (nha_cung_cap / khach_hang). */
  defaultLoai?: LoaiDoiTac;
  onClose: () => void;
  onSave: (data: NhomDoiTacFormValues) => void;
  isSaving: boolean;
}

const NhomFormDrawer: React.FC<NhomFormDrawerProps> = ({ initialData, defaultThuTu, defaultLoai, onClose, onSave, isSaving }) => {
  const { t } = useTranslation();
  const isEdit = !!initialData;
  const [maNhom, setMaNhom] = useState(initialData?.ma_nhom ?? '');
  const [tenNhom, setTenNhom] = useState(initialData?.ten_nhom ?? '');
  const [loai, setLoai] = useState<LoaiDoiTac | ''>(
    initialData?.loai && (initialData.loai === 'nha_cung_cap' || initialData.loai === 'khach_hang')
      ? initialData.loai
      : (defaultLoai ?? 'nha_cung_cap')
  );
  const [loaiError, setLoaiError] = useState('');

  const loaiOptions = useMemo(
    (): { value: LoaiDoiTac; label: string }[] => [
      { value: 'nha_cung_cap', label: t('doiTac.tabs.nhaCungCap') },
      { value: 'khach_hang', label: t('doiTac.tabs.khachHang') },
    ],
    [t]
  );

  const [thuTu, setThuTu] = useState(initialData?.thu_tu ?? defaultThuTu ?? 1);
  const [trangThai, setTrangThai] = useState(initialData?.trang_thai ?? TRANG_THAI_DOI_TAC.DANG_HOAT_DONG);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoaiError('');
    if (loai !== 'nha_cung_cap' && loai !== 'khach_hang') {
      setLoaiError(t('doiTac.validation.loaiRequired'));
      return;
    }
    if (!maNhom.trim() || !tenNhom.trim()) return;
    onSave({
      ma_nhom: maNhom.trim().toUpperCase(),
      ten_nhom: tenNhom.trim(),
      loai: loai as LoaiDoiTac,
      thu_tu: thuTu,
      trang_thai: trangThai,
    });
  };

  return (
    <GenericDrawer
      title={isEdit ? t('doiTac.danhMuc.editNhom') : t('doiTac.danhMuc.addNhom')}
      icon={<Folder size={20} />}
      onClose={onClose}
      maxWidthClass={DRAWER_WIDTH_FORM}
      footer={
        <FormDrawerFooter
          formId="nhom-doi-tac-form"
          onCancel={onClose}
          isLoading={isSaving}
          isEdit={isEdit}
          saveLabel={t('doiTac.form.save')}
          createLabel={t('doiTac.form.create')}
        />
      }
    >
      <form id="nhom-doi-tac-form" onSubmit={handleSubmit} className="space-y-5">
        <FormSection title={t('doiTac.detail.basicInfo')} icon={<Folder size={14} />} variant="primary">
          <FormGrid cols={2}>
            <div className="col-span-1 sm:col-span-2">
              <LoaiToggleGroup
                label={t('doiTac.danhMuc.form.loai')}
                options={loaiOptions}
                value={loai === 'nha_cung_cap' || loai === 'khach_hang' ? loai : 'nha_cung_cap'}
                onChange={(v) => { setLoai(v); setLoaiError(''); }}
                required
                error={loaiError}
              />
            </div>
            <Input
              label={t('doiTac.danhMuc.form.maNhom')}
              placeholder="VD: VT, NL"
              icon={<Folder size={12} />}
              value={maNhom}
              onChange={(e) => setMaNhom(e.target.value)}
              disabled={isEdit}
              required
            />
            <Input
              label={t('doiTac.danhMuc.form.tenNhom')}
              placeholder="VD: Vật tư"
              icon={<Folder size={12} />}
              value={tenNhom}
              onChange={(e) => setTenNhom(e.target.value)}
              required
            />
            <Input
              type="number"
              min={0}
              label={t('doiTac.danhMuc.form.thuTu')}
              placeholder="0"
              icon={<ArrowUpFromLine size={12} />}
              value={thuTu}
              onChange={(e) => setThuTu(Number(e.target.value) || 0)}
            />
            <div className="col-span-1 sm:col-span-2">
              <StatusToggle
                label={t('doiTac.danhMuc.form.trangThai')}
                value={trangThai}
                onChange={(value) => setTrangThai(value as typeof trangThai)}
                activeValue={TRANG_THAI_DOI_TAC.DANG_HOAT_DONG}
                inactiveValue={TRANG_THAI_DOI_TAC.NGUNG_HOAT_DONG}
                activeLabel={t('common.activeStatus')}
                inactiveLabel={t('common.inactiveStatus')}
                icon={<Power size={12} />}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default NhomFormDrawer;
