/**
 * Form phiếu chuyến Đánh giá đầu vào: ngày (mặc định hôm nay) / chi nhánh / chuyến (gợi ý chuyến kế tiếp)
 * / tuần farm (chỉ đọc, tính từ ngày) / ghi chú + bảng cột dây (màu 1–2, xé đôi, tuần thu hoạch farm —
 * chích bắp = −9 tuần) + bảng lô. «Chép dây & lô từ chuyến trước» lấy khung của phiếu gần nhất cùng chi nhánh.
 * Lô và tổ trưởng là chữ: chọn từ gợi ý hoặc gõ mới — lô chưa có trong danh mục của chi nhánh được tạo
 * lúc lưu (services/danh-gia-dau-vao-db.service `ganIdLo`). Cột dây và lô khớp theo `id` (thêm / sửa / xoá).
 */
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Controller, useFieldArray, useForm, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, ClipboardPen, Columns3, CopyPlus, ListPlus, MapPinned, Trash2 } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_WIDE } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import GenericSubTableSection from '../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../components/shared/sub-table/SubTable';
import { cn, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { dgdvFormSchema, type DgdvFormValues } from '../core/schema';
import type { DgdvPhieuDayDu, TuanFarm } from '../core/types';
import { khoaTen, tenKhongTrung } from '../core/chuan-hoa-ten';
import { dungPhieuSaoChep } from '../core/bang-tinh';
import { cacTuanQuanh, docKhoaTuanFarm, khoaTuanFarm, nhanTuanFarm, soSanhTuan, tuanChichBapTuThuHoach, tuanFarmCuaNgay } from '../core/tuan';
import { useDgdvChuyenKeTiep, useLayPhieuChuyenTruoc, useLuuDgdv } from '../hooks/use-danh-gia-dau-vao';
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
    ngay: p.ngay,
    chuyen: p.chuyen,
    id_chi_nhanh: p.id_chi_nhanh,
    ghi_chu: p.ghi_chu ?? '',
    cot: theoStt(p.cot).map((c) => ({
      id: c.id,
      th_nam: c.th_nam,
      th_tuan: c.th_tuan,
      id_mau_1: c.id_mau_1,
      id_mau_2: c.id_mau_2,
      xe_doi: c.xe_doi,
    })),
    lo: theoStt(p.lo).map((l) => ({ id: l.id, ten_lo: l.ten_lo ?? '', to_truong: l.to_truong, ghi_chu: l.ghi_chu ?? '' })),
  };
}

/** Dây mới: tuần thu hoạch mặc định = tuần farm của ngày phiếu (sửa được). */
const cotMoi = (th: TuanFarm): DgdvFormValues['cot'][number] => ({
  th_nam: th.nam,
  th_tuan: th.tuan,
  id_mau_1: '',
  id_mau_2: null,
  xe_doi: false,
});

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Select tuần thu hoạch: tuần của ngày phiếu − 4 … + 2. */
const TUAN_TH_TRUOC = 4;
const TUAN_TH_SAU = 2;

const iconBtn = 'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent';
/** Ô nhập trong bảng: cùng chiều cao h-9 với Combobox (`triggerClassName`). */
const cellInput =
  'h-9 w-full min-w-0 rounded-lg border border-border bg-background px-2 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/40';
const cellLoi = 'border-destructive';

