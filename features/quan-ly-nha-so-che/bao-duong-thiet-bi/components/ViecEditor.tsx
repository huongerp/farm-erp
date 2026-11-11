import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, ClipboardCheck, Edit, Plus, Trash2 } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import ToggleSwitch from '../../../../components/ui/ToggleSwitch';
import FormSection from '../../../../components/shared/FormSection';
import FormGrid from '../../../../components/shared/FormGrid';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import { cn, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import type { ThietBi, ViecBaoDuong } from '../core/types';
import type { LichBaoDuongRow } from '../core/list-types';
import { docChuKyNgay, docNgay, type ViecFormValues } from '../core/schema';
import { useLuuViec, useThaoTacViec } from '../hooks/use-bao-duong-thiet-bi';
import { TinhTrangHanBadge } from './Badges';

const ICON_BTN = 'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent';

interface Props {
  idThietBi: string;
  thietBi: ThietBi;
  viec: ViecBaoDuong[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onGhiNhan: (row: LichBaoDuongRow) => void;
}

/** Danh sách việc bảo dưỡng trong drawer thiết bị — thêm/sửa/xoá/lên-xuống + nút Ghi nhận. */
const ViecEditor: React.FC<Props> = ({ idThietBi, thietBi, viec, canCreate, canUpdate, canDelete, onGhiNhan }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const thaoTac = useThaoTacViec();
  const [them, setThem] = useState(false);
  const [sua, setSua] = useState<ViecBaoDuong | null>(null);
  const homNay = getTodayISO();

  const doiCho = (i: number, j: number) => {
    if (j < 0 || j >= viec.length) return;
    const ids = viec.map((v) => v.id);
    [ids[i], ids[j]] = [ids[j], ids[i]];
    thaoTac.mutate({ action: 'sapXep', ids });
  };

  const xoaViec = (v: ViecBaoDuong) =>
    confirm({
      title: t('baoDuongThietBi.viec.xoaTitle'),
      message: t('baoDuongThietBi.viec.xoaMessage', { noiDung: v.noi_dung }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        await thaoTac.mutateAsync({ action: 'xoa', id: v.id });
      },
    });

  const ghiNhan = (v: ViecBaoDuong) =>
    onGhiNhan({ ...v, thiet_bi_ten: thietBi.ten, thiet_bi_ma_ts: thietBi.ma_ts, thiet_bi_khu_vuc: thietBi.khu_vuc });

  return (
    <FormSection
      title={t('baoDuongThietBi.viec.tieuDe')}
      action={
        canUpdate && (
          <Button type="button" size="sm" variant="outline" onClick={() => setThem((v) => !v)}>
            <Plus size={14} className="mr-1.5" />
            {t('baoDuongThietBi.viec.themViec')}
          </Button>
        )
      }
    >
      <p className="text-xs text-muted-foreground m-0">{t('baoDuongThietBi.viec.gioiThieu')}</p>

      {them && <ViecForm idThietBi={idThietBi} initial={null} nhom={viec} onDone={() => setThem(false)} />}

      <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border bg-card">
        {viec.map((v, i) =>
          sua?.id === v.id ? (
            <li key={v.id} className="p-2">
              <ViecForm idThietBi={idThietBi} initial={v} nhom={viec} onDone={() => setSua(null)} />
            </li>
          ) : (
            <li key={v.id} className={cn('flex items-center gap-2 px-3 py-2.5', !v.dang_dung && 'opacity-50')}>
              {canUpdate && (
                <div className="flex flex-col">
                  <button type="button" className={ICON_BTN} disabled={i === 0 || thaoTac.isPending} onClick={() => doiCho(i, i - 1)} aria-label="↑">
                    <ArrowUp size={12} />
                  </button>
                  <button type="button" className={ICON_BTN} disabled={i === viec.length - 1 || thaoTac.isPending} onClick={() => doiCho(i, i + 1)} aria-label="↓">
                    <ArrowDown size={12} />
                  </button>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {i + 1}. {v.noi_dung}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {v.chu_ky_ngay != null ? t('baoDuongThietBi.chuKy.ngay', { n: v.chu_ky_ngay }) : t('baoDuongThietBi.chuKy.khongTheoLich')}
                  {v.lan_gan_nhat ? ` · ${t('baoDuongThietBi.col.lanGanNhat')}: ${formatYmdToDisplay(v.lan_gan_nhat)}` : ''}
                </div>
              </div>
              <TinhTrangHanBadge han={v.han_ke_tiep} homNay={homNay} />
              {canCreate && (
                <button
                  type="button"
                  onClick={() => ghiNhan(v)}
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 active:scale-95 transition-all shrink-0"
                >
                  <ClipboardCheck size={14} />
                  <span className="hidden sm:inline">{t('baoDuongThietBi.viec.ghiNhan')}</span>
                </button>
              )}
              {canUpdate && (
                <button type="button" className={cn(ICON_BTN, 'text-primary')} onClick={() => setSua(v)} aria-label={t('common.edit')}>
                  <Edit size={14} />
                </button>
              )}
              {canDelete && (
                <button type="button" className={cn(ICON_BTN, 'text-rose-500')} onClick={() => xoaViec(v)} aria-label={t('common.delete')}>
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          )
        )}
        {viec.length === 0 && !them && (
          <li className="px-3 py-4 text-center">
            <p className="text-sm font-medium m-0">{t('baoDuongThietBi.viec.chuaCo')}</p>
            <p className="text-xs text-muted-foreground mt-1 m-0">{t('baoDuongThietBi.viec.chuaCoHint')}</p>
          </li>
        )}
      </ul>
    </FormSection>
  );
};

// ── Form thêm/sửa một việc ─────────────────────────────────────────────────────

const RONG: ViecFormValues = { noi_dung: '', chu_ky_ngay: '', han_ke_tiep: '', ghi_chu: '', dang_dung: true };

const ViecForm: React.FC<{
  idThietBi: string;
  initial: ViecBaoDuong | null;
  nhom: ViecBaoDuong[];
  onDone: () => void;
}> = ({ idThietBi, initial, nhom, onDone }) => {
  const { t } = useTranslation();
  const luu = useLuuViec(onDone);
  const daLam = !!initial?.lan_gan_nhat;

  const [values, setValues] = useState<ViecFormValues>(
    initial
      ? {
          noi_dung: initial.noi_dung,
          chu_ky_ngay: initial.chu_ky_ngay != null ? String(initial.chu_ky_ngay) : '',
          han_ke_tiep: initial.han_ke_tiep ?? '',
          ghi_chu: initial.ghi_chu ?? '',
          dang_dung: initial.dang_dung,
        }
      : RONG
  );
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof ViecFormValues>(k: K, v: ViecFormValues[K]) => {
    setValues((prev) => ({ ...prev, [k]: v }));
    setErr(null);
  };

  const submit = () => {
    if (!values.noi_dung.trim()) {
      setErr(t('baoDuongThietBi.viec.noiDungRequired'));
      return;
    }
    const chuKy = docChuKyNgay(values.chu_ky_ngay);
    if (chuKy === 'loi') {
      setErr(t('baoDuongThietBi.viec.chuKyLoi'));
      return;
    }
    const hanNhap = docNgay(values.han_ke_tiep);
    if (hanNhap === 'loi') {
      setErr(t('baoDuongThietBi.viec.ngayLoi'));
      return;
    }
    luu.mutate({
      id: initial?.id ?? null,
      idThietBi,
      values: {
        noi_dung: values.noi_dung.trim(),
        chu_ky_ngay: chuKy,
        han_ke_tiep: daLam ? initial.han_ke_tiep : hanNhap,
        ghi_chu: values.ghi_chu.trim() || null,
        dang_dung: values.dang_dung,
      },
      nhom,
    });
  };

  // Form này nằm trong <form> của drawer: không dùng <form> lồng nhau, Enter ở ô nhập một dòng = Lưu.
  const enterLuu = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    if (e.key !== 'Enter' || el.tagName !== 'INPUT' || (el as HTMLInputElement).type === 'checkbox') return;
    e.preventDefault();
    e.stopPropagation();
    if (!luu.isPending) submit();
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Enter ở ô nhập = Lưu, thay cho <form> lồng
    <div
      onKeyDown={enterLuu}
      className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3"
    >
      <FormGrid cols={2}>
        <div className="sm:col-span-2">
          <Input
            label={t('baoDuongThietBi.viec.noiDung')}
            required
            value={values.noi_dung}
            onChange={(e) => set('noi_dung', e.target.value)}
            error={err ?? undefined}
            autoFocus
          />
        </div>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          label={t('baoDuongThietBi.viec.chuKyNgay')}
          value={values.chu_ky_ngay}
          onChange={(e) => set('chu_ky_ngay', e.target.value)}
        />
        {daLam ? (
          <div>
            <p className="text-xs font-medium text-foreground mb-1.5">{t('baoDuongThietBi.col.hanKeTiep')}</p>
            <p className="text-sm tabular-nums">{initial.han_ke_tiep ? formatYmdToDisplay(initial.han_ke_tiep) : '—'}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('baoDuongThietBi.viec.hanAutoHint')}</p>
          </div>
        ) : (
          <Input
            type="date"
            label={t('baoDuongThietBi.viec.ngayBatDau')}
            value={values.han_ke_tiep}
            onChange={(e) => set('han_ke_tiep', e.target.value)}
          />
        )}
        <div className="sm:col-span-2">
          <Textarea rows={2} label={t('baoDuongThietBi.viec.ghiChu')} value={values.ghi_chu} onChange={(e) => set('ghi_chu', e.target.value)} />
        </div>
      </FormGrid>
      <ToggleSwitch
        checked={values.dang_dung}
        onChange={(v) => set('dang_dung', v)}
        label={t('baoDuongThietBi.viec.dangDung')}
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

export default ViecEditor;
