import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Edit, Plus, Star, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { cn } from '../../../../lib/utils';
import type { HangMucMauChecklist, LoaiMauCl, MucMauChecklist, TanSuatVeSinh } from '../core/types';
import { moTaTanSuat, nhanThu } from '../core/ve-sinh-tuan';
import type { HangMucFormValues } from '../core/schema';
import {
  useLuuHangMuc,
  useLuuMuc,
  useMauChiTiet,
  useThaoTacHangMuc,
  useThaoTacMuc,
  useThietBi,
} from '../hooks/use-checklist-mau';

const ICON_BTN =
  'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent';

/** Nhóm không có mục (id_muc null) — chỉ gặp nếu dữ liệu nhập tay, vẫn hiện để không sót. */
const MUC_NONE = '__khong_muc__';

/** Hàm lưu bản nháp của một form con đang mở; trả false nếu dữ liệu chưa hợp lệ. */
type BanNhapSaver = () => Promise<boolean>;
type DangKySaver = (fn: BanNhapSaver) => () => void;

export interface MucHangMucEditorHandle {
  /** Lưu form mục / hạng mục đang mở (nếu có). false = dữ liệu chưa hợp lệ → người gọi nên dừng. */
  luuBanNhapDangMo: () => Promise<boolean>;
}

interface Props {
  idMau: string;
  /** Loại mẫu đang chọn — 've_sinh_tuan' mới hiện ô tần suất hạng mục. */
  loai?: LoaiMauCl;
  canEdit: boolean;
  ref?: React.Ref<MucHangMucEditorHandle>;
}

/** Enter ở ô nhập một dòng = Lưu (editor nằm trong <form> của drawer nên không dùng <form> lồng nhau). */
function enterLuu(e: React.KeyboardEvent<HTMLElement>, luu: () => void) {
  const el = e.target as HTMLElement;
  if (e.key !== 'Enter' || el.tagName !== 'INPUT' || (el as HTMLInputElement).type === 'checkbox') return;
  e.preventDefault();
  e.stopPropagation();
  luu();
}