const DgdvForm: React.FC<Props> = ({ branches, initial, giaTriMacDinh, onClose, onSaved }) => {
  const { t } = useTranslation();
  const isEdit = !!initial;
  const confirm = useConfirmStore((s) => s.confirm);
  const layChuyenTruoc = useLayPhieuChuyenTruoc();
  const luu = useLuuDgdv((id) => {
    onSaved?.(id);
    onClose();
  });
  const { data: dsMau = [] } = useMauDay();
  const { data: dsLo = [] } = useLoThuHoach();
  const { data: dsNhanVien = [] } = useNhanVienRef();

  const defaultValues = useMemo<DgdvFormValues>(() => {
    if (initial) return phieuSangForm(initial);
    return {
      ngay: getTodayISO(),
      chuyen: 1,
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
    getFieldState,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<DgdvFormValues>({
    resolver: zodResolver(dgdvFormSchema) as Resolver<DgdvFormValues>,
    defaultValues,
  });
  const cotArr = useFieldArray({ control, name: 'cot' });
  const loArr = useFieldArray({ control, name: 'lo' });

  const ngay = useWatch({ control, name: 'ngay' });
  const idChiNhanh = useWatch({ control, name: 'id_chi_nhanh' });
  const tuanCuaNgay = useMemo(
    () => tuanFarmCuaNgay(YMD_RE.test(ngay ?? '') ? ngay : getTodayISO()),
    [ngay]
  );

  // Tạo mới: gợi ý chuyến kế tiếp của (ngày, chi nhánh) — không đè số người dùng đã gõ.
  const chuyenKeTiep = useDgdvChuyenKeTiep(YMD_RE.test(ngay ?? '') ? ngay : null, idChiNhanh || null, !isEdit);
  useEffect(() => {
    if (isEdit || chuyenKeTiep.data == null || getFieldState('chuyen').isDirty) return;
    setValue('chuyen', chuyenKeTiep.data);
  }, [isEdit, chuyenKeTiep.data, getFieldState, setValue]);
  const cotWatch = useWatch({ control, name: 'cot' });
  const loWatch = useWatch({ control, name: 'lo' });

  const branchOptions = useMemo(() => {
    const opts = branches.map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` }));
    if (initial && !opts.some((o) => o.value === initial.id_chi_nhanh)) {
      opts.unshift({ value: initial.id_chi_nhanh, label: initial.ten_chi_nhanh ?? `#${initial.id_chi_nhanh}` });
    }
    return opts;
  }, [branches, initial]);

  /** Tuần thu hoạch chọn được: tuần của ngày phiếu −4 … +2 (nhãn kèm khoảng ngày). */
  const dsTuanTh = useMemo(() => cacTuanQuanh(tuanCuaNgay, TUAN_TH_TRUOC, TUAN_TH_SAU), [tuanCuaNgay]);
  /** + tuần đang lưu của dây nếu nằm ngoài dải (dây chép / phiếu cũ) — không làm mất giá trị. */
  const tuanThOptions = (dangChon: TuanFarm | null) => {
    const ds = dangChon && !dsTuanTh.some((x) => soSanhTuan(x, dangChon) === 0) ? [...dsTuanTh, dangChon] : dsTuanTh;
    return [...ds]
      .sort(soSanhTuan)
      .map((x) => ({ value: khoaTuanFarm(x), label: `${nhanTuanFarm(x)}${x.nam !== tuanCuaNgay.nam ? ` · ${x.nam}` : ''}` }));
  };

  /** Chép dây + lô + tổ trưởng (không số) từ phiếu gần nhất trước chuyến này của chi nhánh. */
  const chepTuChuyenTruoc = async () => {
    const v = getValues();
    if (!v.id_chi_nhanh || !YMD_RE.test(v.ngay ?? '')) {
      toast.message(t('danhGiaDauVao.form.chepCanChiNhanh'));
      return;
    }
    const truoc = await layChuyenTruoc.mutateAsync({
      ngay: v.ngay,
      chuyen: Number(v.chuyen) || 1,
      idChiNhanh: v.id_chi_nhanh,
      boQuaId: initial?.id ?? null,
    });
    if (!truoc) {
      toast.message(t('danhGiaDauVao.form.chepKhongCo'));
      return;
    }
    const khung = dungPhieuSaoChep(truoc, { ngay: v.ngay, chuyen: Number(v.chuyen) || 1 });
    const ap = () => {
      setValue('cot', khung.cot, { shouldDirty: true });
      setValue('lo', khung.lo, { shouldDirty: true });
      toast.success(
        t('danhGiaDauVao.form.chepXong', {
          day: khung.cot.length,
          lo: khung.lo.length,
          chuyen: truoc.chuyen,
          ngay: formatYmdToDisplay(truoc.ngay),
        })
      );
    };
    if ((v.cot ?? []).length === 0 && (v.lo ?? []).length === 0) {
      ap();
      return;
    }
    confirm({
      title: t('danhGiaDauVao.form.chepTitle'),
      message: t('danhGiaDauVao.form.chepThayThe', { chuyen: truoc.chuyen, ngay: formatYmdToDisplay(truoc.ngay) }),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: ap,
    });
  };

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
    { id: 'mau_1', label: t('danhGiaDauVao.form.mau1'), width: 124, minWidth: 100 },
    { id: 'mau_2', label: t('danhGiaDauVao.form.mau2'), width: 124, minWidth: 100 },
    { id: 'xe_doi', label: t('danhGiaDauVao.form.xeDoi'), width: 72, minWidth: 64, align: 'center' },
    { id: 'tuan_thu_hoach', label: t('danhGiaDauVao.form.tuanThuHoach'), width: 380, minWidth: 300, mobile: 'full' },
  ];

  /** Tuần thu hoạch farm (một select, khoá '2026-44' → th_nam + th_tuan) + «Chích bắp: …» chỉ đọc (= −9 tuần). */
  const oTuanThuHoach = (i: number) => {
    const loi = errors.cot?.[i]?.th_tuan?.message ?? errors.cot?.[i]?.th_nam?.message;
    const c = cotWatch?.[i];
    const th = c?.th_nam && c?.th_tuan ? { nam: Number(c.th_nam), tuan: Number(c.th_tuan) } : null;
    return (
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
        <select
          className={cn(cellInput, 'sm:w-[13.5rem] sm:shrink-0', loi && cellLoi)}
          title={loi}
          aria-label={t('danhGiaDauVao.form.tuanThuHoach')}
          value={th ? khoaTuanFarm(th) : ''}
          onChange={(e) => {
            const tf = docKhoaTuanFarm(e.target.value);
            if (!tf) return;
            setValue(`cot.${i}.th_nam`, tf.nam, { shouldDirty: true, shouldValidate: !!loi });
            setValue(`cot.${i}.th_tuan`, tf.tuan, { shouldDirty: true, shouldValidate: !!loi });
          }}
        >
          {!th && <option value="">{t('danhGiaDauVao.validation.tuanThuHoachRequired')}</option>}
          {tuanThOptions(th).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-caption text-muted-foreground tabular-nums whitespace-nowrap">
          {th ? t('danhGiaDauVao.form.chichBapLa', { tuan: nhanTuanFarm(tuanChichBapTuThuHoach(th)) }) : '—'}
        </span>
      </div>
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
      case 'tuan_thu_hoach':
        return oTuanThuHoach(i);
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
            <div className="sm:col-span-3">
              <Controller
                name="ngay"
                control={control}
                render={({ field }) => (
                  <Input
                    label={t('danhGiaDauVao.form.ngay')}
                    type="date"
                    required
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.ngay?.message}
                  />
                )}
              />
            </div>
            <div className="sm:col-span-4">
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
            <div className="sm:col-span-2">
              <Controller
                name="chuyen"
                control={control}
                render={({ field }) => (
                  <Input
                    label={t('danhGiaDauVao.form.chuyen')}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    required
                    value={field.value == null ? '' : String(field.value)}
                    onChange={(e) => field.onChange(e.target.value)}
                    error={errors.chuyen?.message}
                  />
                )}
              />
              {!isEdit && chuyenKeTiep.data != null && (
                <p className="text-caption text-muted-foreground m-0 mt-0.5">
                  {t('danhGiaDauVao.form.chuyenGoiY', { chuyen: chuyenKeTiep.data })}
                </p>
              )}
            </div>
            <div className="sm:col-span-3">
              <Input label={t('danhGiaDauVao.form.tuan')} value={nhanTuanFarm(tuanCuaNgay)} readOnly disabled />
            </div>
            <div className="col-span-2 sm:col-span-12">
              <Controller
                name="ghi_chu"
                control={control}
                render={({ field }) => <Input {...field} value={field.value ?? ''} label={t('danhGiaDauVao.form.ghiChu')} />}
              />
            </div>
          </div>
        </FormSection>

        {!isEdit && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-3 py-2">
            <p className="text-caption text-muted-foreground m-0">{t('danhGiaDauVao.form.chepHint')}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!idChiNhanh || layChuyenTruoc.isPending}
              isLoading={layChuyenTruoc.isPending}
              onClick={() => void chepTuChuyenTruoc().catch(() => undefined)}
              className="min-h-[44px] h-8 sm:h-8 px-3 shrink-0"
            >
              <CopyPlus size={14} className="mr-1.5" />
              {t('danhGiaDauVao.form.chepNut')}
            </Button>
          </div>
        )}

        <GenericSubTableSection
          title={t('danhGiaDauVao.form.sectionCot')}
          icon={<Columns3 size={14} className="text-primary" />}
          count={cotArr.fields.length}
          addLabel={t('danhGiaDauVao.form.themCot')}
          onAdd={() => cotArr.append(cotMoi(tuanCuaNgay))}
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
