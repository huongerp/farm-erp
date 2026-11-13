import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Edit, Plus, Power } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { tinhDinhMucPhen } from '../core/dinh-muc';
import type { HoPhen } from '../core/types';
import { useDoiTrangThaiHo, useHoList } from '../hooks/use-nhat-ky-pha-phen';
import { formatKg } from '../utils/hien-thi';
import HoFormDialog from './HoFormDialog';

interface Props {
  branches: Branch[];
  viewAll: boolean;
  allowedBranchIds: string[];
  scopeLoading: boolean;
  /** canAdmin || canUpdate — chỉ khi đó mới hiện nút thêm / sửa / ngừng dùng. */
  canManage: boolean;
}

const iconBtn = 'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30';

/** Tab «Cài đặt hồ»: hồ pha phèn theo NSC — cơ sở tính định mức phèn của nhật ký. */
const CaiDatHoTab: React.FC<Props> = ({ branches, viewAll, allowedBranchIds, scopeLoading, canManage }) => {
  const { t } = useTranslation();
  const { data: hoList = [], isLoading } = useHoList(viewAll, allowedBranchIds, !scopeLoading);
  const doiTrangThai = useDoiTrangThaiHo();
  const [form, setForm] = useState<{ item: HoPhen | null; idChiNhanh?: string } | null>(null);

  const nhom = useMemo(() => {
    const m = new Map<string, { ten: string; ho: HoPhen[] }>();
    for (const h of hoList) {
      const g = m.get(h.id_chi_nhanh) ?? { ten: h.ten_chi_nhanh ?? h.id_chi_nhanh, ho: [] };
      g.ho.push(h);
      m.set(h.id_chi_nhanh, g);
    }
    return [...m.entries()].map(([id, g]) => ({ id, ...g, dm: tinhDinhMucPhen(g.ho) }));
  }, [hoList]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground m-0 min-w-0 flex-1">{t('nkpp.ho.gioiThieu')}</p>
        {canManage && (
          <Button size="sm" className="h-9" onClick={() => setForm({ item: null })}>
            <Plus size={14} className="mr-1.5" />
            {t('nkpp.ho.them')}
          </Button>
        )}
      </div>

      {isLoading || scopeLoading ? (
        <p className="text-sm text-muted-foreground">{t('nkpp.loading')}</p>
      ) : nhom.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('nkpp.ho.empty')}</p>
      ) : (
        nhom.map((g) => (
          <section key={g.id} className="rounded-xl border border-border overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-3 py-2">
              <h3 className="m-0 text-sm font-semibold">{g.ten}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {t('nkpp.ho.dinhMucNsc', { lan1: formatKg(g.dm.lan1), moiLan: formatKg(g.dm.moiLanSau), tong: formatKg(g.dm.tongNgay) })}
              </span>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left font-medium px-3 py-1.5">{t('nkpp.ho.tenHo')}</th>
                    <th className="text-right font-medium px-3 py-1.5">{t('nkpp.ho.theTichXan')}</th>
                    <th className="text-right font-medium px-3 py-1.5">{t('nkpp.ho.theTichTia')}</th>
                    <th className="text-right font-medium px-3 py-1.5">{t('nkpp.ho.boSungXan')}</th>
                    <th className="text-right font-medium px-3 py-1.5">{t('nkpp.ho.boSungTia')}</th>
                    <th className="text-right font-medium px-3 py-1.5">{t('nkpp.ho.tyLeGLit')}</th>
                    <th className="text-right font-medium px-3 py-1.5">{t('nkpp.ho.tyLeDauCa')}</th>
                    <th className="text-left font-medium px-3 py-1.5">{t('nkpp.ho.trangThai')}</th>
                    {canManage && <th className="w-20" />}
                  </tr>
                </thead>
                <tbody>
                  {g.ho.map((h) => (
                    <tr key={h.id} className={cn('border-b border-border/50 last:border-0', !h.dang_dung && 'opacity-50')}>
                      <td className="px-3 py-1.5 font-medium">{h.ten_ho}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatKg(h.the_tich_xan_m3)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatKg(h.the_tich_tia_m3)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatKg(h.bo_sung_xan_kg)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatKg(h.bo_sung_tia_kg)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatKg(h.ty_le_g_lit)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatKg(h.ty_le_dau_ca)}</td>
                      <td className="px-3 py-1.5">{t(h.dang_dung ? 'nkpp.ho.dangDung' : 'nkpp.ho.ngungDung')}</td>
                      {canManage && (
                        <td className="px-2 py-1 text-right whitespace-nowrap">
                          <button
                            type="button"
                            className={cn(iconBtn, 'text-primary')}
                            onClick={() => setForm({ item: h })}
                            aria-label={t('common.edit')}
                            title={t('common.edit')}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className={cn(iconBtn, h.dang_dung ? 'text-rose-500' : 'text-emerald-600')}
                            disabled={doiTrangThai.isPending}
                            onClick={() => doiTrangThai.mutate({ id: h.id, dangDung: !h.dang_dung })}
                            aria-label={t(h.dang_dung ? 'nkpp.ho.ngungDungNut' : 'nkpp.ho.batLaiNut')}
                            title={t(h.dang_dung ? 'nkpp.ho.ngungDungNut' : 'nkpp.ho.batLaiNut')}
                          >
                            <Power size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {canManage && (
              <div className="px-3 py-2 border-t border-border">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  onClick={() => setForm({ item: null, idChiNhanh: g.id })}
                >
                  <Plus size={12} />
                  {t('nkpp.ho.themVaoNsc')}
                </button>
              </div>
            )}
          </section>
        ))
      )}

      <AnimatePresence>
        {form && (
          <HoFormDialog
            branches={branches}
            viewAll={viewAll}
            allowedBranchIds={allowedBranchIds}
            initialData={form.item}
            idChiNhanhMacDinh={form.idChiNhanh}
            onClose={() => setForm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaiDatHoTab;
