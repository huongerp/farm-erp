import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Edit, Plus, Trash2, X } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { cn } from '../../../../../lib/utils';
import { gonTen } from '../../../danh-gia-dau-vao/core/chuan-hoa-ten';
import type { VarViTriSoChe } from '../../core/types';
import { useLuuViTriSoChe, useViTriSoChe, useXoaViTriSoChe } from '../../hooks/use-bao-cao-nhan-cong';
import { useBaoCaoNhanCongPermissions } from '../../hooks/use-bao-cao-nhan-cong-permissions';

const iconBtn = 'p-1.5 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent';

/** Tab «Vị trí công việc»: danh mục dùng chung, sửa tại chỗ; ngừng dùng thay vì xoá khi phiếu cũ còn dùng. */
const ViTriTab: React.FC = () => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: ds = [], isLoading } = useViTriSoChe();
  const luu = useLuuViTriSoChe();
  const xoa = useXoaViTriSoChe();
  const { canThemViTri } = useBaoCaoNhanCongPermissions();

  const [tenMoi, setTenMoi] = useState('');
  const [dangSua, setDangSua] = useState<string | null>(null);
  const [tenSua, setTenSua] = useState('');
  const [dangDungSua, setDangDungSua] = useState(true);

  const them = () => {
    const ten = gonTen(tenMoi);
    if (!ten || !canThemViTri) return;
    luu.mutate({ id: null, data: { ten, dang_dung: true } }, { onSuccess: () => setTenMoi('') });
  };

  const batDauSua = (vt: VarViTriSoChe) => {
    setDangSua(vt.id);
    setTenSua(vt.ten);
    setDangDungSua(vt.dang_dung);
  };

  const luuSua = () => {
    const ten = gonTen(tenSua);
    if (!ten || !dangSua) return;
    luu.mutate({ id: dangSua, data: { ten, dang_dung: dangDungSua } }, { onSuccess: () => setDangSua(null) });
  };

  const xacNhanXoa = (vt: VarViTriSoChe) =>
    confirm({
      title: t('baoCaoNhanCong.caiDat.xoaTitle'),
      message: t('baoCaoNhanCong.caiDat.xoaViTriMessage', { ten: vt.ten }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        await xoa.mutateAsync(vt.id);
      },
    });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground m-0">{t('baoCaoNhanCong.caiDat.viTriGioiThieu')}</p>

      {canThemViTri ? (
        <form
          className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            them();
          }}
        >
          <div className="min-w-0 flex-1 sm:min-w-[16rem]">
            <Input
              label={t('baoCaoNhanCong.caiDat.tenViTri')}
              value={tenMoi}
              onChange={(e) => setTenMoi(e.target.value)}
              placeholder={t('baoCaoNhanCong.caiDat.tenViTri')}
            />
          </div>
          <Button type="submit" size="sm" disabled={!gonTen(tenMoi) || luu.isPending}>
            <Plus size={14} className="mr-1.5" />
            {t('baoCaoNhanCong.caiDat.themViTri')}
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground m-0 rounded-lg border border-border bg-muted/30 px-3 py-2">
          {t('baoCaoNhanCong.caiDat.chiCapCaoThemViTri')}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.loading')}</p>
      ) : ds.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.caiDat.viTriEmpty')}</p>
      ) : (
        <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border">
          {ds.map((vt) =>
            dangSua === vt.id ? (
              <li key={vt.id} className="p-2">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-0 flex-1 sm:min-w-[14rem]">
                    <Input
                      label={t('baoCaoNhanCong.caiDat.suaViTri')}
                      value={tenSua}
                      onChange={(e) => setTenSua(e.target.value)}
                    />
                  </div>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none h-9">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={dangDungSua}
                      onChange={(e) => setDangDungSua(e.target.checked)}
                    />
                    {t('baoCaoNhanCong.caiDat.dangDung')}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setDangSua(null)}>
                      <X size={14} className="mr-1" />
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-9"
                      disabled={!gonTen(tenSua) || luu.isPending}
                      onClick={luuSua}
                    >
                      <Check size={14} className="mr-1" />
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </li>
            ) : (
              <li key={vt.id} className={cn('flex items-center gap-2 px-3 py-2', !vt.dang_dung && 'opacity-50')}>
                <div className="min-w-0 flex-1 text-sm font-medium truncate">{vt.ten}</div>
                <button
                  type="button"
                  className={cn(iconBtn, 'text-primary')}
                  onClick={() => batDauSua(vt)}
                  aria-label={t('common.edit')}
                >
                  <Edit size={14} />
                </button>
                <button
                  type="button"
                  className={cn(iconBtn, 'text-rose-500')}
                  onClick={() => xacNhanXoa(vt)}
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
};

export default ViTriTab;
