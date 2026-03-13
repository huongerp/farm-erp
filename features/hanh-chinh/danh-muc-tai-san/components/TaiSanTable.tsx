import React from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, Building2, User } from 'lucide-react';
import GenericTable from '../../../../components/shared/GenericTable';
import { TaiSan } from '../core/types';
import { useDanhSachTaiSanStore } from '../store/useDanhSachTaiSanStore';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatDateTimeShort, formatCurrency, formatDate } from '../../../../lib/utils';

interface Props {
  data: TaiSan[];
  isLoading: boolean;
  onEdit: (item: TaiSan) => void;
  onDelete: (id: string) => void;
  onView?: (item: TaiSan) => void;
  showActions?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const TaiSanTable: React.FC<Props> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  canUpdate = true,
  canDelete = true,
}) => {
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
  } = useDanhSachTaiSanStore();

  const renderStatusBadge = (status: number) =>
    status === 1 ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
        {t('common.active')}
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {t('common.inactive')}
      </span>
    );

  const renderCell = (colId: string, item: TaiSan) => {
    switch (colId) {
      case 'hinh_anh':
        return item.hinh_anh ? (
          <img
            src={item.hinh_anh}
            alt=""
            className="h-10 w-10 rounded-lg object-cover border border-border shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted/80 border border-border flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-muted-foreground" />
          </div>
        );
      case 'ma_tai_san':
        return (
          <span className="font-mono text-sm font-medium text-foreground">{item.ma_tai_san}</span>
        );
      case 'ten_tai_san':
        return (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Building2 size={14} />
            </div>
            <span className="text-sm text-foreground">{item.ten_tai_san}</span>
          </div>
        );
      case 'ten_nhom':
        return item.id_nhom ? (
          <a
            href={`/hanh-chinh/thiet-lap-tai-san?openId=${encodeURIComponent(item.id_nhom)}&tab=nhomtaisan`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {item.ten_nhom || item.id_nhom}
          </a>
        ) : (
          <span className="text-sm text-foreground">—</span>
        );
      case 'ten_noi_luu':
        return item.id_noi_luu ? (
          <a
            href={`/hanh-chinh/noi-quan-ly?openId=${encodeURIComponent(item.id_noi_luu)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {item.ten_noi_luu || item.id_noi_luu}
          </a>
        ) : (
          <span className="text-sm text-foreground">—</span>
        );
      case 'ten_chi_nhanh':
        return (
          <span className="text-sm text-foreground">{item.ten_chi_nhanh ?? '—'}</span>
        );
      case 'ten_trang_thai':
        return item.id_trang_thai ? (
          <a
            href={`/hanh-chinh/thiet-lap-tai-san?openId=${encodeURIComponent(item.id_trang_thai)}&tab=trangthai`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-primary px-2 py-0.5 rounded-full bg-muted/50 border border-border hover:underline inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            {item.ten_trang_thai || item.id_trang_thai}
          </a>
        ) : (
          <span className="text-xs font-medium text-foreground px-2 py-0.5 rounded-full bg-muted/50 border border-border">
            —
          </span>
        );
      case 'thuong_hieu':
        return (
          <span className="text-sm text-foreground">{item.thuong_hieu ?? '—'}</span>
        );
      case 'model':
        return (
          <span className="text-sm text-foreground font-mono">{item.model ?? '—'}</span>
        );
      case 'serial':
        return (
          <span className="text-sm text-foreground font-mono">{item.serial ?? '—'}</span>
        );
      case 'xuat_xu':
        return (
          <span className="text-sm text-foreground">{item.xuat_xu ?? '—'}</span>
        );
      case 'ma_barcode':
        return (
          <span className="text-sm text-foreground font-mono">{item.ma_barcode ?? '—'}</span>
        );
      case 'ten_nha_cung_cap':
        return (
          <span className="text-sm text-foreground">{item.ten_nha_cung_cap ?? '—'}</span>
        );
      case 'ten_nguoi_tao':
        return (
          <span className="text-sm text-foreground">{item.ten_nguoi_tao ?? '—'}</span>
        );
      case 'ten_nhan_vien_dang_giu':
        return item.ten_nhan_vien_dang_giu ? (
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">{item.ten_nhan_vien_dang_giu}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      case 'ngay_nhap':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDate(item.ngay_nhap)}
          </span>
        );
      case 'nguyen_gia':
        return item.nguyen_gia != null ? (
          <span className="text-sm tabular-nums">{formatCurrency(item.nguyen_gia)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      case 'trang_thai':
        return renderStatusBadge(item.trang_thai);
      case 'tg_cap_nhat':
        return (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDateTimeShort(item.tg_cap_nhat)}
          </span>
        );
      case 'actions':
        if (!showActions) return null;
        return (
          <div className="flex items-center justify-center gap-1">
            {canUpdate && (
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
            )}
            {canDelete && (
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
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: TaiSan, isSelected: boolean) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView?.(item)}
      onKeyDown={(e) => e.key === 'Enter' && onView?.(item)}
      className={`bg-card rounded-xl border p-3.5 shadow-sm transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        {item.hinh_anh ? (
          <img
            src={item.hinh_anh}
            alt=""
            className="h-11 w-11 rounded-lg object-cover border border-border shrink-0"
          />
        ) : (
          <div className="h-11 w-11 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Building2 size={20} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-foreground text-sm truncate">{item.ten_tai_san}</h4>
            {showActions && (
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(item.id)}
                  className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                  aria-label={t('common.select')}
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{item.ma_tai_san}</span>
            <span className="text-xs text-muted-foreground">{item.ten_nhom || '—'}</span>
            {renderStatusBadge(item.trang_thai)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-body-sm mb-2">
        <div>
          <p className="text-muted-foreground text-xs">{t('danhSachTaiSan.store.noiLuuCol')}</p>
          <p className="font-medium truncate">{item.ten_noi_luu || '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t('danhSachTaiSan.store.nguoiGiuCol')}</p>
          <p className="font-medium truncate">{item.ten_nhan_vien_dang_giu || '—'}</p>
        </div>
      </div>
      {(showActions && (canUpdate || canDelete)) && (
        <div className="flex justify-end gap-1.5 pt-2 border-t border-border">
          {canUpdate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2 text-primary bg-primary/5 rounded-lg text-sm"
            >
              <Edit size={14} className="mr-1 inline" /> {t('common.edit')}
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="p-2 text-rose-500 bg-rose-50 rounded-lg text-sm"
            >
              <Trash2 size={14} className="mr-1 inline" /> {t('common.delete')}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('danhSachTaiSan.loading')}
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

export default TaiSanTable;