const MucHangMucEditor: React.FC<Props> = ({ idMau, loai, canEdit, ref }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: chiTiet, isLoading } = useMauChiTiet(idMau);
  const { data: thietBiList = [] } = useThietBi();
  const thaoTacMuc = useThaoTacMuc();
  const thaoTacHangMuc = useThaoTacHangMuc();

  const [dangThemMuc, setDangThemMuc] = useState(false);
  const [suaMuc, setSuaMuc] = useState<MucMauChecklist | null>(null);
  const [themHangMucCho, setThemHangMucCho] = useState<string | null>(null);
  const [suaHangMuc, setSuaHangMuc] = useState<HangMucMauChecklist | null>(null);

  const saversRef = useRef(new Set<BanNhapSaver>());
  const dangKy = useCallback<DangKySaver>((fn) => {
    saversRef.current.add(fn);
    return () => {
      saversRef.current.delete(fn);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      luuBanNhapDangMo: async () => {
        for (const fn of Array.from(saversRef.current)) {
          if (!(await fn())) return false;
        }
        return true;
      },
    }),
    []
  );

  const muc = chiTiet?.muc ?? [];

  const nhomHangMuc = useMemo(() => {
    const hangMuc = chiTiet?.hangMuc ?? [];
    const map = new Map<string, HangMucMauChecklist[]>();
    const khongMuc: HangMucMauChecklist[] = [];
    for (const hm of hangMuc) {
      const arr = hm.id_muc ? (map.get(hm.id_muc) ?? []) : khongMuc;
      arr.push(hm);
      if (hm.id_muc) map.set(hm.id_muc, arr);
    }
    return { map, khongMuc };
  }, [chiTiet]);

  const thietBiOptions = useMemo(
    () => [
      { value: '', label: t('checklistMau.hangMuc.khongLienKet') },
      ...thietBiList.map((tb) => {
        const ten = tb.ma_ts ? `${tb.ma_ts} — ${tb.ten}` : tb.ten;
        return { value: tb.id, label: tb.ten_chi_nhanh ? `${ten} — ${tb.ten_chi_nhanh}` : ten };
      }),
    ],
    [thietBiList, t]
  );

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('checklistMau.loading')}</p>;
  }

  const doiChoMuc = (i: number, j: number) => {
    if (j < 0 || j >= muc.length) return;
    const ids = muc.map((m) => m.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    thaoTacMuc.mutate({ action: 'sapXep', ids });
  };

  const doiChoHangMuc = (nhom: HangMucMauChecklist[], i: number, j: number) => {
    if (j < 0 || j >= nhom.length) return;
    const ids = nhom.map((h) => h.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    thaoTacHangMuc.mutate({ action: 'sapXep', ids });
  };

  const xoaMuc = (m: MucMauChecklist) =>
    confirm({
      title: t('checklistMau.muc.xoaTitle'),
      message: t('checklistMau.muc.xoaMessage', { ten: m.ten }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        await thaoTacMuc.mutateAsync({ action: 'xoa', id: m.id });
      },
    });

  const xoaHangMuc = (h: HangMucMauChecklist) =>
    confirm({
      title: t('checklistMau.hangMuc.xoaTitle'),
      message: t('checklistMau.hangMuc.xoaMessage', { doiTuong: h.doi_tuong }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        await thaoTacHangMuc.mutateAsync({ action: 'xoa', id: h.id });
      },
    });

  const renderMucForm = (initial: MucMauChecklist | null) => (
    <MucForm
      initial={initial}
      idMau={idMau}
      muc={muc}
      dangKy={dangKy}
      onDone={() => {
        setDangThemMuc(false);
        setSuaMuc(null);
      }}
    />
  );

  const renderHangMucForm = (idMuc: string | null, initial: HangMucMauChecklist | null, nhom: HangMucMauChecklist[]) => (
    <HangMucForm
      initial={initial}
      idMau={idMau}
      idMuc={idMuc}
      nhom={nhom}
      veSinh={loai === 've_sinh_tuan'}
      thietBiOptions={thietBiOptions}
      dangKy={dangKy}
      onDone={() => {
        setThemHangMucCho(null);
        setSuaHangMuc(null);
      }}
    />
  );

  const renderHangMucRow = (h: HangMucMauChecklist, nhom: HangMucMauChecklist[], i: number) => {
    if (suaHangMuc?.id === h.id) {
      return <li key={h.id} className="p-2">{renderHangMucForm(h.id_muc, h, nhom)}</li>;
    }
    const thietBi = thietBiList.find((tb) => tb.id === h.id_thiet_bi);
    return (
      <li key={h.id} className={cn('flex items-center gap-2 px-3 py-2', !h.dang_dung && 'opacity-50')}>
        {canEdit && (
          <div className="flex flex-col">
            <button type="button" className={ICON_BTN} disabled={i === 0 || thaoTacHangMuc.isPending} onClick={() => doiChoHangMuc(nhom, i, i - 1)} aria-label="↑">
              <ArrowUp size={12} />
            </button>
            <button type="button" className={ICON_BTN} disabled={i === nhom.length - 1 || thaoTacHangMuc.isPending} onClick={() => doiChoHangMuc(nhom, i, i + 1)} aria-label="↓">
              <ArrowDown size={12} />
            </button>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">
            {h.quan_trong && <Star size={12} className="inline text-amber-500 -mt-0.5 mr-1" />}
            {h.doi_tuong}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {loai === 've_sinh_tuan' && (
              <span className="mr-1 font-medium text-foreground/80">[{moTaTanSuat(h.tan_suat, t)}]</span>
            )}
            {[h.tieu_chuan, h.phuong_phap].filter(Boolean).join(' · ') || '—'}
            {thietBi && (
              <span className="ml-1 text-primary/70">
                ({thietBi.ma_ts ? `${thietBi.ma_ts} — ${thietBi.ten}` : thietBi.ten})
              </span>
            )}
          </div>
        </div>
        {canEdit && (
          <>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={h.dang_dung}
                onChange={(e) => thaoTacHangMuc.mutate({ action: 'dangDung', id: h.id, value: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              {t('checklistMau.hangMuc.dangDung')}
            </label>
            <button type="button" className={cn(ICON_BTN, 'text-primary')} onClick={() => setSuaHangMuc(h)} aria-label={t('common.edit')}>
              <Edit size={14} />
            </button>
            <button type="button" className={cn(ICON_BTN, 'text-rose-500')} onClick={() => xoaHangMuc(h)} aria-label={t('common.delete')}>
              <Trash2 size={14} />
            </button>
          </>
        )}
      </li>
    );
  };

  const renderNhomHangMuc = (idMuc: string | null, nhom: HangMucMauChecklist[]) => (
    <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border bg-card">
      {nhom.map((h, i) => renderHangMucRow(h, nhom, i))}
      {nhom.length === 0 && (
        <li className="px-3 py-3 text-xs text-muted-foreground">{t('checklistMau.muc.chuaCoHangMuc')}</li>
      )}
      {canEdit && themHangMucCho === (idMuc ?? MUC_NONE) && (
        <li className="p-2 bg-muted/30">{renderHangMucForm(idMuc, null, nhom)}</li>
      )}
    </ul>
  );

  return (
    <FormSection title={t('checklistMau.muc.tieuDe')}>
      <p className="text-xs text-muted-foreground m-0">{t('checklistMau.muc.gioiThieu')}</p>

      {canEdit && !dangThemMuc && suaMuc === null && (
        <Button type="button" size="sm" variant="outline" onClick={() => setDangThemMuc(true)}>
          <Plus size={14} className="mr-1.5" />
          {t('checklistMau.muc.themMuc')}
        </Button>
      )}
      {dangThemMuc && renderMucForm(null)}

      <div className="space-y-4">
        {muc.map((m, i) => (
          <div key={m.id} className="space-y-2">
            {suaMuc?.id === m.id ? (
              renderMucForm(m)
            ) : (
              <div className="flex items-center gap-2">
                {canEdit && (
                  <div className="flex flex-col">
                    <button type="button" className={ICON_BTN} disabled={i === 0 || thaoTacMuc.isPending} onClick={() => doiChoMuc(i, i - 1)} aria-label="↑">
                      <ArrowUp size={12} />
                    </button>
                    <button type="button" className={ICON_BTN} disabled={i === muc.length - 1 || thaoTacMuc.isPending} onClick={() => doiChoMuc(i, i + 1)} aria-label="↓">
                      <ArrowDown size={12} />
                    </button>
                  </div>
                )}
                <h4 className="text-sm font-semibold m-0 flex-1 truncate">
                  {m.ten}
                </h4>
                {canEdit && (
                  <>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setThemHangMucCho((prev) => (prev === m.id ? null : m.id))}>
                      <Plus size={13} className="mr-1" />
                      {t('checklistMau.muc.themHangMuc')}
                    </Button>
                    <button type="button" className={cn(ICON_BTN, 'text-primary')} onClick={() => setSuaMuc(m)} aria-label={t('common.edit')}>
                      <Edit size={14} />
                    </button>
                    <button type="button" className={cn(ICON_BTN, 'text-rose-500')} onClick={() => xoaMuc(m)} aria-label={t('common.delete')}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            )}
            {renderNhomHangMuc(m.id, nhomHangMuc.map.get(m.id) ?? [])}
          </div>
        ))}

        {nhomHangMuc.khongMuc.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold m-0 text-muted-foreground">{t('checklistMau.form.khac')}</h4>
            {renderNhomHangMuc(null, nhomHangMuc.khongMuc)}
          </div>
        )}

        {muc.length === 0 && nhomHangMuc.khongMuc.length === 0 && !dangThemMuc && (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <p className="text-sm font-medium m-0">{t('checklistMau.muc.chuaCo')}</p>
            <p className="text-xs text-muted-foreground mt-1 m-0">{t('checklistMau.muc.chuaCoHint')}</p>
          </div>
        )}
      </div>
    </FormSection>
  );
};

// ── Form mục ───────────────────────────────────────────────────────────────────

const MucForm: React.FC<{
  initial: MucMauChecklist | null;
  idMau: string;
  muc: MucMauChecklist[];
  dangKy: DangKySaver;
  onDone: () => void;
}> = ({ initial, idMau, muc, dangKy, onDone }) => {
  const { t } = useTranslation();
  const luu = useLuuMuc(onDone);
  const [ten, setTen] = useState(initial?.ten ?? '');
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (!ten.trim()) {
      setErr(t('checklistMau.muc.tenRequired'));
      return;
    }
    luu.mutate({ id: initial?.id ?? null, idMau, ten, muc });
  };

  // Cho nút Lưu của drawer chủ: lưu luôn bản nháp đang gõ dở.
  const luuBanNhap: BanNhapSaver = async () => {
    if (!initial && !ten.trim()) return true; // form thêm mới để trống → bỏ qua
    if (initial && ten.trim() === initial.ten) return true; // không đổi gì
    if (!ten.trim()) {
      setErr(t('checklistMau.muc.tenRequired'));
      return false;
    }
    try {
      await luu.mutateAsync({ id: initial?.id ?? null, idMau, ten, muc });
      return true;
    } catch {
      return false; // onError của hook đã báo toast
    }
  };
  const luuBanNhapRef = useRef(luuBanNhap);
  useEffect(() => {
    luuBanNhapRef.current = luuBanNhap;
  });
  useEffect(() => dangKy(() => luuBanNhapRef.current()), [dangKy]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Enter ở ô nhập = Lưu, thay cho <form> lồng
    <div
      onKeyDown={(e) => enterLuu(e, () => !luu.isPending && submit())}
      className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2"
    >
      <Input
        label={t('checklistMau.muc.tenMuc')}
        value={ten}
        onChange={(e) => {
          setTen(e.target.value);
          setErr(null);
        }}
        error={err ?? undefined}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="button" size="sm" disabled={luu.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};

// ── Form hạng mục ──────────────────────────────────────────────────────────────

const RONG: HangMucFormValues = {
  doi_tuong: '',
  tieu_chuan: '',
  phuong_phap: '',
  quan_trong: false,
  id_thiet_bi: null,
  tan_suat: null,
  dang_dung: true,
};

const THU_NUT = [2, 3, 4, 5, 6, 7, 8] as const;
type KieuTanSuat = 'hang_ngay' | 'thu' | 'cuoi_thang';

/** Chọn tần suất vệ sinh: hằng ngày / theo thứ (nhiều thứ) / cuối tháng (một thứ). */
const TanSuatEditor: React.FC<{ value: TanSuatVeSinh | null; onChange: (v: TanSuatVeSinh | null) => void }> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const kieu: KieuTanSuat = value?.kieu ?? 'hang_ngay';
  const doiKieu = (k: KieuTanSuat) => {
    if (k === 'hang_ngay') onChange(null);
    else if (k === 'thu') onChange({ kieu: 'thu', thu: value?.kieu === 'thu' ? value.thu : [] });
    else onChange({ kieu: 'cuoi_thang', thu: value?.kieu === 'cuoi_thang' ? value.thu : 7 });
  };
  const nut = (active: boolean, label: string, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'min-w-9 rounded-md border px-2 py-1 text-xs font-medium',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'
      )}
    >
      {label}
    </button>
  );
  const kieuOptions = (['hang_ngay', 'thu', 'cuoi_thang'] as const).map((k) => ({
    value: k,
    label: t(`checklistMau.hangMuc.tanSuatKieu.${k}`),
  }));
  return (
    <div className="space-y-2">
      <Select
        label={t('checklistMau.hangMuc.tanSuat')}
        value={kieu}
        onChange={(e) => doiKieu(e.target.value as KieuTanSuat)}
        options={kieuOptions}
      />
      {value?.kieu === 'thu' && (
        <div className="flex flex-wrap gap-1.5">
          {THU_NUT.map((th) =>
            nut(value.thu.includes(th), nhanThu(th), () =>
              onChange({
                kieu: 'thu',
                thu: value.thu.includes(th) ? value.thu.filter((x) => x !== th) : [...value.thu, th].sort((a, b) => a - b),
              })
            )
          )}
        </div>
      )}
      {value?.kieu === 'cuoi_thang' && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{t('checklistMau.hangMuc.cuoiThangThu')}</span>
          {THU_NUT.map((th) => nut(value.thu === th, nhanThu(th), () => onChange({ kieu: 'cuoi_thang', thu: th })))}
        </div>
      )}
    </div>
  );
};

const HangMucForm: React.FC<{
  initial: HangMucMauChecklist | null;
  idMau: string;
  idMuc: string | null;
  nhom: HangMucMauChecklist[];
  veSinh: boolean;
  thietBiOptions: { value: string; label: string }[];
  dangKy: DangKySaver;
  onDone: () => void;
}> = ({ initial, idMau, idMuc, nhom, veSinh, thietBiOptions, dangKy, onDone }) => {
  const { t } = useTranslation();
  const luu = useLuuHangMuc(onDone);
  const [giaTriDau] = useState<HangMucFormValues>(
    initial
      ? {
          doi_tuong: initial.doi_tuong,
          tieu_chuan: initial.tieu_chuan ?? '',
          phuong_phap: initial.phuong_phap ?? '',
          quan_trong: initial.quan_trong,
          id_thiet_bi: initial.id_thiet_bi,
          tan_suat: initial.tan_suat,
          dang_dung: initial.dang_dung,
        }
      : RONG
  );
  const [values, setValues] = useState<HangMucFormValues>(giaTriDau);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof HangMucFormValues>(k: K, v: HangMucFormValues[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setErr(null);
  };

  // Mẫu bàn giao: không ghi tần suất. "Theo thứ" phải chọn ≥ 1 thứ.
  const tanSuatHopLe = !veSinh || values.tan_suat?.kieu !== 'thu' || values.tan_suat.thu.length > 0;
  const giaTriLuu: HangMucFormValues = { ...values, tan_suat: veSinh ? values.tan_suat : null };

  const submit = () => {
    if (!values.doi_tuong.trim()) {
      setErr(t('checklistMau.hangMuc.doiTuongRequired'));
      return;
    }
    if (!tanSuatHopLe) {
      setErr(t('checklistMau.hangMuc.tanSuatThieuThu'));
      return;
    }
    luu.mutate({ id: initial?.id ?? null, idMau, idMuc, values: giaTriLuu, nhom });
  };

  // Cho nút Lưu của drawer chủ: lưu luôn bản nháp đang gõ dở.
  const luuBanNhap: BanNhapSaver = async () => {
    if (JSON.stringify(values) === JSON.stringify(giaTriDau)) return true; // chưa đổi gì
    if (!values.doi_tuong.trim()) {
      setErr(t('checklistMau.hangMuc.doiTuongRequired'));
      return false;
    }
    if (!tanSuatHopLe) {
      setErr(t('checklistMau.hangMuc.tanSuatThieuThu'));
      return false;
    }
    try {
      await luu.mutateAsync({ id: initial?.id ?? null, idMau, idMuc, values: giaTriLuu, nhom });
      return true;
    } catch {
      return false; // onError của hook đã báo toast
    }
  };
  const luuBanNhapRef = useRef(luuBanNhap);
  useEffect(() => {
    luuBanNhapRef.current = luuBanNhap;
  });
  useEffect(() => dangKy(() => luuBanNhapRef.current()), [dangKy]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Enter ở ô nhập = Lưu, thay cho <form> lồng
    <div
      onKeyDown={(e) => enterLuu(e, () => !luu.isPending && submit())}
      className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3"
    >
      <FormGrid cols={2}>
        <Input
          label={t('checklistMau.hangMuc.doiTuong')}
          required
          value={values.doi_tuong}
          onChange={(e) => set('doi_tuong', e.target.value)}
          error={err ?? undefined}
          autoFocus
        />
        <Select
          label={t('checklistMau.hangMuc.thietBi')}
          value={values.id_thiet_bi ?? ''}
          onChange={(e) => set('id_thiet_bi', e.target.value || null)}
          options={thietBiOptions}
        />
        <Textarea
          label={t('checklistMau.hangMuc.tieuChuan')}
          rows={2}
          value={values.tieu_chuan}
          onChange={(e) => set('tieu_chuan', e.target.value)}
        />
        <Textarea
          label={t('checklistMau.hangMuc.phuongPhap')}
          rows={2}
          value={values.phuong_phap}
          onChange={(e) => set('phuong_phap', e.target.value)}
        />
      </FormGrid>
      {veSinh && <TanSuatEditor value={values.tan_suat} onChange={(v) => set('tan_suat', v)} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ToggleSwitch
          checked={values.quan_trong}
          onChange={(v) => set('quan_trong', v)}
          label={t('checklistMau.hangMuc.quanTrong')}
          description={t('checklistMau.hangMuc.quanTrongHint')}
        />
        <ToggleSwitch
          checked={values.dang_dung}
          onChange={(v) => set('dang_dung', v)}
          label={t('checklistMau.hangMuc.dangDung')}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="button" size="sm" disabled={luu.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};

export default MucHangMucEditor;
