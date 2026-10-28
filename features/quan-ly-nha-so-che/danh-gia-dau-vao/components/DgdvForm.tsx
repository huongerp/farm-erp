/**
 * Form phiếu chuyến Đánh giá đầu vào: ngày (mặc định hôm nay) / chi nhánh / chuyến (gợi ý chuyến kế tiếp)
 * / tuần farm (chỉ đọc, tính từ ngày) / ghi chú + danh sách cột dây và lô dạng bảng con CHỈ ĐỌC — thêm / bấm
 * dòng mở drawer con (`form/CotDayDrawer`, `form/LoDrawer`) sửa 1 dây / 1 lô, ghi vào field array (không gọi
 * DB); cả phiếu lưu một lần. «Chép dây & lô từ chuyến trước» lấy khung của phiếu gần nhất cùng chi nhánh.
 * Lô và tổ trưởng là chữ: chọn từ gợi ý hoặc gõ mới — lô chưa có trong danh mục của chi nhánh được tạo
 * lúc lưu (services/danh-gia-dau-vao-db.service `ganIdLo`). Cột dây và lô khớp theo `id` (thêm / sửa / xoá).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import { Controller, useFieldArray, useForm, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardPen, CopyPlus } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import Button from '../../../../components/ui/Button';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import { DRAWER_WIDTH_BAO_CAO_SO_CHE } from '../../../../lib/dialog-sizes';
import FormSection from '../../../../components/shared/FormSection';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import { formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { CONFIRM_YES } from '../../../../lib/button-labels';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { dgdvFormSchema, type DgdvFormValues } from '../core/schema';
import type { DgdvPhieuDayDu, TuanFarm } from '../core/types';
import { khoaTen, tenKhongTrung } from '../core/chuan-hoa-ten';
import { dungPhieuSaoChep } from '../core/bang-tinh';
import { nhanTuanFarm, tuanFarmCuaNgay } from '../core/tuan';
import { useDgdvChuyenKeTiep, useLayPhieuChuyenTruoc, useLuuDgdv } from '../hooks/use-danh-gia-dau-vao';
import { useLoThuHoach, useMauDay, useNhanVienRef } from '../hooks/use-danh-muc-dgdv';
import CotDaySection from './form/CotDaySection';
import LoSection from './form/LoSection';
import CotDayDrawer from './form/CotDayDrawer';
import LoDrawer from './form/LoDrawer';

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

/** Drawer con đang mở: dây / lô thứ `i` (null = thêm mới). */
type DrawerCon = { loai: 'cot' | 'lo'; i: number | null } | null;

