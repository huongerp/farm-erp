/**
 * Form phiếu tuần Đánh giá đầu vào: năm / tuần ISO / chi nhánh / ghi chú + bảng cột dây
 * (chích bắp → gợi ý thu hoạch +10 tuần, màu 1–2, xé đôi) + bảng lô.
 * Lô và tổ trưởng là chữ: chọn từ gợi ý hoặc gõ mới — lô chưa có trong danh mục của chi nhánh được tạo
 * lúc lưu (services/danh-gia-dau-vao-db.service `ganIdLo`). Cột dây và lô khớp theo `id` (thêm / sửa / xoá).
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFieldArray, useForm, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, ClipboardPen, Columns3, ListPlus, MapPinned, Plus, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_WIDE } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { cn, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { dgdvFormSchema, type DgdvFormValues } from '../core/schema';
import type { DgdvPhieuDayDu } from '../core/types';
import { khoaTen, tenKhongTrung } from '../core/chuan-hoa-ten';
import { congNgay, goiYThuHoach, ngayDauTuanIso, soTuanIsoTrongNam, tuanIsoCuaNgay } from '../core/tuan';
import { useLuuDgdv } from '../hooks/use-danh-gia-dau-vao';
import { useLoThuHoach, useMauDay, useNhanVienRef } from '../hooks/use-danh-muc-dgdv';
import { styleTieuDeCot } from '../utils/mau-day';

interface Props {
  branches: Branch[];
  /** Phiếu đang sửa (đầy đủ cột + lô); null = tạo mới. */
  initial?: DgdvPhieuDayDu | null;
  /** Giá trị điền sẵn khi tạo mới (sao chép tuần, tạo từ Bảng đánh giá). */
  giaTriMacDinh?: Partial<DgdvFormValues> | null;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

function phieuSangForm(p: DgdvPhieuDayDu): DgdvFormValues {
  const theoStt = <T extends { stt: number; id: string }>(ds: T[]) =>
    [...ds].sort((a, b) => a.stt - b.stt || a.id.localeCompare(b.id));
  return {
    nam: p.nam,
    tuan: p.tuan,
    id_chi_nhanh: p.id_chi_nhanh,
    ghi_chu: p.ghi_chu ?? '',
    cot: theoStt(p.cot).map((c) => ({
      id: c.id,
      chich_bap_tu: c.chich_bap_tu,
      chich_bap_den: c.chich_bap_den,
      thu_hoach_tu: c.thu_hoach_tu,
      thu_hoach_den: c.thu_hoach_den,
      id_mau_1: c.id_mau_1,
      id_mau_2: c.id_mau_2,
      xe_doi: c.xe_doi,
    })),
    lo: theoStt(p.lo).map((l) => ({ id: l.id, ten_lo: l.ten_lo ?? '', to_truong: l.to_truong, ghi_chu: l.ghi_chu ?? '' })),
  };
}

const COT_MOI: DgdvFormValues['cot'][number] = {
  chich_bap_tu: null,
  chich_bap_den: null,
  thu_hoach_tu: null,
  thu_hoach_den: null,
  id_mau_1: '',
  id_mau_2: null,
  xe_doi: false,
};

const iconBtn = 'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent';
/** Ô nhập trong bảng: cùng chiều cao h-9 với Combobox (`triggerClassName`). */
const cellInput =
  'h-9 w-full min-w-0 rounded-lg border border-border bg-background px-2 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40';
const cellLoi = 'border-destructive';
const th = 'px-2 py-2 text-left font-medium text-muted-foreground';

