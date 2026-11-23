import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Edit, Info, Search, UserRoundPlus, Users } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Combobox from '../../../../components/ui/Combobox';
import { cn } from '../../../../lib/utils';
import { TRANG_THAI } from '../../../../lib/constants';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { matchesSearch } from '../../../../lib/search-text';
import type { Branch } from '../../../he-thong/chi-nhanh/core/types';
import { LOAI_CHUYEN_CODES, type LoaiChuyen, type VarNhanVienSoChe } from '../core/types';
import { useNhanVienSoChe, useUpdateNhanVienSoChe, useThemViTriNeuMoi, useViTriSoChe } from '../hooks/use-bao-cao-nhan-cong';
import { gopViTriOptions } from '../core/vi-tri-danh-muc';
import { SO_NHOM_TOI_DA } from '../core/tong-hop-nhom';
import { useBaoCaoNhanCongPermissions } from '../hooks/use-bao-cao-nhan-cong-permissions';

/** Phần sửa được của thiết lập — tên / trạng thái thuộc Danh sách nhân viên. */
type Patch = Pick<VarNhanVienSoChe, 'vi_tri' | 'so_nhom' | 'loai_chuyen'>;

const SuaNguoi: React.FC<{
  nv: VarNhanVienSoChe;
  viTriOptions: { value: string; label: string }[];
  nhomOptions: { value: number; label: string }[];
  chuyenOptions: { value: string; label: string }[];
  onDone: () => void;
}> = ({ nv, viTriOptions, nhomOptions, chuyenOptions, onDone }) => {
  const { t } = useTranslation();
  const luu = useUpdateNhanVienSoChe();
  const themViTriNeuMoi = useThemViTriNeuMoi();
  const { canThemViTri } = useBaoCaoNhanCongPermissions();
  const [v, setV] = useState<Patch>({
    vi_tri: nv.vi_tri,
    so_nhom: nv.so_nhom,
    loai_chuyen: nv.loai_chuyen,
  });

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-sm font-medium truncate">{nv.ho_ten}</span>
        {!nv.dang_dung && <span className="text-caption text-muted-foreground shrink-0">{t('baoCaoNhanCong.dmNv.daNghi')}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_7rem_minmax(0,1fr)] gap-3">
        <Combobox
          label={t('baoCaoNhanCong.nv.viTri')}
          options={viTriOptions}
          value={v.vi_tri ?? ''}
          onChange={(x) => {
            const viTri = x ? String(x).trim() : null;
            setV({ ...v, vi_tri: viTri });
            themViTriNeuMoi(viTri);
          }}
          creatable={canThemViTri}
          creatableLabel={t('baoCaoNhanCong.nv.themViTriMoi')}
          dropdownInPortal
        />
        <Combobox
          label={t('baoCaoNhanCong.dmNv.nhomMacDinh')}
          labelEnd={
            <span className="text-muted-foreground cursor-help" title={t('baoCaoNhanCong.dmNv.nhomMacDinhHint')}>
              <Info size={13} />
            </span>
          }
          options={nhomOptions}
          value={v.so_nhom ?? 0}
          onChange={(x) => setV({ ...v, so_nhom: Number(x) || null })}
          placeholder={t('baoCaoNhanCong.nv.nhomTrong')}
          searchable={false}
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
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={luu.isPending}
          onClick={() =>
            luu.mutate({ id: nv.id, id_nv: nv.id_nv ?? null, id_chi_nhanh: nv.id_chi_nhanh, patch: v }, { onSuccess: onDone })
          }
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
 * Thiết lập nhân viên sơ chế theo chi nhánh: danh sách người lấy từ module Danh sách nhân viên
 * (thêm / đổi tên / nghỉ việc ở đó); ở đây chỉ đặt vị trí / nhóm / chuyền mặc định cho từng người.
 * Người đã nghỉ hiện mờ kèm nhãn «Đã nghỉ» — phiếu cũ vẫn giữ nguyên tên.
 */
const DanhMucNhanVienDialog: React.FC<Props> = ({ branches, idChiNhanhMacDinh = '', onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [idCn, setIdCn] = useState(idChiNhanhMacDinh);
  const [tuKhoa, setTuKhoa] = useState('');
  const [dangSua, setDangSua] = useState<string | null>(null);
  const { data: ds = [], isLoading } = useNhanVienSoChe(idCn);
  const { data: viTriDanhMuc = [] } = useViTriSoChe();
  /** Người chưa có dòng thiết lập thì `id` null — vẫn phải sửa được (lưu sẽ insert). */
  const khoaNv = (nv: VarNhanVienSoChe) => nv.id ?? `nv:${nv.id_nv}`;

  /** Lọc tại client: danh mục của một chi nhánh vốn nhỏ, đã tải sẵn để gợi ý tên. */
  const dsLoc = useMemo(
    () => ds.filter((nv) => matchesSearch([nv.ho_ten, nv.vi_tri], tuKhoa)),
    [ds, tuKhoa]
  );

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
  const viTriOptions = useMemo(
    () => gopViTriOptions(viTriDanhMuc, ds.map((nv) => nv.vi_tri)).map((x) => ({ value: x, label: x })),
    [viTriDanhMuc, ds]
  );
  /** «—» (0 = chưa chia nhóm) rồi Nhóm 1…9. */
  const nhomOptions = useMemo(
    () => [
      { value: 0, label: t('baoCaoNhanCong.nv.nhomTrong') },
      ...Array.from({ length: SO_NHOM_TOI_DA }, (_, i) => ({ value: i + 1, label: t('baoCaoNhanCong.nv.nhomSo', { n: i + 1 }) })),
    ],
    [t]
  );

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
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="w-full sm:w-72">
            <Combobox
              label={t('baoCaoNhanCong.form.branch')}
              options={chiNhanhOptions}
              value={idCn}
              onChange={(v) => {
                setIdCn(v ? String(v) : '');
                setTuKhoa('');
                setDangSua(null);
              }}
              dropdownInPortal
            />
          </div>
          {idCn && (
            <div className="w-full sm:w-72">
              <Input
                label={t('baoCaoNhanCong.dmNv.timTen')}
                icon={<Search size={14} />}
                value={tuKhoa}
                onChange={(e) => setTuKhoa(e.target.value)}
                placeholder={t('baoCaoNhanCong.dmNv.timTenPlaceholder')}
              />
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 self-start sm:self-auto sm:ml-auto"
            onClick={() => navigate('/nhan-vien')}
            title={t('baoCaoNhanCong.dmNv.moDanhSachNhanVien')}
          >
            <UserRoundPlus size={14} />
            {t('baoCaoNhanCong.dmNv.themNguoi')}
          </Button>
        </div>
        {!idCn ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.nv.chonChiNhanhTruoc')}</p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.loading')}</p>
        ) : ds.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.dmNv.empty')}</p>
        ) : dsLoc.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoNhanCong.dmNv.khongTimThay')}</p>
        ) : (
          <ul className="m-0 p-0 list-none divide-y divide-border rounded-xl border border-border">
            {dsLoc.map((nv) =>
              dangSua === khoaNv(nv) ? (
                <li key={khoaNv(nv)} className="p-2">
                  <SuaNguoi nv={nv} viTriOptions={viTriOptions} nhomOptions={nhomOptions} chuyenOptions={chuyenOptions} onDone={() => setDangSua(null)} />
                </li>
              ) : (
                <li key={khoaNv(nv)} className={cn('flex items-center gap-3 px-3 py-2', !nv.dang_dung && 'opacity-50')}>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{nv.ho_ten}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[
                        nv.vi_tri,
                        nv.so_nhom ? t('baoCaoNhanCong.nv.nhomSo', { n: nv.so_nhom }) : null,
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
                    onClick={() => setDangSua(khoaNv(nv))}
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