const DgdvForm: React.FC<Props> = ({ branches, initial, giaTriMacDinh, onClose, onSaved }) => {
  const { t } = useTranslation();
  const isEdit = !!initial;
  const confirm = useConfirmStore((s) => s.confirm);
  const layChuyenTruoc = useLayPhieuChuyenTruoc();
  const luu = useLuuDgdv((id) => {
    onSaved?.(id);
    onClose();
  });
  const { data: dsMau = [], mauTheoId } = useMauDay();
  const { data: dsLo = [] } = useLoThuHoach();
  const { data: dsNhanVien = [] } = useNhanVienRef();
  const [drawerCon, setDrawerCon] = useState<DrawerCon>(null);

  const defaultValues = useMemo<DgdvFormValues>(() => {
    if (initial) return phieuSangForm(initial);
    return { ngay: getTodayISO(), chuyen: 1, id_chi_nhanh: '', ghi_chu: '', cot: [], lo: [], ...giaTriMacDinh };
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
  const cotWatch = useWatch({ control, name: 'cot' });
  const loWatch = useWatch({ control, name: 'lo' });
  const tuanCuaNgay = useMemo(() => tuanFarmCuaNgay(YMD_RE.test(ngay ?? '') ? ngay : getTodayISO()), [ngay]);

  // Tạo mới: gợi ý chuyến kế tiếp của (ngày, chi nhánh) — không đè số người dùng đã gõ.
  const chuyenKeTiep = useDgdvChuyenKeTiep(YMD_RE.test(ngay ?? '') ? ngay : null, idChiNhanh || null, !isEdit);
  useEffect(() => {
    if (isEdit || chuyenKeTiep.data == null || getFieldState('chuyen').isDirty) return;
    setValue('chuyen', chuyenKeTiep.data);
  }, [isEdit, chuyenKeTiep.data, getFieldState, setValue]);

  const branchOptions = useMemo(() => {
    const opts = branches.map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` }));
    if (initial && !opts.some((o) => o.value === initial.id_chi_nhanh)) {
      opts.unshift({ value: initial.id_chi_nhanh, label: initial.ten_chi_nhanh ?? `#${initial.id_chi_nhanh}` });
    }
    return opts;
  }, [branches, initial]);

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
        t('danhGiaDauVao.form.chepXong', { day: khung.cot.length, lo: khung.lo.length, chuyen: truoc.chuyen, ngay: formatYmdToDisplay(truoc.ngay) })
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
      tenKhongTrung([...dsLo.map((l) => l.to_truong), ...(loWatch ?? []).map((l) => l?.to_truong), ...dsNhanVien.map((e) => e.ho_ten)]).map(
        (ten) => ({ value: ten, label: ten })
      ),
    [dsLo, loWatch, dsNhanVien]
  );

  const layHetLo = () => {
    const daCo = new Set((getValues('lo') ?? []).map((l) => khoaTen(l.ten_lo)));
    loCuaChiNhanh
      .filter((l) => !daCo.has(khoaTen(l.ten_lo)))
      .forEach((l) => loArr.append({ ten_lo: l.ten_lo, to_truong: l.to_truong, ghi_chu: '' }));
  };

  const onSubmit: SubmitHandler<DgdvFormValues> = (data) => luu.mutate({ id: initial?.id ?? null, data });

  const conMo = drawerCon;
  const iCon = conMo?.i ?? null;

  return (
    <GenericDrawer
      onClose={onClose}
      isDirty={isDirty}
      title={isEdit ? t('danhGiaDauVao.form.editTitle') : t('danhGiaDauVao.form.createTitle')}
      maxWidthClass={DRAWER_WIDTH_BAO_CAO_SO_CHE}
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
      <div className="space-y-4">
        <form id="dgdv-form" onSubmit={handleSubmit(onSubmit)}>
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
                  <p className="text-caption text-muted-foreground m-0 mt-0.5">{t('danhGiaDauVao.form.chuyenGoiY', { chuyen: chuyenKeTiep.data })}</p>
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
        </form>

        {!isEdit && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
            <p className="text-caption text-muted-foreground m-0 flex-1 min-w-[12rem]">{t('danhGiaDauVao.form.chepHint')}</p>
            <Button
              type="button"
              size="sm"
              disabled={!idChiNhanh || layChuyenTruoc.isPending}
              isLoading={layChuyenTruoc.isPending}
              onClick={() => void chepTuChuyenTruoc().catch(() => undefined)}
              className="min-h-[44px] h-8 sm:h-8 px-3 shrink-0 bg-primary text-white"
            >
              <CopyPlus size={14} className="mr-1.5" />
              {t('danhGiaDauVao.form.chepNut')}
            </Button>
          </div>
        )}

        <CotDaySection
          fields={cotArr.fields}
          values={cotWatch ?? []}
          mauTheoId={mauTheoId}
          coLoi={(i) => !!errors.cot?.[i]}
          isEdit={isEdit}
          onThem={() => setDrawerCon({ loai: 'cot', i: null })}
          onMo={(i) => setDrawerCon({ loai: 'cot', i })}
          onDoiCho={cotArr.move}
          onXoa={cotArr.remove}
        />

        <LoSection
          fields={loArr.fields}
          values={loWatch ?? []}
          loTheoTen={loTheoTen}
          coLoi={(i) => !!errors.lo?.[i]}
          isEdit={isEdit}
          onLayHetLo={loCuaChiNhanh.length > 0 ? layHetLo : undefined}
          onThem={() => setDrawerCon({ loai: 'lo', i: null })}
          onMo={(i) => setDrawerCon({ loai: 'lo', i })}
          onDoiCho={loArr.move}
          onXoa={loArr.remove}
        />
      </div>

      <AnimatePresence>
        {conMo?.loai === 'cot' && (
          <CotDayDrawer
            giaTri={iCon != null ? getValues(`cot.${iCon}`) : null}
            macDinh={cotMoi(tuanCuaNgay)}
            tuanCuaNgay={tuanCuaNgay}
            mauOptions={mauOptions}
            mauTheoId={mauTheoId}
            onLuu={(v) => (iCon != null ? cotArr.update(iCon, v) : cotArr.append(v))}
            onClose={() => setDrawerCon(null)}
          />
        )}
        {conMo?.loai === 'lo' && (
          <LoDrawer
            giaTri={iCon != null ? getValues(`lo.${iCon}`) : null}
            loOptions={loOptions}
            loTheoTen={loTheoTen}
            toTruongOptions={toTruongOptions}
            tenDaCo={new Set((loWatch ?? []).filter((_, j) => j !== iCon).map((l) => khoaTen(l?.ten_lo)))}
            onLuu={(v) => (iCon != null ? loArr.update(iCon, v) : loArr.append(v))}
            onClose={() => setDrawerCon(null)}
          />
        )}
      </AnimatePresence>
    </GenericDrawer>
  );
};

export default DgdvForm;
