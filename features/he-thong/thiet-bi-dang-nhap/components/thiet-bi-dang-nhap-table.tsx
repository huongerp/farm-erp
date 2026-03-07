import React from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, Monitor, Smartphone, Tablet } from 'lucide-react';
import { LoginDevice } from '../core/types';
import { useLoginDeviceStore } from '../store/useLoginDeviceStore';
import GenericTable from '../../../../components/shared/GenericTable';
import { formatDateTimeShort } from '../../../../lib/utils';
import Tooltip from '../../../../components/ui/Tooltip';

interface Props {
  data: LoginDevice[];
  isLoading: boolean;
  onLogout: (item: LoginDevice) => void;
}

const getDeviceTypeIcon = (loai: string) => {
  switch (loai) {
    case 'mobile':
      return Smartphone;
    case 'tablet':
      return Tablet;
    default:
      return Monitor;
  }
};

const LoginDeviceTable: React.FC<Props> = ({ data, isLoading, onLogout }) => {
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
  } = useLoginDeviceStore();

  const renderStatusBadge = (item: LoginDevice) => {
    if (item.trang_thai === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
          {item.la_thiet_bi_hien_tai && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
          {item.la_thiet_bi_hien_tai
            ? t('loginDevices.currentDevice')
            : t('loginDevices.status.active')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
        {t('loginDevices.status.inactive')}
      </span>
    );
  };

  const renderCell = (colId: string, item: LoginDevice) => {
    const IconDevice = getDeviceTypeIcon(item.loai_thiet_bi);
    switch (colId) {
      case 'ten_user':
        return (
          <div className="flex flex-col gap-0.5 min-w-[160px]">
            <span className="font-medium text-foreground text-sm">{item.ten_user}</span>
            <span className="text-xs text-muted-foreground">{item.email_user}</span>
          </div>
        );
      case 'ten_thiet_bi':
        return (
          <div className="flex items-center gap-2 min-w-[180px]">
            <div className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground">
              <IconDevice size={14} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground text-sm">{item.ten_thiet_bi}</span>
              <span className="text-xs text-muted-foreground">
                {item.trinh_duyet} • {item.he_dieu_hanh}
              </span>
            </div>
          </div>
        );
      case 'dia_chi_ip':
        return (
          <span className="font-mono text-sm text-muted-foreground">{item.dia_chi_ip}</span>
        );
      case 'tg_dang_nhap_cuoi':
        return (
          <span className="text-sm text-muted-foreground">
            {formatDateTimeShort(item.tg_dang_nhap_cuoi)}
          </span>
        );
      case 'trang_thai':
        return renderStatusBadge(item);
      case 'actions':
        return (
          <div className="flex items-center justify-center">
            <Tooltip
              content={
                item.la_thiet_bi_hien_tai
                  ? t('loginDevices.cannotLogoutCurrent')
                  : item.trang_thai === 1
                    ? t('loginDevices.logoutDevice')
                    : '—'
              }
              placement="left"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.la_thiet_bi_hien_tai && item.trang_thai === 1) {
                    onLogout(item);
                  }
                }}
                disabled={item.la_thiet_bi_hien_tai || item.trang_thai === 0}
                className={`
                  p-2 rounded-lg transition-all
                  ${
                    item.la_thiet_bi_hien_tai || item.trang_thai === 0
                      ? 'text-muted-foreground/40 cursor-not-allowed'
                      : 'text-amber-600 hover:bg-amber-500/10 hover:text-amber-700'
                  }
                `}
              >
                <LogOut size={16} />
              </button>
            </Tooltip>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (item: LoginDevice, isSelected: boolean) => {
    const IconDevice = getDeviceTypeIcon(item.loai_thiet_bi);
    return (
      <div
        key={item.id}
        className={`bg-card rounded-xl border p-4 shadow-sm transition-all ${
          isSelected ? 'border-primary ring-2 ring-primary/10' : 'border-border'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-muted/60 text-muted-foreground">
            <IconDevice size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h4 className="font-semibold text-foreground truncate">{item.ten_user}</h4>
                <p className="text-xs text-muted-foreground">{item.ten_thiet_bi}</p>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelection(item.id)}
                  className="w-5 h-5 rounded border-border text-primary accent-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2 bg-muted rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">IP</p>
                <p className="text-body-sm font-mono font-medium">{item.dia_chi_ip}</p>
              </div>
              <div className="p-2 bg-muted rounded-lg border border-border">
                <p className="text-xs text-muted-foreground mb-0.5">{t('loginDevices.store.lastLoginCol')}</p>
                <p className="text-body-sm font-medium">{formatDateTimeShort(item.tg_dang_nhap_cuoi)}</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <div className="scale-90 origin-left">{renderStatusBadge(item)}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.la_thiet_bi_hien_tai && item.trang_thai === 1) {
                    onLogout(item);
                  }
                }}
                disabled={item.la_thiet_bi_hien_tai || item.trang_thai === 0}
                className="p-2 text-amber-600 bg-amber-500/10 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={t('loginDevices.loading')}
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
    />
  );
};

export default LoginDeviceTable;
