/** Tab «Định mức thuốc»: thuốc + nồng độ + đơn vị theo từng NSC; thêm / sửa / ngừng dùng (không xoá). */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Edit, Plus, Power, X } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Combobox from '../../../../components/ui/Combobox';
import { TRANG_THAI } from '../../../../lib/constants';
import { cn } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import type { EmployeeBranchModuleScope } from '../../../he-thong/nhan-vien/hooks/use-employee-branch-module-scope';
import { locHangHoaChoChon } from '../../hang-hoa-phan-thuoc/core/trang-thai';
import { DON_VI_NONG_DO, DON_VI_NONG_DO_MAC_DINH } from '../core/constants';
import { dinhMucFormSchema, type DinhMucFormValues } from '../core/schema';
import { formatSo } from '../core/so';
import type { DinhMucThuoc } from '../core/types';
import { useDinhMucThuoc, useDoiDangDungDinhMuc, useHangHoaThuoc, useLuuDinhMuc } from '../hooks/use-nhat-ky-phun-cui';

interface Props {
  viewScope: EmployeeBranchModuleScope;
  /** Chi nhánh đã lọc theo phạm vi xem. */
  branches: Branch[];
  /** canAdmin || canUpdate — chỉ khi đó mới hiện nút thêm / sửa / ngừng dùng. */
  canEdit: boolean;
}

const iconBtn = 'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent';

