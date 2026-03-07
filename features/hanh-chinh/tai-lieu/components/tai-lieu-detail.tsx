import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Edit, Trash2, Power, Shield, Pin, PinOff } from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '../../../../components/shared/GenericDrawer';
import DetailSection from '../../../../components/shared/DetailSection';
import DetailField from '../../../../components/shared/DetailField';
import DetailToolbar, { DetailToolbarAction } from '../../../../components/shared/DetailToolbar';
import Button from '../../../../components/ui/Button';
import Select from '../../../../components/ui/Select';
import PositionPermissionPicker from '../../../../components/shared/PositionPermissionPicker';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '../../../../lib/button-labels';
import { formatDate, formatDateTimeShort } from '../../../../lib/utils';
import { getHuongLabel } from '../core/constants';
import { TRANG_THAI_MAU_DEFAULT } from '../../thiet-lap-tai-lieu/core/constants';
import { useUpdateTaiLieu, useUpdateTaiLieuPhanQuyen } from '../hooks/use-tai-lieu';
import { useTrangThaiTaiLieuList } from '../../thiet-lap-tai-lieu/hooks/use-trang-thai-tai-lieu';
import { useHoSoByTaiLieuId } from '../../luu-tru-ho-so/hooks/use-ho-so';
import { usePositions } from '../../../he-thong/chuc-vu/hooks/use-chuc-vu';
import { useConfirmStore } from '../../../../store/useConfirmStore';
import type { TaiLieu } from '../core/types';

interface Props {
  data: TaiLieu;
  onClose: () => void;
  onEdit: (item: TaiLieu) => void;
  onDelete?: (id: string) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

const TaiLieuDetail: React.FC<Props> = ({ data, onClose, onEdit, onDelete, isPinned, onTogglePin }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const updateMutation = useUpdateTaiLieu(() => {});
  const updatePhanQuyenMutation = useUpdateTaiLieuPhanQuyen(() => setShowPhanQuyen(false));
  const { data: trangThaiList = [] } = useTrangThaiTaiLieuList();
  const { data: hoSoList = [] } = useHoSoByTaiLieuId(data.id);
  const { data: positionsList = [] } = usePositions();
  const [showPhanQuyen, setShowPhanQuyen] = useState(false);

  const handleChangeStatus = () => {
    let selectedId = data.id_trang_thai;
    confirm({
      title: t('taiLieu.detail.changeStatusTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm text-muted-foreground">{t('taiLieu.detail.changeStatusMessage')}</p>
          <Select
            defaultValue={data.id_trang_thai}
            options={trangThaiList.map((tt) => ({ label: tt.ten, value: tt.id }))}
            onChange={(e) => { selectedId = e.target.value; }}
          />
        </div>
      ),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await updateMutation.mutateAsync({
          id: data.id,
          data: {
            huong: data.huong,
            id_loai: data.id_loai,
            id_nhom_tai_lieu: data.id_nhom_tai_lieu,
            id_trang_thai: selectedId,
            trich_yeu: data.trich_yeu,
            so_den: data.so_den,
            ngay_den: data.ngay_den,
            noi_gui: data.noi_gui,
            so_di: data.so_di,
            ngay_ky: data.ngay_ky,
            noi_nhan: data.noi_nhan,
            id_phong_ban: data.id_phong_ban,
            ghi_chu: data.ghi_chu,
          },
        });
      },
    });
  };

  const handlePhanQuyen = () => setShowPhanQuyen(true);

  const handleSavePhanQuyen = (id_chuc_vu_xem: string[]) => {
    updatePhanQuyenMutation.mutate({ id: data.id, id_chuc_vu_xem });
  };

  const toolbarActions: DetailToolbarAction[] = [
    {
      label: t('taiLieu.detail.changeStatus'),
      icon: <Power size={16} />,
      onClick: handleChangeStatus,
      variant: 'info',
    },
    {
      label: t('taiLieu.detail.phanQuyen'),
      icon: <Shield size={16} />,
      onClick: handlePhanQuyen,
      variant: 'secondary',
    },
    ...(onTogglePin
      ? [{
          label: isPinned ? t('taiLieu.unpin') : t('taiLieu.pin'),
          icon: isPinned ? <PinOff size={16} /> : <Pin size={16} />,
          onClick: onTogglePin,
          variant: 'warning' as const,
        }]
      : []),
  ];

