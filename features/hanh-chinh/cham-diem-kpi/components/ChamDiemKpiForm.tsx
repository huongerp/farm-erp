import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Target, Calendar } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '../../../../components/shared/GenericDrawer';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Combobox from '../../../../components/ui/Combobox';
import Select from '../../../../components/ui/Select';
import type { ChamDiemKpiRecord } from '../core/types';
import type { ChamDiemKpiFormValues } from '../core/schema';
import { chamDiemKpiFormSchema } from '../core/schema';
import { computeTyLeAndDiem } from '../core/constants';
import { useSaveChamDiemKpi } from '../hooks/use-cham-diem-kpi';
import { useKpiTheoChucVuByChucVu } from '../hooks/use-cham-diem-kpi';
import { useEmployeesForDiemCongTru } from '../../diem-cong-tru/hooks/use-diem-cong-tru';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

interface Props {
  initialRecord?: ChamDiemKpiRecord | null;
  defaultEmployeeId?: string | null;
  onClose: () => void;
}

const ChamDiemKpiForm: React.FC<Props> = ({
  initialRecord,
  defaultEmployeeId,
  onClose,
}) => {
  const { t } = useTranslation();
  const isEdit = !!initialRecord;
  const saveMutation = useSaveChamDiemKpi(onClose);
  const { data: employees = [] } = useEmployeesForDiemCongTru();

  const defaultValues: ChamDiemKpiFormValues = {
    id_nhan_vien: initialRecord?.id_nhan_vien ?? defaultEmployeeId ?? '',
    nam: initialRecord?.nam ?? currentYear,
    thang: initialRecord?.thang ?? currentMonth,
    items: initialRecord?.chi_tiet?.length
      ? initialRecord.chi_tiet.map((ct) => ({
          id_chi_so: ct.id_chi_so,
          ty_trong: ct.ty_trong,
          loai: ct.loai ?? 'xuoi',
          muc_tieu: ct.muc_tieu,
          thuc_dat: ct.thuc_dat,
          diem: ct.diem,
        }))
      : [],
  };

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ChamDiemKpiFormValues>({
    resolver: zodResolver(chamDiemKpiFormSchema),
    defaultValues,
  });

  const watchedId = watch('id_nhan_vien');
  const employeeId = defaultEmployeeId ?? watchedId ?? initialRecord?.id_nhan_vien ?? '';
  const emp = useMemo(
    () => employees.find((e) => e.id === employeeId),
    [employees, employeeId]
  );
  const { data: kpiTheoChucVu = [], isLoading: loadingKpi } = useKpiTheoChucVuByChucVu(
    emp?.id_chuc_vu ?? null
  );

  const defaultItems = useMemo(() => {
    if (initialRecord?.chi_tiet?.length) {
      return initialRecord.chi_tiet.map((ct) => ({
        id_chi_so: ct.id_chi_so,
        ty_trong: ct.ty_trong,
        loai: ct.loai ?? 'xuoi',
        muc_tieu: ct.muc_tieu,
        thuc_dat: ct.thuc_dat,
        diem: ct.diem,
      }));
    }
    return kpiTheoChucVu.map((kt) => ({
      id_chi_so: kt.id_chi_so,
      ty_trong: kt.ty_trong,
      loai: kt.loai ?? 'xuoi',
      muc_tieu: kt.muc_tieu,
      thuc_dat: undefined,
      diem: 0,
    }));
  }, [initialRecord?.chi_tiet, kpiTheoChucVu]);

  useEffect(() => {
    if (kpiTheoChucVu.length > 0 && !initialRecord) {
      setValue(
        'items',
        kpiTheoChucVu.map((kt) => ({
          id_chi_so: kt.id_chi_so,
          ty_trong: kt.ty_trong,
          loai: kt.loai ?? 'xuoi',
          muc_tieu: kt.muc_tieu,
          thuc_dat: undefined,
          diem: 0,
        }))
      );
    }
  }, [kpiTheoChucVu, initialRecord, setValue]);

  useEffect(() => {
    if (defaultEmployeeId) setValue('id_nhan_vien', defaultEmployeeId);
  }, [defaultEmployeeId, setValue]);

  useEffect(() => {
    if (initialRecord) {
      reset({
        id_nhan_vien: initialRecord.id_nhan_vien,
        nam: initialRecord.nam,
        thang: initialRecord.thang,
        items:
          initialRecord.chi_tiet?.length > 0
            ? initialRecord.chi_tiet.map((ct) => ({
                id_chi_so: ct.id_chi_so,
                ty_trong: ct.ty_trong,
                loai: ct.loai ?? 'xuoi',
                muc_tieu: ct.muc_tieu,
                thuc_dat: ct.thuc_dat,
                diem: ct.diem,
              }))
            : kpiTheoChucVu.map((kt) => ({
                id_chi_so: kt.id_chi_so,
                ty_trong: kt.ty_trong,
                loai: kt.loai ?? 'xuoi',
                muc_tieu: kt.muc_tieu,
                thuc_dat: undefined,
                diem: 0,
              })),
      });
    }
  }, [initialRecord?.id]);

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

  const onSubmit: SubmitHandler<ChamDiemKpiFormValues> = (data) => {
    const itemsWithDiem = data.items.map((item) => {
      const loai = item.loai ?? 'xuoi';
      const muc_tieu = item.muc_tieu;
      const thuc_dat = item.thuc_dat;
      if (muc_tieu != null && thuc_dat != null && !Number.isNaN(muc_tieu) && !Number.isNaN(thuc_dat)) {
        const { diem } = computeTyLeAndDiem(loai, muc_tieu, thuc_dat);
        return { ...item, diem };
      }
      return item;
    });
    saveMutation.mutate({ data: { ...data, items: itemsWithDiem }, id: initialRecord?.id });
  };

  const items = watch('items') ?? [];

  useEffect(() => {
    items.forEach((item, index) => {
      const loai = item.loai ?? 'xuoi';
      const muc_tieu = item.muc_tieu;
      const thuc_dat = item.thuc_dat;
      if (
        muc_tieu != null && thuc_dat != null &&
        !Number.isNaN(muc_tieu) && !Number.isNaN(thuc_dat)
      ) {
        const { diem } = computeTyLeAndDiem(loai, muc_tieu, thuc_dat);
        if (Math.abs((item.diem ?? 0) - diem) > 0.01) {
          setValue(`items.${index}.diem`, diem, { shouldValidate: true });
        }
      }
    });
  }, [items, setValue]);

  return (
    <GenericDrawer
      title={t('chamDiemKpi.form.title')}
      icon={<Target size={20} />}
      onClose={onClose}
      footer={
        <FormDrawerFooter
          formId="cham-diem-kpi-form"
          onCancel={onClose}
          isLoading={saveMutation.isPending}
          isEdit={isEdit}
          saveLabel={t('chamDiemKpi.form.save')}
          createLabel={t('chamDiemKpi.form.save')}
        />
      }
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form
        id="cham-diem-kpi-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormSection title={t('chamDiemKpi.form.period')} icon={<Calendar size={14} />} variant="primary">
          <FormGrid cols={2}>
            {!defaultEmployeeId && (
              <div className="col-span-2">
                <Combobox
                  label={t('chamDiemKpi.form.employee')}
                  options={employeeOptions}
                  value={watch('id_nhan_vien')}
                  onChange={(v) => setValue('id_nhan_vien', v)}
                  placeholder={t('diemCongTru.form.employeePlaceholder')}
                />
              </div>
            )}
            {defaultEmployeeId && (
              <input type="hidden" {...register('id_nhan_vien')} />
            )}
            <Input
              type="number"
              min={2000}
              max={2100}
              label={t('diemCongTru.form.year')}
              {...register('nam')}
              error={errors.nam?.message}
            />
            <Input
              type="number"
              min={1}
              max={12}
              label={t('diemCongTru.form.month')}
              {...register('thang')}
              error={errors.thang?.message}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('chamDiemKpi.form.enterScores')} icon={<Target size={14} />} variant="primary">
          {loadingKpi ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}...</p>
          ) : kpiTheoChucVu.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('chamDiemKpi.form.noKpiAssigned')}
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => {
                const loai = item.loai ?? 'xuoi';
                const muc_tieu = item.muc_tieu;
                const thuc_dat = item.thuc_dat;
                const canCompute =
                  muc_tieu != null && thuc_dat != null && !Number.isNaN(muc_tieu) && !Number.isNaN(thuc_dat);
                const { ty_le } = canCompute
                  ? computeTyLeAndDiem(loai, muc_tieu, thuc_dat)
                  : { ty_le: 0, diem: item.diem };
                return (
                  <div
                    key={item.id_chi_so}
                    className="rounded-lg border border-border p-3 bg-muted/20 space-y-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {kpiTheoChucVu.find((k) => k.id_chi_so === item.id_chi_so)?.ten_chi_so ?? item.id_chi_so}
                        <span className="ml-1 text-muted-foreground">({item.ty_trong}%)</span>
                      </span>
                    </div>
                    <input type="hidden" {...register(`items.${index}.id_chi_so`)} value={item.id_chi_so} />
                    <input type="hidden" {...register(`items.${index}.ty_trong`)} value={item.ty_trong} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 items-end">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-0.5">{t('chamDiemKpi.loai')}</label>
                        <Select
                          value={loai}
                          onChange={(e) => setValue(`items.${index}.loai`, (e.target.value || 'xuoi') as 'xuoi' | 'nguoc')}
                          options={[
                            { value: 'xuoi', label: t('chamDiemKpi.loaiChiSo.xuoi') },
                            { value: 'nguoc', label: t('chamDiemKpi.loaiChiSo.nguoc') },
                          ]}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          label={t('chamDiemKpi.mucTieu')}
                          placeholder="—"
                          {...register(`items.${index}.muc_tieu`, { valueAsNumber: true })}
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          label={t('chamDiemKpi.thucDat')}
                          placeholder="—"
                          {...register(`items.${index}.thuc_dat`, { valueAsNumber: true })}
                        />
                      </div>
                      <div className="text-sm">
                        <span className="block text-xs text-muted-foreground">{t('chamDiemKpi.tyLe')}</span>
                        <span className="font-medium tabular-nums">{canCompute ? `${ty_le}%` : '—'}</span>
                      </div>
                      <div>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          label={t('chamDiemKpi.diem')}
                          placeholder="0-100"
                          {...register(`items.${index}.diem`, { valueAsNumber: true })}
                          readOnly={canCompute}
                          title={canCompute ? t('chamDiemKpi.tyLe') : undefined}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ChamDiemKpiForm;
