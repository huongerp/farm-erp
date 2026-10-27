import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import Select from '../../../../../components/ui/Select';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { cn } from '../../../../../lib/utils';
import { dgdvLyDoFormSchema, type DgdvLyDoFormValues } from '../../core/schema';
import { LOAI_LY_DO_DGDV, type LoaiLyDoDgdv, type VarDgdvLyDo } from '../../core/types';
import { useLuuLyDo, useLyDoDgdv, useXoaLyDo } from '../../hooks/use-danh-muc-dgdv';

const LOAI: LoaiLyDoDgdv[] = [LOAI_LY_DO_DGDV.DANH_GIA, LOAI_LY_DO_DGDV.LOI];

const LyDoForm: React.FC<{ initial: VarDgdvLyDo | null; loaiMacDinh: LoaiLyDoDgdv; onDone: () => void }> = ({
  initial,
  loaiMacDinh,
  onDone,
}) => {
  const { t } = useTranslation();
  const luu = useLuuLyDo(onDone);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DgdvLyDoFormValues>({
    resolver: zodResolver(dgdvLyDoFormSchema) as Resolver<DgdvLyDoFormValues>,
    defaultValues: initial ? { ten: initial.ten, loai: initial.loai, thu_tu: initial.thu_tu } : { ten: '', loai: loaiMacDinh, thu_tu: 0 },
  });
  const onSubmit: SubmitHandler<DgdvLyDoFormValues> = (data) => luu.mutate({ id: initial?.id ?? null, data });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_6rem] gap-3">
        <Controller
          name="ten"
          control={control}
          render={({ field }) => <Input {...field} label={t('danhGiaDauVao.caiDat.tenLyDo')} required error={errors.ten?.message} />}
        />
        <Controller
          name="loai"
          control={control}
          render={({ field }) => (
            <Select
              label={t('danhGiaDauVao.caiDat.loai')}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              options={LOAI.map((v) => ({ value: v, label: t(`danhGiaDauVao.caiDat.loai_${v}`) }))}
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
      </div>
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

/** Tab «Lý do»: gợi ý chọn nhanh cho ô Đánh giá và ô Lý do lỗi (ô vẫn gõ tự do được). */
const LyDoTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: dsLyDo = [], isLoading } = useLyDoDgdv();
  const xoa = useXoaLyDo();
  const [dangSua, setDangSua] = useState<VarDgdvLyDo | LoaiLyDoDgdv | null>(null);
  const iconBtn = 'p-1.5 rounded-md hover:bg-muted';

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.loading')}</p>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground m-0">{t('danhGiaDauVao.caiDat.lyDoGioiThieu')}</p>
      {LOAI.map((loai) => {
        const ds = dsLyDo.filter((x) => x.loai === loai);
        return (
          <section key={loai} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold m-0">{t(`danhGiaDauVao.caiDat.loai_${loai}`)}</h4>
              {dangSua === null && (
                <Button type="button" size="sm" variant="outline" onClick={() => setDangSua(loai)}>
                  <Plus size={14} className="mr-1.5" />
                  {t('danhGiaDauVao.caiDat.themLyDo')}
                </Button>
              )}
            </div>
            {dangSua === loai && <LyDoForm initial={null} loaiMacDinh={loai} onDone={() => setDangSua(null)} />}
            <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border">
              {ds.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{t('danhGiaDauVao.caiDat.chuaCoLyDo')}</li>}
              {ds.map((x) =>
                typeof dangSua === 'object' && dangSua?.id === x.id ? (
                  <li key={x.id} className="p-2">
                    <LyDoForm initial={x} loaiMacDinh={loai} onDone={() => setDangSua(null)} />
                  </li>
                ) : (
                  <li key={x.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1 text-sm">
                      {x.ten}
                      <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                        {t('danhGiaDauVao.caiDat.thuTu')} {x.thu_tu}
                      </span>
                    </div>
                    <button type="button" className={cn(iconBtn, 'text-primary')} onClick={() => setDangSua(x)} aria-label={t('common.edit')}>
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      className={cn(iconBtn, 'text-rose-500')}
                      aria-label={t('common.delete')}
                      onClick={() =>
                        confirm({
                          title: t('danhGiaDauVao.caiDat.xoaTitle'),
                          message: t('danhGiaDauVao.caiDat.xoaLyDoMessage', { ten: x.ten }),
                          variant: 'danger',
                          confirmText: t('common.delete'),
                          onConfirm: async () => {
                            await xoa.mutateAsync(x.id);
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
          </section>
        );
      })}
    </div>
  );
};

export default LyDoTab;