  const renderFooter = (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            onEdit(data);
            onClose();
          }}
          className="bg-primary text-white shadow-lg hover:bg-primary/90"
        >
          <Edit size={16} className="mr-2" /> {BTN_EDIT()}
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            onClick={() => {
              onDelete(data.id);
              onClose();
            }}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
          >
            <Trash2 size={16} className="mr-2" /> {BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
    <GenericDrawer
      title={data.trich_yeu || t('taiLieu.detail.title')}
      icon={<FileText size={20} />}
      onClose={onClose}
      footer={renderFooter}
      maxWidthClass={DRAWER_WIDTH_DETAIL}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <FileText size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight line-clamp-2">{data.trich_yeu}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                  data.huong === 'noi_bo'
                    ? 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700'
                    : data.huong === 'den'
                      ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
                }`}
              >
                {getHuongLabel(data.huong, t)}
              </span>
              {data.ten_trang_thai && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-border"
                  style={{
                    backgroundColor: `${data.mau_trang_thai || TRANG_THAI_MAU_DEFAULT}20`,
                    color: data.mau_trang_thai || TRANG_THAI_MAU_DEFAULT,
                    borderColor: `${data.mau_trang_thai || TRANG_THAI_MAU_DEFAULT}40`,
                  }}
                >
                  {data.ten_trang_thai}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{data.ten_loai || data.ma_loai || '—'}</span>
            </div>
          </div>
        </div>

        <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />

        <DetailSection title={t('taiLieu.form.basicInfo')} icon={<FileText size={14} />} variant="primary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailField label={t('taiLieu.form.maSo')} value={data.ma_so || '—'} />
            <DetailField label={t('taiLieu.form.trichYeu')} value={data.trich_yeu} />
            <DetailField label={t('taiLieu.store.huongCol')} value={getHuongLabel(data.huong, t)} />
            <DetailField label={t('taiLieu.store.loaiCol')} value={data.ten_loai || data.ma_loai || '—'} />
            <DetailField label={t('taiLieu.store.nhomCol')} value={data.ten_nhom_tai_lieu || '—'} />
            <DetailField
              label={t('taiLieu.store.trangThaiCol')}
              value={
                data.ten_trang_thai ? (
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-border"
                    style={{
                      backgroundColor: `${data.mau_trang_thai || TRANG_THAI_MAU_DEFAULT}20`,
                      color: data.mau_trang_thai || TRANG_THAI_MAU_DEFAULT,
                      borderColor: `${data.mau_trang_thai || TRANG_THAI_MAU_DEFAULT}40`,
                    }}
                  >
                    {data.ten_trang_thai}
                  </span>
                ) : (
                  '—'
                )
              }
            />
            <DetailField label={t('taiLieu.store.phongQuanLyCol')} value={data.ten_phong_ban || '—'} />
            <DetailField
              label={t('taiLieu.detail.phanQuyenLabel')}
              value={
                !data.id_chuc_vu_xem?.length
                  ? t('taiLieu.detail.phanQuyenEmpty')
                  : (() => {
                      const names = (data.id_chuc_vu_xem ?? [])
                        .map((id) => positionsList.find((p) => p.id === id)?.ten_chuc_vu)
                        .filter(Boolean) as string[];
                      if (names.length === 0) return t('taiLieu.detail.phanQuyenEmpty');
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {names.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      );
                    })()
              }
            />
            {data.huong !== 'noi_bo' && (
              <>
                <DetailField label={t('taiLieu.form.soDen')} value={data.so_den || '—'} />
                <DetailField label={t('taiLieu.form.ngayDen')} value={data.ngay_den ? formatDate(data.ngay_den) : '—'} />
                <DetailField label={t('taiLieu.form.noiGui')} value={data.noi_gui || '—'} />
                <DetailField label={t('taiLieu.form.soDi')} value={data.so_di || '—'} />
                <DetailField label={t('taiLieu.form.ngayKy')} value={data.ngay_ky ? formatDate(data.ngay_ky) : '—'} />
                <DetailField label={t('taiLieu.form.noiNhan')} value={data.noi_nhan || '—'} />
              </>
            )}
            {data.ghi_chu ? (
              <div className="col-span-1 sm:col-span-2">
                <DetailField label={t('taiLieu.form.ghiChu')} value={data.ghi_chu} />
              </div>
            ) : null}
            <DetailField label={t('taiLieu.store.updatedCol')} value={formatDateTimeShort(data.tg_cap_nhat)} />
          </div>
        </DetailSection>

        {hoSoList.length > 0 && (
          <DetailSection title={t('taiLieu.detail.sectionHoSo')} icon={<FileText size={14} />} variant="primary">
            <div className="space-y-2">
              {hoSoList.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-muted/50 border border-border">
                  <div>
                    <span className="font-medium text-sm text-foreground">{h.ma_ho_so}</span>
                    <span className="text-sm text-muted-foreground ml-2">{h.ten_ho_so}</span>
                  </div>
                  {h.thoi_han_luu_tru && (
                    <span className="text-xs text-muted-foreground">{formatDate(h.thoi_han_luu_tru)}</span>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        )}
      </div>
    </GenericDrawer>
    {showPhanQuyen && (
      <PositionPermissionPicker
        open={showPhanQuyen}
        onClose={() => setShowPhanQuyen(false)}
        positions={positionsList.filter((p) => p.trang_thai === 1)}
        selectedIds={data.id_chuc_vu_xem ?? []}
        onSave={handleSavePhanQuyen}
        title={t('taiLieu.detail.phanQuyenTitle')}
        activeOnly={true}
      />
    )}
    </>
  );
};

export default TaiLieuDetail;
