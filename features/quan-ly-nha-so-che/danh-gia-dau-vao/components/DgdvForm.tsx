/**
 * Form phiếu tuần Đánh giá đầu vào: năm / tuần ISO / chi nhánh / ghi chú + bảng cột dây
 * (chích bắp → gợi ý thu hoạch +10 tuần, màu 1–2, xé đôi) + bảng lô (tổ trưởng tự điền từ danh mục).
 * Lưu: khớp cột dây và lô theo `id` (thêm / sửa / xoá) — services/danh-gia-dau-vao-db.service.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Controller, useFieldArray, useForm, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, ClipboardPen, Columns3, ListPlus, MapPinned, Plus, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_WIDE } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { cn, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { dgdvFormSchema, type DgdvFormValues } from '../core/schema';
import type { DgdvPhieuDayDu } from '../core/types';
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
    lo: theoStt(p.lo).map((l) => ({ id: l.id, id_lo: l.id_lo, id_to_truong: l.id_to_truong, ghi_chu: l.ghi_chu ?? '' })),
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
const cellInput = 'h-8 w-full rounded-md border border-border bg-background px-1.5 text-body-sm';

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

  const loCuaChiNhanh = useMemo(() => dsLo.filter((l) => l.id_chi_nhanh === String(idChiNhanh ?? '')), [dsLo, idChiNhanh]);
  const loTheoId = useMemo(() => new Map(dsLo.map((l) => [l.id, l])), [dsLo]);
  const loOptions = useMemo(() => {
    const dangChon = new Set((loWatch ?? []).map((l) => l?.id_lo).filter(Boolean) as string[]);
    const opts = loCuaChiNhanh
      .filter((l) => l.dang_dung || dangChon.has(l.id))
      .map((l) => ({ value: l.id, label: l.ten_lo, subLabel: l.ten_to_truong ?? '' }));
    // Lô đã có trong phiếu nhưng không thuộc chi nhánh đang chọn (đổi chi nhánh) vẫn hiện tên.
    for (const id of dangChon) {
      const l = loTheoId.get(id);
      if (l && !opts.some((o) => o.value === id)) opts.push({ value: id, label: `${l.ten_lo} (${l.ten_chi_nhanh ?? ''})`, subLabel: '' });
    }
    return opts;
  }, [loCuaChiNhanh, loWatch, loTheoId]);
  const nhanVienOptions = useMemo(
    () => dsNhanVien.map((e) => ({ value: String(e.id), label: e.ho_ten, subLabel: e.ma_nhan_vien })),
    [dsNhanVien]
  );

  const doiChichBap = (i: number, dau: 'tu' | 'den', v: string) => {
    const giaTri = v || null;
    setValue(`cot.${i}.chich_bap_${dau}`, giaTri, { shouldDirty: true });
    const g = goiYThuHoach(dau === 'tu' ? giaTri : null, dau === 'den' ? giaTri : null);
    setValue(`cot.${i}.thu_hoach_${dau}`, dau === 'tu' ? g.thu_hoach_tu : g.thu_hoach_den, { shouldDirty: true });
  };

  const themMoiLo = () => {
    const daCo = new Set((getValues('lo') ?? []).map((l) => l.id_lo));
    const them = loCuaChiNhanh.filter((l) => l.dang_dung && !daCo.has(l.id));
    them.forEach((l) => loArr.append({ id_lo: l.id, id_to_truong: l.id_to_truong, ghi_chu: '' }));
  };

  const onSubmit: SubmitHandler<DgdvFormValues> = (data) => luu.mutate({ id: initial?.id ?? null, data });

  const loiMang = (msg: unknown) =>
    typeof msg === 'string' ? <p className="text-caption text-rose-600 m-0 mt-0.5">{msg}</p> : null;

  return (
    <GenericDrawer
      onClose={onClose}
      isDirty={isDirty}
      title={isEdit ? t('danhGiaDauVao.form.editTitle') : t('danhGiaDauVao.form.createTitle')}
      maxWidthClass={DRAWER_WIDTH_WIDE}
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
      <form id="dgdv-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection title={t('danhGiaDauVao.form.sectionPhieu')} icon={<ClipboardPen size={14} />} variant="primary">
          <FormGrid cols={3}>
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
          </FormGrid>
          <Controller
            name="ghi_chu"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                value={field.value ?? ''}
                label={t('danhGiaDauVao.form.ghiChu')}
                rows={2}
                className="mt-3 w-full max-w-none"
              />
            )}
          />
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
            <table className="w-full text-body-sm min-w-[64rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs">
                  <th className="px-2 py-2 w-10 text-center">#</th>
                  <th className="px-2 py-2 text-left" colSpan={2}>{t('danhGiaDauVao.form.chichBap')}</th>
                  <th className="px-2 py-2 text-left" colSpan={2}>{t('danhGiaDauVao.form.thuHoach')}</th>
                  <th className="px-2 py-2 text-left min-w-[8rem]">{t('danhGiaDauVao.form.mau1')}</th>
                  <th className="px-2 py-2 text-left min-w-[8rem]">{t('danhGiaDauVao.form.mau2')}</th>
                  <th className="px-2 py-2 text-center">{t('danhGiaDauVao.form.xeDoi')}</th>
                  <th className="px-2 py-2 text-left min-w-[7rem]">{t('danhGiaDauVao.form.xemTruoc')}</th>
                  <th className="px-2 py-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {cotArr.fields.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-3 py-4 text-center text-muted-foreground">
                      {t('danhGiaDauVao.form.chuaCoCot')}
                    </td>
                  </tr>
                )}
                {cotArr.fields.map((f, i) => {
                  const c = cotWatch?.[i];
                  const loi = errors.cot?.[i];
                  const m1 = c?.id_mau_1 ? mauTheoId.get(c.id_mau_1) : undefined;
                  const m2 = c?.id_mau_2 ? mauTheoId.get(c.id_mau_2) : undefined;
                  return (
                    <tr key={f.id} className="border-b border-border/70 align-top">
                      <td className="px-2 py-1.5 text-center tabular-nums text-muted-foreground">{i + 1}</td>
                      {(['tu', 'den'] as const).map((dau) => (
                        <td key={`cb-${dau}`} className="px-1 py-1.5">
                          <input
                            type="date"
                            className={cellInput}
                            aria-label={`${t('danhGiaDauVao.form.chichBap')} ${t(`danhGiaDauVao.form.${dau}`)}`}
                            value={c?.[`chich_bap_${dau}`] ?? ''}
                            onChange={(e) => doiChichBap(i, dau, e.target.value)}
                          />
                          {loiMang(loi?.[`chich_bap_${dau}`]?.message)}
                        </td>
                      ))}
                      {(['tu', 'den'] as const).map((dau) => (
                        <td key={`th-${dau}`} className="px-1 py-1.5">
                          <Controller
                            name={`cot.${i}.thu_hoach_${dau}`}
                            control={control}
                            render={({ field }) => (
                              <input
                                type="date"
                                className={cellInput}
                                aria-label={`${t('danhGiaDauVao.form.thuHoach')} ${t(`danhGiaDauVao.form.${dau}`)}`}
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value || null)}
                              />
                            )}
                          />
                          {loiMang(loi?.[`thu_hoach_${dau}`]?.message)}
                        </td>
                      ))}
                      <td className="px-1 py-1.5">
                        <Controller
                          name={`cot.${i}.id_mau_1`}
                          control={control}
                          render={({ field }) => (
                            <select
                              className={cn(cellInput, loi?.id_mau_1 && 'border-rose-500')}
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
                        {loiMang(loi?.id_mau_1?.message)}
                      </td>
                      <td className="px-1 py-1.5">
                        <Controller
                          name={`cot.${i}.id_mau_2`}
                          control={control}
                          render={({ field }) => (
                            <select
                              className={cn(cellInput, loi?.id_mau_2 && 'border-rose-500')}
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
                        {loiMang(loi?.id_mau_2?.message)}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <Controller
                          name={`cot.${i}.xe_doi`}
                          control={control}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              className="h-4 w-4 mt-2 accent-primary"
                              checked={!!field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              aria-label={t('danhGiaDauVao.form.xeDoi')}
                            />
                          )}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <div
                          className="h-8 rounded-md border border-border px-2 flex items-center text-xs font-semibold whitespace-nowrap"
                          style={styleTieuDeCot(m1?.ma_mau ?? null, m2?.ma_mau ?? null)}
                        >
                          {[m1?.ten, m2?.ten].filter(Boolean).join(' - ')}
                          {c?.xe_doi ? ` ${t('danhGiaDauVao.luoi.xeDoi')}` : ''}
                        </div>
                      </td>
                      <td className="px-1 py-1.5">
                        <div className="flex items-center justify-end">
                          <button type="button" className={iconBtn} disabled={i === 0} onClick={() => cotArr.move(i, i - 1)} aria-label="↑">
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className={iconBtn}
                            disabled={i === cotArr.fields.length - 1}
                            onClick={() => cotArr.move(i, i + 1)}
                            aria-label="↓"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            className={cn(iconBtn, 'text-rose-500')}
                            onClick={() => cotArr.remove(i)}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isEdit && <p className="text-caption text-amber-700 dark:text-amber-400 m-0 mt-2">{t('danhGiaDauVao.form.xoaCotCanhBao')}</p>}
        </FormSection>

        <FormSection
          title={t('danhGiaDauVao.form.sectionLo')}
          icon={<MapPinned size={14} />}
          variant="primary"
          action={
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={themMoiLo} disabled={!idChiNhanh}>
                <ListPlus size={14} className="mr-1" />
                {t('danhGiaDauVao.form.themMoiLo')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => loArr.append({ id_lo: '', id_to_truong: null, ghi_chu: '' })}
              >
                <Plus size={14} className="mr-1" />
                {t('danhGiaDauVao.form.themLo')}
              </Button>
            </div>
          }
        >
          {!idChiNhanh && <p className="text-caption text-muted-foreground m-0 mb-2">{t('danhGiaDauVao.form.chonChiNhanhTruoc')}</p>}
          {idChiNhanh && loCuaChiNhanh.length === 0 && (
            <p className="text-caption text-amber-700 dark:text-amber-400 m-0 mb-2">{t('danhGiaDauVao.form.chiNhanhChuaCoLo')}</p>
          )}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-body-sm min-w-[44rem]">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-xs">
                  <th className="px-2 py-2 w-10 text-center">#</th>
                  <th className="px-2 py-2 text-left min-w-[12rem]">{t('danhGiaDauVao.form.lo')}</th>
                  <th className="px-2 py-2 text-left min-w-[12rem]">{t('danhGiaDauVao.form.toTruong')}</th>
                  <th className="px-2 py-2 text-left min-w-[12rem]">{t('danhGiaDauVao.form.ghiChuLo')}</th>
                  <th className="px-2 py-2 w-24" />
                </tr>
              </thead>
              <tbody>
                {loArr.fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">
                      {t('danhGiaDauVao.form.chuaCoLo')}
                    </td>
                  </tr>
                )}
                {loArr.fields.map((f, i) => (
                  <tr key={f.id} className="border-b border-border/70 align-top">
                    <td className="px-2 py-2 text-center tabular-nums text-muted-foreground">{i + 1}</td>
                    <td className="px-1 py-1">
                      <Controller
                        name={`lo.${i}.id_lo`}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={loOptions}
                            value={field.value ?? ''}
                            onChange={(v) => {
                              const id = v ? String(v) : '';
                              field.onChange(id);
                              const lo = loTheoId.get(id);
                              if (lo) setValue(`lo.${i}.id_to_truong`, lo.id_to_truong, { shouldDirty: true });
                            }}
                            placeholder={t('danhGiaDauVao.form.chonLo')}
                            dropdownInPortal
                            error={errors.lo?.[i]?.id_lo?.message as string | undefined}
                          />
                        )}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Controller
                        name={`lo.${i}.id_to_truong`}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={nhanVienOptions}
                            value={field.value ?? ''}
                            onChange={(v) => field.onChange(v ? String(v) : null)}
                            placeholder={t('danhGiaDauVao.form.chonToTruong')}
                            dropdownInPortal
                          />
                        )}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Controller
                        name={`lo.${i}.ghi_chu`}
                        control={control}
                        render={({ field }) => (
                          <Input {...field} value={field.value ?? ''} aria-label={t('danhGiaDauVao.form.ghiChuLo')} />
                        )}
                      />
                    </td>
                    <td className="px-1 py-1">
                      <div className="flex items-center justify-end pt-1.5">
                        <button type="button" className={iconBtn} disabled={i === 0} onClick={() => loArr.move(i, i - 1)} aria-label="↑">
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className={iconBtn}
                          disabled={i === loArr.fields.length - 1}
                          onClick={() => loArr.move(i, i + 1)}
                          aria-label="↓"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          className={cn(iconBtn, 'text-rose-500')}
                          onClick={() => loArr.remove(i)}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isEdit && <p className="text-caption text-amber-700 dark:text-amber-400 m-0 mt-2">{t('danhGiaDauVao.form.xoaLoCanhBao')}</p>}
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DgdvForm;
