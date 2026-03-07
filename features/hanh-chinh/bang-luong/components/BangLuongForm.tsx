import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, User, Calendar, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import CurrencyInput from '../../../../components/ui/CurrencyInput';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { useAddBangLuong, useSaveBangLuong } from '../hooks/use-bang-luong';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { useQuery } from '@tanstack/react-query';
import type { BangLuongRecord, CongTruLuongItem } from '../core/types';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

interface Props {
  initialRecord?: BangLuongRecord | null;
  defaultEmployeeId?: string;
  onClose: () => void;
}

const BangLuongForm: React.FC<Props> = ({ initialRecord, defaultEmployeeId, onClose }) => {
  const { t } = useTranslation();
  const isEdit = !!initialRecord;
  const addMutation = useAddBangLuong(onClose);
  const saveMutation = useSaveBangLuong(onClose);

  const [id_nhan_vien, setIdNhanVien] = useState(defaultEmployeeId ?? '');
  const [nam, setNam] = useState(currentYear);
  const [thang, setThang] = useState(currentMonth);
  const [congTruItems, setCongTruItems] = useState<CongTruLuongItem[]>(
    initialRecord?.cong_tru_khac ?? []
  );

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-bang-luong'],
    queryFn: getEmployees,
  });

  useEffect(() => {
    if (initialRecord) {
      setCongTruItems(initialRecord.cong_tru_khac.map((i) => ({ ...i })));
    }
  }, [initialRecord]);

  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e.trang_thai === 1)
        .map((e) => ({
          value: e.id,
          label: `${e.ho_ten}${e.ma_nhan_vien ? ` (${e.ma_nhan_vien})` : ''}`,
        })),
    [employees]
  );

  const handleAddItem = () => {
    setCongTruItems((prev) => [
      ...prev,
      { id: `ct-${Date.now()}`, loai: 'cong', so_tien: 0, ly_do: '' },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setCongTruItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof CongTruLuongItem, value: string | number) => {
    setCongTruItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_nhan_vien) return;
    addMutation.mutate({ id_nhan_vien, nam, thang });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialRecord) return;
    const updated: BangLuongRecord = {
      ...initialRecord,
      cong_tru_khac: congTruItems,
    };
    saveMutation.mutate(updated);
  };

  const isLoading = addMutation.isPending || saveMutation.isPending;

  const formId = 'bang-luong-form';

  return (
    <GenericDrawer
      title={isEdit ? t('bangLuong.form.editTitle') : t('bangLuong.form.addTitle')}
      icon={<Banknote size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          saveLabel={t('bangLuong.form.save')}
          createLabel={t('bangLuong.form.addTitle')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id={formId}
        onSubmit={isEdit ? handleSubmitEdit : handleSubmitAdd}
        className="flex flex-col h-full"
      >
        <div className="flex-1 overflow-y-auto space-y-4 px-1">
          {!isEdit ? (
            <>
              <FormSection title={t('bangLuong.form.employee')} icon={<User size={14} />}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('bangLuong.form.employee')} <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={id_nhan_vien}
                    onChange={(e) => setIdNhanVien(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  >
                    <option value="">{t('common.select')}</option>
                    {employeeOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </FormSection>
              <FormSection title={t('bangLuong.form.period')} icon={<Calendar size={14} />}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">{t('bangLuong.form.period')} - Năm</label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={nam}
                      onChange={(e) => setNam(parseInt(e.target.value, 10) || currentYear)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Tháng</label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={thang}
                      onChange={(e) => setThang(parseInt(e.target.value, 10) || 1)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </FormSection>
            </>
          ) : (
            <>
              <FormSection title={t('bangLuong.detail.employee')} icon={<User size={14} />}>
                <p className="text-sm text-foreground">
                  {initialRecord?.ten_nhan_vien} ({initialRecord?.ma_nhan_vien}) · {initialRecord?.nam}-{String(initialRecord?.thang).padStart(2, '0')}
                </p>
              </FormSection>
              <FormSection title={t('bangLuong.form.congTruKhac')} icon={<Banknote size={14} />}>
                <div className="space-y-2">
                  {congTruItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border"
                    >
                      <select
                        value={item.loai}
                        onChange={(e) => handleUpdateItem(item.id, 'loai', e.target.value as 'cong' | 'tru')}
                        className="h-9 w-24 rounded-lg border border-border bg-background text-sm"
                      >
                        <option value="cong">{t('bangLuong.detail.cong')}</option>
                        <option value="tru">{t('bangLuong.detail.tru')}</option>
                      </select>
                      <CurrencyInput
                        value={item.so_tien}
                        onChange={(v) => handleUpdateItem(item.id, 'so_tien', v)}
                        className="flex-1 min-w-[120px]"
                      />
                      <Input
                        placeholder={t('bangLuong.form.lyDo')}
                        value={item.ly_do ?? ''}
                        onChange={(e) => handleUpdateItem(item.id, 'ly_do', e.target.value)}
                        className="flex-1 min-w-[100px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus size={14} className="mr-1" />
                    {t('bangLuong.form.addItem')}
                  </Button>
                </div>
              </FormSection>
            </>
          )}
        </div>
      </form>
    </GenericDrawer>
  );
};

export default BangLuongForm;
