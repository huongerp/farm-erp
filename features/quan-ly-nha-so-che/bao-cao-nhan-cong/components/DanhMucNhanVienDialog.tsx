import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Users } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import { cn } from '../../../../lib/utils';
import { TRANG_THAI } from '../../../../lib/constants';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { LOAI_CHUYEN_CODES, type LoaiChuyen, type VarNhanVienSoChe } from '../core/types';
import { useNhanVienSoChe, useUpdateNhanVienSoChe } from '../hooks/use-bao-cao-nhan-cong';
import { gonTen, tenKhongTrung } from '../../danh-gia-dau-vao/core/chuan-hoa-ten';

type Patch = Pick<VarNhanVienSoChe, 'ho_ten' | 'vi_tri' | 'loai_chuyen' | 'dang_dung'>;

const SuaNguoi: React.FC<{
  nv: VarNhanVienSoChe;
  viTriOptions: { value: string; label: string }[];
  chuyenOptions: { value: string; label: string }[];
  onDone: () => void;
}> = ({ nv, viTriOptions, chuyenOptions, onDone }) => {
  const { t } = useTranslation();
  const luu = useUpdateNhanVienSoChe();
  const [v, setV] = useState<Patch>({ ho_ten: nv.ho_ten, vi_tri: nv.vi_tri, loai_chuyen: nv.loai_chuyen, dang_dung: nv.dang_dung });
  const tenTrong = !gonTen(v.ho_ten);

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label={t('baoCaoNhanCong.nv.hoTen')}
          required
          value={v.ho_ten}
          onChange={(e) => setV({ ...v, ho_ten: e.target.value })}
          error={tenTrong ? t('baoCaoNhanCong.validation.nvTenRequired') : undefined}
        />
        <Combobox
          label={t('baoCaoNhanCong.nv.viTri')}
          options={viTriOptions}
          value={v.vi_tri ?? ''}
          onChange={(x) => setV({ ...v, vi_tri: x ? String(x).trim() : null })}
          creatable
          creatableLabel={t('baoCaoNhanCong.nv.dungTenMoi')}
          dropdownInPortal
        />
        <Combobox
          label={t('baoCaoNhanCong.dmNv.chuyen')}
          options={chuyenOptions}
          value={v.loai_chuyen ?? ''}
          onChange={(x) => setV({ ...v, loai_chuyen: (x ? String(x) : null) as LoaiChuyen | null })}
          dropdownInPortal
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={v.dang_dung}
          onChange={(e) => setV({ ...v, dang_dung: e.target.checked })}
        />
        {t('baoCaoNhanCong.dmNv.dangDung')}
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={tenTrong || luu.isPending}
          onClick={() => luu.mutate({ id: nv.id, patch: v }, { onSuccess: onDone })}
        >
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
};

interface Props {
  branches: Branch[];
  /** Chi nhánh mở sẵn (chi nhánh người dùng hay nhập). */
  idChiNhanhMacDinh?: string;
  onClose: () => void;
}

/**
 * Danh mục nhân viên sơ chế theo chi nhánh: tên tự thêm khi lưu phiếu; ở đây sửa tên / vị trí /
 * chuyền mặc định, người nghỉ thì bỏ «Đang dùng» (ẩn khỏi gợi ý, phiếu cũ giữ nguyên tên).
 */
const DanhMucNhanVienDialog: React.FC<Props> = ({ branches, idChiNhanhMacDinh = '', onClose }) => {
  const { t } = useTranslation();
  const [idCn, setIdCn] = useState(idChiNhanhMacDinh);
  const [dangSua, setDangSua] = useState<string | null>(null);
  const { data: ds = [], isLoading } = useNhanVienSoChe(idCn);

  const chiNhanhOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
        .map((b) => ({ value: String(b.id), label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
    [branches]
  );
  const chuyenOptions = useMemo(
    () => LOAI_CHUYEN_CODES.map((c) => ({ value: c, label: t(`baoCaoNhanCong.chuyen.${c}`) })),
    [t]
  );
  const viTriOptions = useMemo(() => tenKhongTrung(ds.map((nv) => nv.vi_tri)).map((x) => ({ value: x, label: x })), [ds]);

  return (
    <GenericDrawer
      title={t('baoCaoNhanCong.dmNv.title')}
      subtitle={t('baoCaoNhanCong.dmNv.subtitle')}
      icon={<Users className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <div className="flex justify-end w-full">
          <Button type="button" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="w-full sm:w-72">
          <Combobox
            label={t('baoCaoNhanCong.form.branch')}
            options={chiNhanhOptions}
            value={idCn}
            onChange={(v) => {
              setIdCn(v ? String(v) : '');
              setDangSua(null);
            }}
            dropdownInPortal
          />
        </div>
        {!idCn ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.nv.chonChiNhanhTruoc')}</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.loading')}</p>
        ) : ds.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.dmNv.empty')}</p>
        ) : (
          <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border">
            {ds.map((nv) =>
              dangSua === nv.id ? (
                <li key={nv.id} className="p-2">
                  <SuaNguoi nv={nv} viTriOptions={viTriOptions} chuyenOptions={chuyenOptions} onDone={() => setDangSua(null)} />
                </li>
              ) : (
                <li key={nv.id} className={cn('flex items-center gap-3 px-3 py-2', !nv.dang_dung && 'opacity-50')}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{nv.ho_ten}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[
                        nv.vi_tri,
                        nv.loai_chuyen ? t(`baoCaoNhanCong.chuyen.${nv.loai_chuyen}`) : null,
                        nv.dang_dung ? null : t('baoCaoNhanCong.dmNv.daNghi'),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-md hover:bg-muted text-primary"
                    onClick={() => setDangSua(nv.id)}
                    aria-label={t('common.edit')}
                  >
                    <Edit size={14} />
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </GenericDrawer>
  );
};

export default DanhMucNhanVienDialog;
