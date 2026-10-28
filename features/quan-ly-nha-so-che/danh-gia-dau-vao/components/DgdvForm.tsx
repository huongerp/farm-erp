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
import { ArrowDown, ArrowUp, ClipboardPen, Columns3, ListPlus, MapPinned, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_WIDE } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
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

  const cotColumns: SubTableColumn[] = [
    { id: 'xem', label: t('danhGiaDauVao.form.xemTruoc'), width: 140, minWidth: 110, sticky: true, mobile: 'title' },
    { id: 'chich_bap', label: t('danhGiaDauVao.form.chichBap'), width: 278, minWidth: 250, mobile: 'full' },
    { id: 'thu_hoach', label: t('danhGiaDauVao.form.thuHoach'), width: 278, minWidth: 250, mobile: 'full' },
    { id: 'mau_1', label: t('danhGiaDauVao.form.mau1'), width: 124, minWidth: 100 },
    { id: 'mau_2', label: t('danhGiaDauVao.form.mau2'), width: 124, minWidth: 100 },
    { id: 'xe_doi', label: t('danhGiaDauVao.form.xeDoi'), width: 72, minWidth: 64, align: 'center' },
  ];

  const oNgay = (i: number, loai: 'chich_bap' | 'thu_hoach', dau: 'tu' | 'den') => {
    const loi = errors.cot?.[i];
    const msg = dau === 'den' ? loi?.[`${loai}_den`]?.message : undefined;
    const aria = `${t(`danhGiaDauVao.form.${loai === 'chich_bap' ? 'chichBap' : 'thuHoach'}`)} ${t(`danhGiaDauVao.form.${dau}`)}`;
    if (loai === 'chich_bap') {
      return (
        <input
          type="date"
          className={cn(cellInput, msg && cellLoi)}
          title={msg}
          aria-label={aria}
          value={cotWatch?.[i]?.[`chich_bap_${dau}`] ?? ''}
          onChange={(e) => doiChichBap(i, dau, e.target.value)}
        />
      );
    }
    return (
      <Controller
        name={`cot.${i}.thu_hoach_${dau}`}
        control={control}
        render={({ field }) => (
          <input
            type="date"
            className={cn(cellInput, msg && cellLoi)}
            title={msg}
            aria-label={aria}
            value={field.value ?? ''}
            onChange={(e) => field.onChange(e.target.value || null)}
          />
        )}
      />
    );
  };

  const oMau = (i: number, so: 1 | 2) => {
    const loi = errors.cot?.[i]?.[`id_mau_${so}`];
    return (
      <Controller
        name={`cot.${i}.id_mau_${so}`}
        control={control}
        render={({ field }) => (
          <select
            className={cn(cellInput, loi && cellLoi)}
            title={loi?.message}
            value={field.value ?? ''}
            onChange={(e) => field.onChange(so === 1 ? e.target.value : e.target.value || null)}
            aria-label={t(`danhGiaDauVao.form.mau${so}`)}
          >
            <option value="">{so === 1 ? t('danhGiaDauVao.form.chonMau') : t('danhGiaDauVao.form.khongCoMau2')}</option>
            {mauOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      />
    );
  };

  const renderCot = (colId: string, i: number) => {
    const c = cotWatch?.[i];
    switch (colId) {
      case 'xem': {
        const m1 = c?.id_mau_1 ? mauTheoId.get(c.id_mau_1) : undefined;
        const m2 = c?.id_mau_2 ? mauTheoId.get(c.id_mau_2) : undefined;
        return (
          <div
            className="h-9 rounded-lg border border-border px-2 flex items-center text-xs font-semibold whitespace-nowrap overflow-hidden"
            style={styleTieuDeCot(m1?.ma_mau ?? null, m2?.ma_mau ?? null)}
          >
            {[m1?.ten, m2?.ten].filter(Boolean).join(' - ') || <span className="text-muted-foreground font-normal">—</span>}
            {c?.xe_doi ? ` ${t('danhGiaDauVao.luoi.xeDoi')}` : ''}
          </div>
        );
      }
      case 'chich_bap':
      case 'thu_hoach':
        return (
          <div className="flex items-center gap-1">
            {oNgay(i, colId, 'tu')}
            <span className="text-muted-foreground">–</span>
            {oNgay(i, colId, 'den')}
          </div>
        );
      case 'mau_1':
        return oMau(i, 1);
      case 'mau_2':
        return oMau(i, 2);
      case 'xe_doi':
        return (
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
        );
      default:
        return null;
    }
  };

  const loColumns: SubTableColumn[] = [
    { id: 'ten_lo', label: t('danhGiaDauVao.form.lo'), width: 240, minWidth: 180, sticky: true, mobile: 'full' },
    { id: 'to_truong', label: t('danhGiaDauVao.form.toTruong'), width: 240, minWidth: 180, mobile: 'full' },
    { id: 'ghi_chu', label: t('danhGiaDauVao.form.ghiChuLo'), width: 320, minWidth: 160, mobile: 'full' },
  ];

  const renderLo = (colId: string, i: number) => {
    switch (colId) {
      case 'ten_lo': {
        const tenLo = loWatch?.[i]?.ten_lo ?? '';
        const loMoi = !!tenLo.trim() && !loTheoTen.has(khoaTen(tenLo));
        const loiLo = errors.lo?.[i]?.ten_lo?.message as string | undefined;
        return (
          <div>
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
          </div>
        );
      }
      case 'to_truong':
        return (
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
        );
      case 'ghi_chu':
        return (
          <Controller
            name={`lo.${i}.ghi_chu`}
            control={control}
            render={({ field }) => (
              <input {...field} className={cellInput} value={field.value ?? ''} aria-label={t('danhGiaDauVao.form.ghiChuLo')} />
            )}
          />
        );
      default:
        return null;
    }
  };

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

        <GenericSubTableSection
          title={t('danhGiaDauVao.form.sectionCot')}
          icon={<Columns3 size={14} className="text-primary" />}
          count={cotArr.fields.length}
          addLabel={t('danhGiaDauVao.form.themCot')}
          onAdd={() => cotArr.append({ ...COT_MOI })}
          contentMode="raw"
          emptyTitle={t('danhGiaDauVao.form.chuaCoCot')}
          emptyDescription={t('danhGiaDauVao.form.cotHint')}
        >
          {cotArr.fields.length > 0 && (
            <div className="space-y-2">
              <p className="text-caption text-muted-foreground m-0">{t('danhGiaDauVao.form.cotHint')}</p>
              <SubTable
                tableKey="danh-gia-dau-vao.form-cot"
                columns={cotColumns}
                rows={cotArr.fields}
                keyExtractor={(f) => f.id}
                renderCell={(colId, _f, i) => renderCot(colId, i)}
                renderActions={(_f, i) => nutDoiCho(cotArr, i)}
                actionsWidth={112}
              />
              {cotArr.fields.some((_, i) => errors.cot?.[i]) && (
                <p className="text-caption text-destructive m-0">{t('danhGiaDauVao.form.cotCoLoi')}</p>
              )}
              {isEdit && <p className="text-caption text-amber-700 dark:text-amber-400 m-0">{t('danhGiaDauVao.form.xoaCotCanhBao')}</p>}
            </div>
          )}
        </GenericSubTableSection>

        <GenericSubTableSection
          title={t('danhGiaDauVao.form.sectionLo')}
          icon={<MapPinned size={14} className="text-primary" />}
          count={loArr.fields.length}
          addLabel={t('danhGiaDauVao.form.themLo')}
          onAdd={() => loArr.append({ ten_lo: '', to_truong: null, ghi_chu: '' })}
          headerActions={
            loCuaChiNhanh.length > 0 ? (
              <Button type="button" size="sm" variant="outline" onClick={themMoiLo} className="min-h-[44px] h-8 sm:h-8 px-3 shrink-0">
                <ListPlus size={14} className="mr-1.5" />
                {t('danhGiaDauVao.form.themMoiLo')}
              </Button>
            ) : undefined
          }
          contentMode="raw"
          emptyTitle={t('danhGiaDauVao.form.chuaCoLo')}
          emptyDescription={t('danhGiaDauVao.form.loHint')}
        >
          {loArr.fields.length > 0 && (
            <div className="space-y-2">
              <p className="text-caption text-muted-foreground m-0">{t('danhGiaDauVao.form.loHint')}</p>
              <SubTable
                tableKey="danh-gia-dau-vao.form-lo"
                columns={loColumns}
                rows={loArr.fields}
                keyExtractor={(f) => f.id}
                renderCell={(colId, _f, i) => renderLo(colId, i)}
                renderActions={(_f, i) => nutDoiCho(loArr, i)}
                actionsWidth={112}
              />
              {isEdit && <p className="text-caption text-amber-700 dark:text-amber-400 m-0">{t('danhGiaDauVao.form.xoaLoCanhBao')}</p>}
            </div>
          )}
        </GenericSubTableSection>
      </form>
    </GenericDrawer>
  );
};

export default DgdvForm;
