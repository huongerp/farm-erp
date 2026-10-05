import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, Edit, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import Select from '../../../../../components/ui/Select';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { cn } from '../../../../../lib/utils';
import { tieuChiFormSchema, type TieuChiFormValues } from '../../core/schema';
import { LOAI_TIEU_CHI, type TieuChiDanhMuc } from '../../core/types';
import { useLuuTieuChi, useThaoTacTieuChi, useTieuChiDanhMuc } from '../../hooks/use-giam-sat-chat-luong';
import { moTaNguongTieuChi } from '../../utils/mo-ta-nguong';


const RONG: TieuChiFormValues = { ten: '', loai: 'dem_loi', don_vi: 'trái', nguong_min: null, nguong_max: null };

const TieuChiForm: React.FC<{
  initial: TieuChiDanhMuc | null;
  danhMuc: TieuChiDanhMuc[];
  onDone: () => void;
}> = ({ initial, danhMuc, onDone }) => {
  const { t } = useTranslation();
  const luu = useLuuTieuChi(onDone);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TieuChiFormValues>({
    resolver: zodResolver(tieuChiFormSchema) as never,
    defaultValues: initial
      ? { ten: initial.ten, loai: initial.loai, don_vi: initial.don_vi ?? '', nguong_min: initial.nguong_min, nguong_max: initial.nguong_max }
      : RONG,
  });
  const loai = useWatch({ control, name: 'loai' });

  const onSubmit: SubmitHandler<TieuChiFormValues> = (data) => luu.mutate({ id: initial?.id ?? null, data, danhMuc });

  const soInput = (name: 'nguong_min' | 'nguong_max', label: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          label={label}
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          value={field.value == null ? '' : String(field.value)}
          onChange={(e) => field.onChange(e.target.value)}
          error={errors[name]?.message}
        />
      )}
    />
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Controller
          name="ten"
          control={control}
          render={({ field }) => <Input {...field} label={t('giamSatChatLuong.tieuChi.ten')} required error={errors.ten?.message} />}
        />
        <Controller
          name="loai"
          control={control}
          render={({ field }) => (
            <Select
              label={t('giamSatChatLuong.tieuChi.loai')}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              disabled={!!initial}
              options={LOAI_TIEU_CHI.map((v) => ({ value: v, label: t(`giamSatChatLuong.loai.${v}`) }))}
            />
          )}
        />
        {loai !== 'dat_khong' && (
          <Controller
            name="don_vi"
            control={control}
            render={({ field }) => <Input {...field} value={field.value ?? ''} label={t('giamSatChatLuong.tieuChi.donVi')} />}
          />
        )}
        {loai === 'do_luong' && soInput('nguong_min', t('giamSatChatLuong.tieuChi.nguongMinTb'))}
        {soInput(
          'nguong_max',
          t(
            loai === 'dem_loi'
              ? 'giamSatChatLuong.tieuChi.nguongMaxDemLoi'
              : loai === 'do_luong'
                ? 'giamSatChatLuong.tieuChi.nguongMaxTb'
                : 'giamSatChatLuong.tieuChi.nguongMaxDatKhong'
          )
        )}
      </div>
      <p className="text-xs text-muted-foreground m-0">{t(`giamSatChatLuong.tieuChi.hint_${loai}`)}</p>
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

/** Tab "Tiêu chí": danh mục dùng chung (DB). Chỉ cấp cao sửa; người khác xem. */
const TieuChiTab: React.FC<{ canEdit: boolean }> = ({ canEdit }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: danhMuc = [], isLoading } = useTieuChiDanhMuc();
  const thaoTac = useThaoTacTieuChi();
  const [dangSua, setDangSua] = useState<TieuChiDanhMuc | 'moi' | null>(null);

  const doiCho = (i: number, j: number) => {
    if (j < 0 || j >= danhMuc.length) return;
    const ids = danhMuc.map((d) => d.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    thaoTac.mutate({ action: 'sapXep', ids });
  };

  const xoa = (tc: TieuChiDanhMuc) =>
    confirm({
      title: t('giamSatChatLuong.tieuChi.xoaTitle'),
      message: t('giamSatChatLuong.tieuChi.xoaMessage', { ten: tc.ten }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        await thaoTac.mutateAsync({ action: 'xoa', id: tc.id });
      },
    });

  const iconBtn = 'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent';

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground m-0">{t('giamSatChatLuong.tieuChi.gioiThieu')}</p>

      {canEdit && dangSua === null && (
        <Button type="button" size="sm" variant="outline" onClick={() => setDangSua('moi')}>
          <Plus size={14} className="mr-1.5" />
          {t('giamSatChatLuong.tieuChi.them')}
        </Button>
      )}
      {dangSua === 'moi' && <TieuChiForm initial={null} danhMuc={danhMuc} onDone={() => setDangSua(null)} />}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('giamSatChatLuong.loading')}</p>
      ) : (
        <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border">
          {danhMuc.map((tc, i) =>
            dangSua !== 'moi' && dangSua?.id === tc.id ? (
              <li key={tc.id} className="p-2">
                <TieuChiForm initial={tc} danhMuc={danhMuc} onDone={() => setDangSua(null)} />
              </li>
            ) : (
              <li key={tc.id} className={cn('flex items-center gap-2 px-3 py-2', !tc.dang_dung && 'opacity-50')}>
                {canEdit && (
                  <div className="flex flex-col">
                    <button type="button" className={iconBtn} disabled={i === 0 || thaoTac.isPending} onClick={() => doiCho(i, i - 1)} aria-label="↑">
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      className={iconBtn}
                      disabled={i === danhMuc.length - 1 || thaoTac.isPending}
                      onClick={() => doiCho(i, i + 1)}
                      aria-label="↓"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {tc.ten}
                    {tc.don_vi && <span className="text-xs text-muted-foreground font-normal"> ({tc.don_vi})</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t(`giamSatChatLuong.loai.${tc.loai}`)} · {moTaNguongTieuChi(tc, t)}
                  </div>
                </div>
                {canEdit && (
                  <>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tc.dang_dung}
                        onChange={(e) => thaoTac.mutate({ action: 'dangDung', id: tc.id, value: e.target.checked })}
                        className="h-4 w-4 accent-primary"
                      />
                      {t('giamSatChatLuong.tieuChi.dangDung')}
                    </label>
                    <button type="button" className={cn(iconBtn, 'text-primary')} onClick={() => setDangSua(tc)} aria-label={t('common.edit')}>
                      <Edit size={14} />
                    </button>
                    <button type="button" className={cn(iconBtn, 'text-rose-500')} onClick={() => xoa(tc)} aria-label={t('common.delete')}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </li>
            )
          )}
        </ul>
      )}

      <p className="text-xs text-muted-foreground m-0">
        {t(canEdit ? 'giamSatChatLuong.tieuChi.ghiChuApDung' : 'giamSatChatLuong.tieuChi.chiXem')}
      </p>
    </div>
  );
};

export default TieuChiTab;