const DinhMucTab: React.FC<Props> = ({ viewScope, branches, canEdit }) => {
  const { t } = useTranslation();
  const [idChiNhanhLoc, setIdChiNhanhLoc] = useState('');
  /** null = đóng; 'moi' = thêm; còn lại = sửa dòng này. */
  const [dangSua, setDangSua] = useState<DinhMucThuoc | 'moi' | null>(null);
  const [form, setForm] = useState<DinhMucFormValues | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const { data: dinhMuc = [], isLoading } = useDinhMucThuoc(
    idChiNhanhLoc || null,
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading
  );
  const { data: hangHoa = [] } = useHangHoaThuoc();
  const dongForm = () => {
    setDangSua(null);
    setForm(null);
    setLoi(null);
  };
  const luu = useLuuDinhMuc(dongForm);
  const doiDangDung = useDoiDangDungDinhMuc();

  const branchOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
        .map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
    [branches]
  );
  const thuocOptions = useMemo(
    () =>
      locHangHoaChoChon(hangHoa, dangSua && dangSua !== 'moi' ? [dangSua.id_hang_hoa] : []).map((h) => ({
        value: h.id,
        label: h.ten_hang_hoa,
        subLabel: [h.ma_hang_hoa, h.dvt].filter(Boolean).join(' · '),
      })),
    [hangHoa, dangSua]
  );
  const donViOptions = DON_VI_NONG_DO.map((d) => ({ value: d, label: d }));

  const batDauThem = () => {
    setDangSua('moi');
    setLoi(null);
    setForm({
      id_chi_nhanh: idChiNhanhLoc || (branchOptions.length === 1 ? branchOptions[0].value : ''),
      id_hang_hoa: '',
      nong_do: '',
      don_vi: DON_VI_NONG_DO_MAC_DINH,
      dang_dung: true,
      ghi_chu: '',
    });
  };

  const batDauSua = (d: DinhMucThuoc) => {
    setDangSua(d);
    setLoi(null);
    setForm({
      id_chi_nhanh: d.id_chi_nhanh,
      id_hang_hoa: d.id_hang_hoa,
      nong_do: String(d.nong_do),
      don_vi: d.don_vi,
      dang_dung: d.dang_dung,
      ghi_chu: d.ghi_chu ?? '',
    });
  };

  const capNhat = (patch: Partial<DinhMucFormValues>) => setForm((f) => (f ? { ...f, ...patch } : f));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !dangSua) return;
    const kq = dinhMucFormSchema.safeParse(form);
    if (!kq.success) {
      setLoi(kq.error.issues[0]?.message ?? t('nkpc.validation.soKhongHopLe'));
      return;
    }
    setLoi(null);
    luu.mutate({ id: dangSua === 'moi' ? null : dangSua.id, data: kq.data });
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-3 rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground m-0">{t('nkpc.dinhMuc.gioiThieu')}</p>

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-72">
          <Select
            label={t('nkpc.col.chiNhanh')}
            value={idChiNhanhLoc}
            onChange={(e) => setIdChiNhanhLoc(e.target.value)}
            options={branchOptions}
            placeholder={t('nkpc.dinhMuc.tatCaNsc')}
          />
        </div>
        {canEdit && !dangSua && (
          <Button size="sm" className="h-9" onClick={batDauThem}>
            <Plus size={14} className="mr-1.5" />
            {t('nkpc.dinhMuc.them')}
          </Button>
        )}
      </div>

      {canEdit && dangSua && form && (
        <form onSubmit={submit} className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Combobox
              label={t('nkpc.col.chiNhanh')}
              required
              options={branchOptions}
              value={form.id_chi_nhanh || null}
              disabled={dangSua !== 'moi'}
              dropdownInPortal
              onChange={(v: string | number | null) => capNhat({ id_chi_nhanh: v != null ? String(v) : '' })}
            />
            <Combobox
              label={t('nkpc.lan.thuoc')}
              required
              options={thuocOptions}
              value={form.id_hang_hoa || null}
              disabled={dangSua !== 'moi'}
              dropdownInPortal
              onChange={(v: string | number | null) => capNhat({ id_hang_hoa: v != null ? String(v) : '' })}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
            <Input
              label={t('nkpc.lan.nongDo')}
              required
              inputMode="decimal"
              value={form.nong_do}
              onChange={(e) => capNhat({ nong_do: e.target.value })}
            />
            <Select
              label={t('nkpc.lan.donVi')}
              value={form.don_vi}
              onChange={(e) => capNhat({ don_vi: e.target.value as DinhMucFormValues['don_vi'] })}
              options={donViOptions}
            />
            <div className="col-span-2">
              <Input label={t('nkpc.col.ghiChu')} value={form.ghi_chu} onChange={(e) => capNhat({ ghi_chu: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none h-9">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={form.dang_dung}
                onChange={(e) => capNhat({ dang_dung: e.target.checked })}
              />
              {t('nkpc.dinhMuc.dangDung')}
            </label>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" className="h-9" onClick={dongForm}>
                <X size={14} className="mr-1" />
                {t('common.cancel')}
              </Button>
              <Button type="submit" size="sm" className="h-9" disabled={luu.isPending}>
                <Check size={14} className="mr-1" />
                {t('common.save')}
              </Button>
            </div>
          </div>
          {loi && <p className="text-xs text-destructive m-0">{loi}</p>}
        </form>
      )}

      {isLoading || viewScope.isLoading ? (
        <p className="text-sm text-muted-foreground">{t('nkpc.loading')}</p>
      ) : dinhMuc.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('nkpc.dinhMuc.empty')}</p>
      ) : (
        <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border">
          {dinhMuc.map((d) => (
            <li key={d.id} className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2', !d.dang_dung && 'opacity-50')}>
              <div className="min-w-0 flex-1 basis-48">
                <div className="text-sm font-medium truncate">{d.ten_hang_hoa || '—'}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {[d.ma_hang_hoa, idChiNhanhLoc ? null : d.ten_chi_nhanh].filter(Boolean).join(' · ')}
                </div>
              </div>
              <div className="text-sm tabular-nums font-semibold">
                {formatSo(d.nong_do)} {d.don_vi}
              </div>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
                  d.dang_dung
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-muted text-muted-foreground border-border'
                )}
              >
                {t(d.dang_dung ? 'nkpc.dinhMuc.dangDung' : 'nkpc.dinhMuc.ngungDung')}
              </span>
              {d.ghi_chu && <div className="basis-full sm:basis-auto sm:max-w-[16rem] text-xs text-muted-foreground truncate">{d.ghi_chu}</div>}
              {canEdit && (
                <div className="flex items-center gap-0.5 ml-auto">
                  <button
                    type="button"
                    className={cn(iconBtn, 'text-primary')}
                    onClick={() => batDauSua(d)}
                    aria-label={t('common.edit')}
                    title={t('common.edit')}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    type="button"
                    className={cn(iconBtn, d.dang_dung ? 'text-rose-500' : 'text-emerald-600')}
                    disabled={doiDangDung.isPending}
                    onClick={() => doiDangDung.mutate({ id: d.id, dangDung: !d.dang_dung })}
                    aria-label={t(d.dang_dung ? 'nkpc.dinhMuc.ngungDungNut' : 'nkpc.dinhMuc.batDungNut')}
                    title={t(d.dang_dung ? 'nkpc.dinhMuc.ngungDungNut' : 'nkpc.dinhMuc.batDungNut')}
                  >
                    <Power size={14} />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DinhMucTab;
