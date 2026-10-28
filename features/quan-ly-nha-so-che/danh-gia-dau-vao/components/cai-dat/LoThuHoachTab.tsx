import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import Select from '../../../../../components/ui/Select';
import Combobox from '../../../../../components/ui/Combobox';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { cn } from '../../../../../lib/utils';
import { TRANG_THAI } from '../../../../../lib/constants';
import { useBranches } from '../../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { loThuHoachFormSchema, type LoThuHoachFormValues } from '../../core/schema';
import type { VarLoThuHoach } from '../../core/types';
import { useLoThuHoach, useLuuLoThuHoach, useNhanVienRef, useXoaLoThuHoach } from '../../hooks/use-danh-muc-dgdv';
import { tenKhongTrung } from '../../core/chuan-hoa-ten';

interface Opt {
  value: string;
  label: string;
}

const LoForm: React.FC<{
  initial: VarLoThuHoach | null;
  idChiNhanhMacDinh: string;
  chiNhanhOptions: Opt[];
  toTruongOptions: Opt[];
  onDone: () => void;
}> = ({ initial, idChiNhanhMacDinh, chiNhanhOptions, toTruongOptions, onDone }) => {
  const { t } = useTranslation();
  const luu = useLuuLoThuHoach(onDone);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoThuHoachFormValues>({
    resolver: zodResolver(loThuHoachFormSchema) as Resolver<LoThuHoachFormValues>,
    defaultValues: initial
      ? {
          ten_lo: initial.ten_lo,
          id_chi_nhanh: initial.id_chi_nhanh,
          to_truong: initial.to_truong,
          ghi_chu: initial.ghi_chu ?? '',
          thu_tu: initial.thu_tu,
          dang_dung: initial.dang_dung,
        }
      : { ten_lo: '', id_chi_nhanh: idChiNhanhMacDinh, to_truong: null, ghi_chu: '', thu_tu: 0, dang_dung: true },
  });
  const onSubmit: SubmitHandler<LoThuHoachFormValues> = (data) => luu.mutate({ id: initial?.id ?? null, data });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name="ten_lo"
          control={control}
          render={({ field }) => <Input {...field} label={t('danhGiaDauVao.caiDat.tenLo')} required error={errors.ten_lo?.message} />}
        />
        <Controller
          name="id_chi_nhanh"
          control={control}
          render={({ field }) => (
            <Select
              label={t('danhGiaDauVao.form.branch')}
              required
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
              options={chiNhanhOptions}
              placeholder={t('danhGiaDauVao.form.branchPlaceholder')}
              error={errors.id_chi_nhanh?.message as string | undefined}
            />
          )}
        />
        <Controller
          name="to_truong"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t('danhGiaDauVao.form.toTruong')}
              options={toTruongOptions}
              value={field.value ?? ''}
              onChange={(v) => field.onChange(v ? String(v).trim() : null)}
              placeholder={t('danhGiaDauVao.form.chonToTruong')}
              creatable
              creatableLabel={t('danhGiaDauVao.form.dungTen')}
              dropdownInPortal
            />
          )}
        />
        <Controller
          name="thu_tu"
          control={control}
          render={({ field }) => (
            <Input
              label={t('danhGiaDauVao.caiDat.thuTu')}
              type="number"
              min={0}
              value={field.value == null ? '' : String(field.value)}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <Controller
          name="ghi_chu"
          control={control}
          render={({ field }) => (
            <Input {...field} value={field.value ?? ''} label={t('danhGiaDauVao.form.ghiChuLo')} className="sm:col-span-2" />
          )}
        />
      </div>
      <Controller
        name="dang_dung"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 accent-primary" checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />
            {t('danhGiaDauVao.caiDat.dangDung')}
          </label>
        )}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={luu.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
};

/** Tab «Lô thu hoạch»: lô theo chi nhánh + tổ trưởng mặc định (chép vào phiếu khi thêm lô). */
const LoThuHoachTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: dsLo = [], isLoading } = useLoThuHoach();
  const { data: branches = [] } = useBranches();
  const { data: dsNhanVien = [] } = useNhanVienRef();
  const xoa = useXoaLoThuHoach();
  const [locCn, setLocCn] = useState('');
  const [dangSua, setDangSua] = useState<VarLoThuHoach | 'moi' | null>(null);

  const chiNhanhOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG || dsLo.some((l) => l.id_chi_nhanh === String(b.id)))
        .map((b) => ({ value: String(b.id), label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
    [branches, dsLo]
  );
  const toTruongOptions = useMemo(
    () => tenKhongTrung([...dsLo.map((l) => l.to_truong), ...dsNhanVien.map((e) => e.ho_ten)]).map((ten) => ({ value: ten, label: ten })),
    [dsLo, dsNhanVien]
  );
  const hienThi = locCn ? dsLo.filter((l) => l.id_chi_nhanh === locCn) : dsLo;
  const iconBtn = 'p-1.5 rounded-md hover:bg-muted';
  const formProps = { idChiNhanhMacDinh: locCn, chiNhanhOptions, toTruongOptions, onDone: () => setDangSua(null) };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-64">
          <Select
            label={t('danhGiaDauVao.toolbar.filterBranch')}
            value={locCn}
            onChange={(e) => setLocCn(e.target.value)}
            options={[{ value: '', label: t('danhGiaDauVao.caiDat.tatCaChiNhanh') }, ...chiNhanhOptions]}
          />
        </div>
        {dangSua === null && (
          <Button type="button" size="sm" variant="outline" onClick={() => setDangSua('moi')}>
            <Plus size={14} className="mr-1.5" />
            {t('danhGiaDauVao.caiDat.themLo')}
          </Button>
        )}
      </div>
      {dangSua === 'moi' && <LoForm initial={null} {...formProps} />}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.loading')}</p>
      ) : hienThi.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.caiDat.chuaCoLo')}</p>
      ) : (
        <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border">
          {hienThi.map((l) =>
            dangSua !== 'moi' && dangSua?.id === l.id ? (
              <li key={l.id} className="p-2">
                <LoForm initial={l} {...formProps} />
              </li>
            ) : (
              <li key={l.id} className={cn('flex items-center gap-3 px-3 py-2', !l.dang_dung && 'opacity-50')}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{l.ten_lo}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {[l.ten_chi_nhanh, l.to_truong ? `${t('danhGiaDauVao.form.toTruong')}: ${l.to_truong}` : null, l.ghi_chu]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <button type="button" className={cn(iconBtn, 'text-primary')} onClick={() => setDangSua(l)} aria-label={t('common.edit')}>
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  className={cn(iconBtn, 'text-rose-500')}
                  aria-label={t('common.delete')}
                  onClick={() =>
                    confirm({
                      title: t('danhGiaDauVao.caiDat.xoaTitle'),
                      message: t('danhGiaDauVao.caiDat.xoaLoMessage', { ten: l.ten_lo }),
                      variant: 'danger',
                      confirmText: t('common.delete'),
                      onConfirm: async () => {
                        await xoa.mutateAsync(l.id);
                      },
                    })
                  }
                >
                  <Trash2 size={14} />
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default LoThuHoachTab;
