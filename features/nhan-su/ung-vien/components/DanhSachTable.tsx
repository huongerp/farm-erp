import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, User } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort } from '../../../../lib/utils';
import { getTrangThaiBadgeClass, getNguonBadgeClass, TRANG_THAI_BADGE_BASE } from '../utils/trang-thai-badge';
import { getYearFromNgaySinh } from '../utils/format';
import type { UngVien } from '../core/types';
import { useUngVienStore } from '../store/useUngVienStore';

interface Props {
  data: UngVien[];
  isLoading: boolean;
  onEdit: (item: UngVien) => void;
  onDelete: (id: string) => void;
  onView?: (item: UngVien) => void;
}

const DanhSachTable: React.FC<Props> = ({ data, isLoading, onEdit, onDelete, onView }) => {
  const { t } = useTranslation();
  const {
    columns,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    sort,
    setSort,
  } = useUngVienStore();

  const renderCell = (colId: string, item: UngVien) => {
    switch (colId) {
      case 'ho_ten':
        return (
          <span className="font-medium text-sm text-foreground">{item.ho_ten}</span>
        );
      case 'email':
        return (
          <span className="text-sm text-foreground truncate max-w-[220px] block">
            {item.email}
          </span>
        );
      case 'so_dien_thoai':
        return (
          <span className="text-sm text-muted-foreground tabular-nums">{item.so_dien_thoai || t('ungVien.noValue')}</span>
        );
      case 'nam_sinh': {
        const year = getYearFromNgaySinh(item.ngay_sinh);
        return (
          <span className="text-sm text-muted-foreground tabular-nums">{year != null ? year : t('ungVien.noValue')}</span>
        );
      }
      case 'vi_tri_ung_tuyen':
        return (
          <span className="text-sm text-foreground">
            {item.ma_de_xuat ?? t('ungVien.noValue')}
            {item.ten_chuc_vu ? (
              <span className="text-muted-foreground text-xs block">{item.ten_chuc_vu}</span>
            ) : null}
          </span>
        );
      case 'trang_thai':
        return (
          <span
            className={`${TRANG_THAI_BADGE_BASE} ${getTrangThaiBadgeClass(item.id_trang_thai_ung_vien)}`}
          >
            {item.ten_trang_thai ?? t('ungVien.noValue')}
          </span>
        );
      case 'nguon':
        return item.id_kenh_tuyen_dung ? (
          <span
            className={`${TRANG_THAI_BADGE_BASE} ${getNguonBadgeClass(item.id_kenh_tuyen_dung)}`}
          >
            {item.ten_kenh_tuyen_dung ?? t('ungVien.noValue')}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{t('ungVien.noValue')}</span>
        );
      case 'ngay_phong_van_gan_nhat':
        return item.ngay_phong_van_gan_nhat ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.ngay_phong_van_gan_nhat)}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">{t('ungVien.noValue')}</span>
        );
      case 'ket_qua_phan_hoi_gan_nhat':
        return (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
            {item.ket_qua_phan_hoi_gan_nhat || t('ungVien.noValue')}
          </span>
        );
      case 'tg_tao':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_tao)}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center justify-center gap-1">
            <Tooltip content={t('common.edit')} placement="left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(item);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                aria-label={t('common.edit')}
              >
                <Edit size={16} />
              </button>
            </Tooltip>
            <Tooltip content={t('common.delete')} placement="left">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                aria-label={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: UngVien, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
          <User size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">
              {item.ho_ten}
            </h4>
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelection(item.id)}
                className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                aria-label={t('common.select')}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground truncate">{item.email}</span>
            <span
              className={`${TRANG_THAI_BADGE_BASE} ${getTrangThaiBadgeClass(item.id_trang_thai_ung_vien)}`}
            >
              {item.ten_trang_thai ?? t('ungVien.noValue')}
            </span>
            {item.id_kenh_tuyen_dung && (
              <span
                className={`${TRANG_THAI_BADGE_BASE} ${getNguonBadgeClass(item.id_kenh_tuyen_dung)}`}
              >
                {item.ten_kenh_tuyen_dung ?? t('ungVien.noValue')}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 px-3 py-2 bg-muted/30 rounded-lg mb-3 text-body-sm">
        <p className="text-muted-foreground mb-0.5">{t('ungVien.store.viTriCol')}</p>
        <p className="font-medium text-foreground">{item.ma_de_xuat ?? t('ungVien.noValue')} {item.ten_chuc_vu ? `· ${item.ten_chuc_vu}` : ''}</p>
      </div>
      <div className="flex justify-between items-center pt-2.5 border-t border-border">
        <span className="text-muted-foreground text-xs">
          {item.ngay_phong_van_gan_nhat ? formatDateTimeShort(item.ngay_phong_van_gan_nhat) : t('ungVien.noValue')} · {formatDateTimeShort(item.tg_tao)}
        </span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="p-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-lg transition-all active:scale-90"
            aria-label={t('common.edit')}
          >
            <Edit size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 rounded-lg transition-all active:scale-90"
            aria-label={t('common.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('common.loading')}
      selectedIds={selectedIds}
      onToggleSelection={toggleSelection}
      onToggleAll={toggleAllSelection}
      page={pagination.page}
      pageSize={pagination.pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      sort={sort}
      onSort={setSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      keyExtractor={(item) => item.id}
      onRowClick={(item) => onView?.(item)}
    />
  );
};

export default DanhSachTable;
