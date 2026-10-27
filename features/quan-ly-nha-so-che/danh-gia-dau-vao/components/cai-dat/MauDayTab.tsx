import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { cn } from '../../../../../lib/utils';
import { mauDayFormSchema, type MauDayFormValues } from '../../core/schema';
import type { VarMauDay } from '../../core/types';
import { useLuuMauDay, useMauDay, useXoaMauDay } from '../../hooks/use-danh-muc-dgdv';
import { styleTieuDeCot } from '../../utils/mau-day';

const HEX_RE = /^#[0-9A-F]{6}$/;

const MauDayForm: React.FC<{ initial: VarMauDay | null; dsMau: VarMauDay[]; onDone: () => void }> = ({ initial, dsMau, onDone }) => {
  const { t } = useTranslation();
  const luu = useLuuMauDay(onDone);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MauDayFormValues>({
    resolver: zodResolver(mauDayFormSchema) as Resolver<MauDayFormValues>,
    defaultValues: initial
      ? { ten: initial.ten, ma_mau: initial.ma_mau, thu_tu: initial.thu_tu, dang_dung: initial.dang_dung }
      : { ten: '', ma_mau: '#000000', thu_tu: (dsMau.at(-1)?.thu_tu ?? 0) + 1, dang_dung: true },
  });
  const maMau = String(useWatch({ control, name: 'ma_mau' }) ?? '').trim().toUpperCase();
  /** Màu khác đã dùng mã này (DB cũng chặn bằng UNIQUE) — báo trước, không cho lưu. */
  const trung = dsMau.find((m) => m.id !== initial?.id && m.ma_mau.toUpperCase() === maMau);

  const onSubmit: SubmitHandler<MauDayFormValues> = (data) => {
    if (trung) return;
    luu.mutate({ id: initial?.id ?? null, data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_12rem_6rem] gap-3">
        <Controller
          name="ten"
          control={control}
          render={({ field }) => <Input {...field} label={t('danhGiaDauVao.caiDat.tenMau')} required error={errors.ten?.message} />}
        />
        <Controller
          name="ma_mau"
          control={control}
          render={({ field }) => (
            <div>
              <span className="block text-xs font-medium mb-1">{t('danhGiaDauVao.caiDat.maMau')}</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-10 w-12 rounded-lg border border-border bg-background p-1 cursor-pointer"
                  value={HEX_RE.test(maMau) ? maMau.toLowerCase() : '#000000'}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  aria-label={t('danhGiaDauVao.caiDat.maMau')}
                />
                <input
                  className="h-10 w-full rounded-lg border border-border bg-background px-2 text-body-sm uppercase tabular-nums"
                  value={field.value ?? ''}
                  maxLength={7}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
              </div>
              {errors.ma_mau?.message && <p className="text-caption text-rose-600 m-0 mt-0.5">{errors.ma_mau.message}</p>}
            </div>
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
      {trung && (
        <p className="text-xs text-rose-600 m-0">{t('danhGiaDauVao.caiDat.trungMaMau', { ten: trung.ten })}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={luu.isPending || !!trung}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
};

/** Tab «Màu dây»: 10 màu gốc + mã màu không trùng. Màu ngừng dùng vẫn giữ để phiếu cũ hiện đúng. */
const MauDayTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: dsMau = [], isLoading } = useMauDay();
  const xoa = useXoaMauDay();
  const [dangSua, setDangSua] = useState<VarMauDay | 'moi' | null>(null);
  const iconBtn = 'p-1.5 rounded-md hover:bg-muted';

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground m-0">{t('danhGiaDauVao.caiDat.mauGioiThieu')}</p>
      {dangSua === null && (
        <Button type="button" size="sm" variant="outline" onClick={() => setDangSua('moi')}>
          <Plus size={14} className="mr-1.5" />
          {t('danhGiaDauVao.caiDat.themMau')}
        </Button>
      )}
      {dangSua === 'moi' && <MauDayForm initial={null} dsMau={dsMau} onDone={() => setDangSua(null)} />}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.loading')}</p>
      ) : (
        <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border">
          {dsMau.map((m) =>
            dangSua !== 'moi' && dangSua?.id === m.id ? (
              <li key={m.id} className="p-2">
                <MauDayForm initial={m} dsMau={dsMau} onDone={() => setDangSua(null)} />
              </li>
            ) : (
              <li key={m.id} className={cn('flex items-center gap-3 px-3 py-2', !m.dang_dung && 'opacity-50')}>
                <span className="h-6 w-10 rounded border border-border shrink-0" style={styleTieuDeCot(m.ma_mau, null)} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{m.ten}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {m.ma_mau} · {t('danhGiaDauVao.caiDat.thuTu')} {m.thu_tu}
                    {!m.dang_dung && ` · ${t('danhGiaDauVao.form.ngungDung')}`}
                  </div>
                </div>
                <button type="button" className={cn(iconBtn, 'text-primary')} onClick={() => setDangSua(m)} aria-label={t('common.edit')}>
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  className={cn(iconBtn, 'text-rose-500')}
                  aria-label={t('common.delete')}
                  onClick={() =>
                    confirm({
                      title: t('danhGiaDauVao.caiDat.xoaTitle'),
                      message: t('danhGiaDauVao.caiDat.xoaMauMessage', { ten: m.ten }),
                      variant: 'danger',
                      confirmText: t('common.delete'),
                      onConfirm: async () => {
                        await xoa.mutateAsync(m.id);
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

export default MauDayTab;
