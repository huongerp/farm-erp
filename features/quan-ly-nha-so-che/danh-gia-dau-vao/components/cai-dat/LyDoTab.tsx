import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useForm, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import Select from '../../../../../components/ui/Select';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { cn } from '../../../../../lib/utils';
import { dgdvLyDoFormSchema, type DgdvLyDoFormValues } from '../../core/schema';
import { LOAI_LY_DO_DGDV, type LoaiLyDoDgdv, type VarDgdvLyDo } from '../../core/types';
import { useGanNhomLyDo, useLuuLyDo, useLyDoDgdv, useNhomLoiDgdv, useXoaLyDo } from '../../hooks/use-danh-muc-dgdv';

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
    defaultValues: initial
      ? { ten: initial.ten, loai: initial.loai, thu_tu: initial.thu_tu, la_loi: initial.la_loi }
      : { ten: '', loai: loaiMacDinh, thu_tu: 0, la_loi: false },
  });
  const loaiDangChon = useWatch({ control, name: 'loai' });
  const onSubmit: SubmitHandler<DgdvLyDoFormValues> = (data) =>
    // Nhóm «Lý do huỷ (KSC)» không có cờ «Lỗi» — ép false khi submit.
    luu.mutate({ id: initial?.id ?? null, data: { ...data, la_loi: data.loai === 'loi' ? false : data.la_loi === true } });

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
      {loaiDangChon === LOAI_LY_DO_DGDV.DANH_GIA && (
        <Controller
          name="la_loi"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={!!field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
              {t('danhGiaDauVao.caiDat.laLoi')}
              <span className="text-xs text-muted-foreground">{t('danhGiaDauVao.caiDat.laLoiHint')}</span>
            </label>
          )}
        />
      )}
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

/** Giá trị ô chọn nhóm cho lý do «chưa gán». */
const CHUA_GAN = '';

/**
 * Tab «Lý do»: gợi ý chọn nhanh cho ô Đánh giá và ô Lý do lỗi (ô vẫn gõ tự do được). Cột «Nhóm lỗi» gán
 * từng lý do vào nhóm nguyên nhân (migration 094) — lưu ngay khi đổi, dùng cho báo cáo «Tỷ lệ lỗi».
 */
const LyDoTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: dsLyDo = [], isLoading } = useLyDoDgdv();
  const { data: dsNhom = [] } = useNhomLoiDgdv();
  const xoa = useXoaLyDo();
  /** Bấm checkbox «Lỗi» là lưu ngay — lưu xong hook tự làm mới danh sách + toast. */
  const luuLaLoi = useLuuLyDo();
  const ganNhom = useGanNhomLyDo();
  const [dangSua, setDangSua] = useState<VarDgdvLyDo | LoaiLyDoDgdv | null>(null);
  const [chiChuaGan, setChiChuaGan] = useState(false);
  const iconBtn = 'p-1.5 rounded-md hover:bg-muted';

  /** Nhóm đang dùng hiện trong ô chọn; nhóm đã ngừng vẫn hiện nếu lý do đang trỏ tới (giữ nguyên nhãn cũ). */
  const nhomCuaLyDo = (x: VarDgdvLyDo) => dsNhom.filter((n) => n.dang_dung || n.id === x.id_nhom_loi);
  const soChuaGan = dsLyDo.filter((x) => !x.id_nhom_loi).length;

  if (isLoading) return <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.loading')}</p>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground m-0">{t('danhGiaDauVao.caiDat.lyDoGioiThieu')}</p>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={chiChuaGan}
          onChange={(e) => setChiChuaGan(e.target.checked)}
        />
        {t('danhGiaDauVao.caiDat.chiChuaGanNhom', { n: soChuaGan })}
      </label>
      {LOAI.map((loai) => {
        const ds = dsLyDo.filter((x) => x.loai === loai && (!chiChuaGan || !x.id_nhom_loi));
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
                  <li key={x.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                    {loai === LOAI_LY_DO_DGDV.DANH_GIA && (
                      <label className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={x.la_loi}
                          disabled={luuLaLoi.isPending && luuLaLoi.variables?.id === x.id}
                          onChange={(e) =>
                            luuLaLoi.mutate({
                              id: x.id,
                              data: { ten: x.ten, loai: x.loai, thu_tu: x.thu_tu, la_loi: e.target.checked },
                            })
                          }
                        />
                        {t('danhGiaDauVao.caiDat.laLoi')}
                      </label>
                    )}
                    <div className="min-w-0 flex-1 text-sm">
                      {x.ten}
                      {loai === LOAI_LY_DO_DGDV.DANH_GIA && x.la_loi && (
                        <span className="ml-2 rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-600">
                          {t('danhGiaDauVao.caiDat.laLoiNhan')}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground tabular-nums">
                        {t('danhGiaDauVao.caiDat.thuTu')} {x.thu_tu}
                      </span>
                    </div>
                    <select
                      className="h-8 max-w-[10rem] shrink-0 rounded-lg border border-border bg-background px-2 text-xs"
                      value={x.id_nhom_loi ?? CHUA_GAN}
                      aria-label={t('danhGiaDauVao.caiDat.nhomLoi')}
                      disabled={ganNhom.isPending}
                      onChange={(e) => ganNhom.mutate({ id: x.id, idNhom: e.target.value === CHUA_GAN ? null : e.target.value })}
                    >
                      <option value={CHUA_GAN}>{t('danhGiaDauVao.caiDat.chuaGanNhom')}</option>
                      {nhomCuaLyDo(x).map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.ten}
                        </option>
                      ))}
                    </select>
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