const DgdvForm: React.FC<Props> = ({ branches, initial, giaTriMacDinh, onClose, onSaved }) => {
  const { t } = useTranslation();
  const isEdit = !!initial;
  const luu = useLuuDgdv((id) => {
    onSaved?.(id);
    onClose();
  });
  const { data: dsMau = [] } = useMauDay();
  const { data: dsLo = [] } = useLoThuHoach();
  const { data: dsNhanVien = [] } = useNhanVienRef();

  const defaultValues = useMemo<DgdvFormValues>(() => {
    if (initial) return phieuSangForm(initial);
    const tuanNay = tuanIsoCuaNgay(getTodayISO());
    return {
      nam: tuanNay.nam,
      tuan: tuanNay.tuan,
      id_chi_nhanh: '',
      ghi_chu: '',
      cot: [],
      lo: [],
      ...giaTriMacDinh,
    };
  }, [initial, giaTriMacDinh]);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DgdvFormValues>({
    resolver: zodResolver(dgdvFormSchema) as Resolver<DgdvFormValues>,
    defaultValues,
  });
  const cotArr = useFieldArray({ control, name: 'cot' });
  const loArr = useFieldArray({ control, name: 'lo' });

  const nam = Number(useWatch({ control, name: 'nam' })) || defaultValues.nam;
  const idChiNhanh = useWatch({ control, name: 'id_chi_nhanh' });
  const cotWatch = useWatch({ control, name: 'cot' });
  const loWatch = useWatch({ control, name: 'lo' });

  const branchOptions = useMemo(() => {
    const opts = branches.map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` }));
    if (initial && !opts.some((o) => o.value === initial.id_chi_nhanh)) {
      opts.unshift({ value: initial.id_chi_nhanh, label: initial.ten_chi_nhanh ?? `#${initial.id_chi_nhanh}` });
    }
    return opts;
  }, [branches, initial]);

  const tuanOptions = useMemo(() => {
    const n = nam >= 2000 && nam <= 2100 ? soTuanIsoTrongNam(nam) : 52;
    return Array.from({ length: n }, (_, i) => {
      const dau = ngayDauTuanIso(nam, i + 1);
      return {
        value: String(i + 1),
        label: t('danhGiaDauVao.form.tuanOption', {
          tuan: i + 1,
          tu: formatYmdToDisplay(dau).slice(0, 5),
          den: formatYmdToDisplay(congNgay(dau, 6)).slice(0, 5),
        }),
      };
    });
  }, [nam, t]);

  /** Màu đang dùng + màu đã ngừng nhưng phiếu còn trỏ tới. */
  const mauOptions = useMemo(() => {
    const dangChon = new Set((cotWatch ?? []).flatMap((c) => [c?.id_mau_1, c?.id_mau_2]).filter(Boolean) as string[]);
    return dsMau
      .filter((m) => m.dang_dung || dangChon.has(m.id))
      .map((m) => ({ value: m.id, label: m.dang_dung ? m.ten : `${m.ten} (${t('danhGiaDauVao.form.ngungDung')})` }));
  }, [dsMau, cotWatch, t]);
  const mauTheoId = useMemo(() => new Map(dsMau.map((m) => [m.id, m])), [dsMau]);

  const loCuaChiNhanh = useMemo(
    () => dsLo.filter((l) => l.id_chi_nhanh === String(idChiNhanh ?? '') && l.dang_dung),
    [dsLo, idChiNhanh]
  );
  const loTheoTen = useMemo(() => new Map(loCuaChiNhanh.map((l) => [khoaTen(l.ten_lo), l])), [loCuaChiNhanh]);
  /** Gợi ý lô = lô đang dùng của chi nhánh (value là tên — lưu theo tên, tên mới thành lô mới). */
  const loOptions = useMemo(
    () => loCuaChiNhanh.map((l) => ({ value: l.ten_lo, label: l.ten_lo, subLabel: l.to_truong ?? '' })),
    [loCuaChiNhanh]
  );
  /** Gợi ý tổ trưởng: tên đã gõ ở danh mục lô / phiếu này + họ tên nhân viên. */
  const toTruongOptions = useMemo(
    () =>
      tenKhongTrung([
        ...dsLo.map((l) => l.to_truong),
        ...(loWatch ?? []).map((l) => l?.to_truong),
        ...dsNhanVien.map((e) => e.ho_ten),
      ]).map((ten) => ({ value: ten, label: ten })),
    [dsLo, loWatch, dsNhanVien]
  );

  const doiChichBap = (i: number, dau: 'tu' | 'den', v: string) => {
    const giaTri = v || null;
    setValue(`cot.${i}.chich_bap_${dau}`, giaTri, { shouldDirty: true });
    const g = goiYThuHoach(dau === 'tu' ? giaTri : null, dau === 'den' ? giaTri : null);
    setValue(`cot.${i}.thu_hoach_${dau}`, dau === 'tu' ? g.thu_hoach_tu : g.thu_hoach_den, { shouldDirty: true });
  };

  const themMoiLo = () => {
    const daCo = new Set((getValues('lo') ?? []).map((l) => khoaTen(l.ten_lo)));
    loCuaChiNhanh
      .filter((l) => !daCo.has(khoaTen(l.ten_lo)))
      .forEach((l) => loArr.append({ ten_lo: l.ten_lo, to_truong: l.to_truong, ghi_chu: '' }));
  };

  const onSubmit: SubmitHandler<DgdvFormValues> = (data) => luu.mutate({ id: initial?.id ?? null, data });

  const nutDoiCho = (arr: typeof cotArr | typeof loArr, i: number) => (
    <div className="flex items-center justify-end">
      <button type="button" className={iconBtn} disabled={i === 0} onClick={() => arr.move(i, i - 1)} aria-label={t('danhGiaDauVao.form.lenTren')}>
        <ArrowUp size={14} />
      </button>
      <button
        type="button"
        className={iconBtn}
        disabled={i === arr.fields.length - 1}
        onClick={() => arr.move(i, i + 1)}
        aria-label={t('danhGiaDauVao.form.xuongDuoi')}
      >
        <ArrowDown size={14} />
      </button>
      <button type="button" className={cn(iconBtn, 'text-rose-500')} onClick={() => arr.remove(i)} aria-label={t('common.delete')}>
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <GenericDrawer
      onClose={onClose}
      isDirty={isDirty}
      title={isEdit ? t('danhGiaDauVao.form.editTitle') : t('danhGiaDauVao.form.createTitle')}
      maxWidthClass={DRAWER_WIDTH_WIDE}
      fullWidthContent
      icon={<ClipboardPen size={18} />}
      footer={
        <FormDrawerFooter
          onCancel={onClose}
          formId="dgdv-form"
          isLoading={isSubmitting || luu.isPending}
          saveLabel={t('common.save')}
          createLabel={t('common.create')}
          cancelLabel={t('common.cancel')}
          isEdit={isEdit}
        />
      }
    >
      <form id="dgdv-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormSection title={t('danhGiaDauVao.form.sectionPhieu')} icon={<ClipboardPen size={14} />} variant="primary">
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <Controller
                name="nam"
                control={control}
                render={({ field }) => (
                  <Input
                    label={t('danhGiaDauVao.form.nam')}
                    type="number"
                    inputMode="numeric"
                    min={2000}
                    max={2100}
                    required
                    value={field.value == null ? '' : String(field.value)}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.nam?.message}
                  />
                )}
              />
            </div>
            <div className="sm:col-span-3">
              <Controller
                name="tuan"
                control={control}
                render={({ field }) => (
                  <Select
                    label={t('danhGiaDauVao.form.tuan')}
                    required
                    value={String(field.value ?? '')}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    options={tuanOptions}
                    error={errors.tuan?.message}
                  />
                )}
              />
            </div>
            <div className="col-span-2 sm:col-span-3">
              <Controller
                name="id_chi_nhanh"
                control={control}
                render={({ field }) => (
                  <Combobox
                    label={t('danhGiaDauVao.form.branch')}
                    options={branchOptions}
                    value={field.value ?? ''}
                    onChange={(v) => field.onChange(v ? String(v) : '')}
                    placeholder={t('danhGiaDauVao.form.branchPlaceholder')}
                    required
                    error={errors.id_chi_nhanh?.message as string | undefined}
                  />
                )}
              />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <Controller
                name="ghi_chu"
                control={control}
                render={({ field }) => <Input {...field} value={field.value ?? ''} label={t('danhGiaDauVao.form.ghiChu')} />}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('danhGiaDauVao.form.sectionCot')}
          icon={<Columns3 size={14} />}
          variant="primary"
          action={
            <Button type="button" size="sm" variant="outline" onClick={() => cotArr.append({ ...COT_MOI })}>
              <Plus size={14} className="mr-1" />
              {t('danhGiaDauVao.form.themCot')}
            </Button>
          }
        >
          <p className="text-caption text-muted-foreground m-0 mb-2">{t('danhGiaDauVao.form.cotHint')}</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs">
                  <th className={cn(th, 'w-8 text-center')}>#</th>
                  <th className={cn(th, 'min-w-[9rem]')}>{t('danhGiaDauVao.form.xemTruoc')}</th>
                  <th className={th}>{t('danhGiaDauVao.form.chichBap')}</th>
                  <th className={th}>{t('danhGiaDauVao.form.thuHoach')}</th>
                  <th className={cn(th, 'min-w-[8rem]')}>{t('danhGiaDauVao.form.mau1')}</th>
                  <th className={cn(th, 'min-w-[8rem]')}>{t('danhGiaDauVao.form.mau2')}</th>
                  <th className={cn(th, 'text-center')}>{t('danhGiaDauVao.form.xeDoi')}</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {cotArr.fields.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-5 text-center text-muted-foreground">
                      {t('danhGiaDauVao.form.chuaCoCot')}
                    </td>
                  </tr>
                )}
                {cotArr.fields.map((f, i) => {
                  const c = cotWatch?.[i];
                  const loi = errors.cot?.[i];
                  const m1 = c?.id_mau_1 ? mauTheoId.get(c.id_mau_1) : undefined;
                  const m2 = c?.id_mau_2 ? mauTheoId.get(c.id_mau_2) : undefined;
                  const khoangNgay = (loai: 'chich_bap' | 'thu_hoach') => (
                    <div className="flex items-center gap-1">
                      {(['tu', 'den'] as const).map((dau, k) => (
                        <React.Fragment key={dau}>
                          {k === 1 && <span className="text-muted-foreground">–</span>}
                          {loai === 'chich_bap' ? (
                            <input
                              type="date"
                              className={cn(cellInput, 'w-[8.75rem]', loi?.chich_bap_den && dau === 'den' && cellLoi)}
                              title={dau === 'den' ? loi?.chich_bap_den?.message : undefined}
                              aria-label={`${t('danhGiaDauVao.form.chichBap')} ${t(`danhGiaDauVao.form.${dau}`)}`}
                              value={c?.[`chich_bap_${dau}`] ?? ''}
                              onChange={(e) => doiChichBap(i, dau, e.target.value)}
                            />
                          ) : (
                            <Controller
                              name={`cot.${i}.thu_hoach_${dau}`}
                              control={control}
                              render={({ field }) => (
                                <input
                                  type="date"
                                  className={cn(cellInput, 'w-[8.75rem]', loi?.thu_hoach_den && dau === 'den' && cellLoi)}
                                  title={dau === 'den' ? loi?.thu_hoach_den?.message : undefined}
                                  aria-label={`${t('danhGiaDauVao.form.thuHoach')} ${t(`danhGiaDauVao.form.${dau}`)}`}
                                  value={field.value ?? ''}
                                  onChange={(e) => field.onChange(e.target.value || null)}
                                />
                              )}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  );
                  return (
                    <tr key={f.id} className="border-b border-border/70 last:border-b-0">
                      <td className="px-2 py-1.5 text-center tabular-nums text-muted-foreground">{i + 1}</td>
                      <td className="px-1 py-1.5">
                        <div
                          className="h-9 rounded-lg border border-border px-2 flex items-center text-xs font-semibold whitespace-nowrap"
                          style={styleTieuDeCot(m1?.ma_mau ?? null, m2?.ma_mau ?? null)}
                        >
                          {[m1?.ten, m2?.ten].filter(Boolean).join(' - ') || <span className="text-muted-foreground font-normal">—</span>}
                          {c?.xe_doi ? ` ${t('danhGiaDauVao.luoi.xeDoi')}` : ''}
                        </div>
                      </td>
                      <td className="px-1 py-1.5">{khoangNgay('chich_bap')}</td>
                      <td className="px-1 py-1.5">{khoangNgay('thu_hoach')}</td>
                      <td className="px-1 py-1.5">
                        <Controller
                          name={`cot.${i}.id_mau_1`}
                          control={control}
                          render={({ field }) => (
                            <select
                              className={cn(cellInput, loi?.id_mau_1 && cellLoi)}
                              title={loi?.id_mau_1?.message}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              aria-label={t('danhGiaDauVao.form.mau1')}
                            >
                              <option value="">{t('danhGiaDauVao.form.chonMau')}</option>
                              {mauOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <Controller
                          name={`cot.${i}.id_mau_2`}
                          control={control}
                          render={({ field }) => (
                            <select
                              className={cn(cellInput, loi?.id_mau_2 && cellLoi)}
                              title={loi?.id_mau_2?.message}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              aria-label={t('danhGiaDauVao.form.mau2')}
                            >
                              <option value="">{t('danhGiaDauVao.form.khongCoMau2')}</option>
                              {mauOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <Controller
                          name={`cot.${i}.xe_doi`}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              className="h-4 w-4 align-middle accent-primary"
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              aria-label={t('danhGiaDauVao.form.xeDoi')}
                            />
                          )}
                        />
                      </td>
                      <td className="px-1 py-1.5">{nutDoiCho(cotArr, i)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {cotArr.fields.some((_, i) => errors.cot?.[i]) && (
            <p className="text-caption text-destructive m-0 mt-1.5">{t('danhGiaDauVao.form.cotCoLoi')}</p>
          )}
          {isEdit && <p className="text-caption text-amber-700 dark:text-amber-400 m-0 mt-1.5">{t('danhGiaDauVao.form.xoaCotCanhBao')}</p>}
        </FormSection>

        <FormSection
          title={t('danhGiaDauVao.form.sectionLo')}
          icon={<MapPinned size={14} />}
          variant="primary"
          action={
            <div className="flex gap-2">
              {loCuaChiNhanh.length > 0 && (
                <Button type="button" size="sm" variant="ghost" onClick={themMoiLo}>
                  <ListPlus size={14} className="mr-1" />
                  {t('danhGiaDauVao.form.themMoiLo')}
                </Button>
              )}
              <Button type="button" size="sm" variant="outline" onClick={() => loArr.append({ ten_lo: '', to_truong: null, ghi_chu: '' })}>
                <Plus size={14} className="mr-1" />
                {t('danhGiaDauVao.form.themLo')}
              </Button>
            </div>
          }
        >
          <p className="text-caption text-muted-foreground m-0 mb-2">{t('danhGiaDauVao.form.loHint')}</p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs">
                  <th className={cn(th, 'w-8 text-center')}>#</th>
                  <th className={cn(th, 'min-w-[12rem] w-[28%]')}>{t('danhGiaDauVao.form.lo')}</th>
                  <th className={cn(th, 'min-w-[12rem] w-[28%]')}>{t('danhGiaDauVao.form.toTruong')}</th>
                  <th className={cn(th, 'min-w-[12rem]')}>{t('danhGiaDauVao.form.ghiChuLo')}</th>
                  <th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {loArr.fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-5 text-center text-muted-foreground">
                      {t('danhGiaDauVao.form.chuaCoLo')}
                    </td>
                  </tr>
                )}
                {loArr.fields.map((f, i) => {
                  const tenLo = loWatch?.[i]?.ten_lo ?? '';
                  const loMoi = !!tenLo.trim() && !loTheoTen.has(khoaTen(tenLo));
                  const loiLo = errors.lo?.[i]?.ten_lo?.message as string | undefined;
                  return (
                    <tr key={f.id} className="border-b border-border/70 last:border-b-0 align-top">
                      <td className="px-2 py-1.5 pt-3.5 text-center tabular-nums text-muted-foreground">{i + 1}</td>
                      <td className="px-1 py-1.5">
                        <Controller
                          name={`lo.${i}.ten_lo`}
                          control={control}
                          render={({ field }) => (
                            <Combobox
                              options={loOptions}
                              value={field.value ?? ''}
                              onChange={(v) => {
                                const ten = v ? String(v).trim() : '';
                                // Gõ trùng tên lô có sẵn (khác hoa thường) → dùng đúng tên trong danh mục + tổ trưởng của lô.
                                const lo = loTheoTen.get(khoaTen(ten));
                                field.onChange(lo?.ten_lo ?? ten);
                                if (lo && !getValues(`lo.${i}.to_truong`)) {
                                  setValue(`lo.${i}.to_truong`, lo.to_truong, { shouldDirty: true });
                                }
                              }}
                              placeholder={t('danhGiaDauVao.form.chonLo')}
                              creatable
                              creatableLabel={t('danhGiaDauVao.form.taoLo')}
                              dropdownInPortal
                              triggerClassName={cn('h-9', loiLo && 'border-destructive')}
                            />
                          )}
                        />
                        {loiLo ? (
                          <p className="text-caption text-destructive m-0 mt-0.5">{loiLo}</p>
                        ) : (
                          loMoi && <p className="text-caption text-primary m-0 mt-0.5">{t('danhGiaDauVao.form.loMoiSeTao')}</p>
                        )}
                      </td>
                      <td className="px-1 py-1.5">
                        <Controller
                          name={`lo.${i}.to_truong`}
                          control={control}
                          render={({ field }) => (
                            <Combobox
                              options={toTruongOptions}
                              value={field.value ?? ''}
                              onChange={(v) => field.onChange(v ? String(v).trim() : null)}
                              placeholder={t('danhGiaDauVao.form.chonToTruong')}
                              creatable
                              creatableLabel={t('danhGiaDauVao.form.dungTen')}
                              dropdownInPortal
                              triggerClassName="h-9"
                            />
                          )}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <Controller
                          name={`lo.${i}.ghi_chu`}
                          control={control}
                          render={({ field }) => (
                            <input {...field} className={cellInput} value={field.value ?? ''} aria-label={t('danhGiaDauVao.form.ghiChuLo')} />
                          )}
                        />
                      </td>
                      <td className="px-1 py-1.5 pt-2">{nutDoiCho(loArr, i)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isEdit && <p className="text-caption text-amber-700 dark:text-amber-400 m-0 mt-1.5">{t('danhGiaDauVao.form.xoaLoCanhBao')}</p>}
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DgdvForm;
